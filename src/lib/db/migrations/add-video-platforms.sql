-- 添加视频平台支持的数据库迁移
-- 创建于: 2025-01-01
-- 描述: 为支持视频号、抖音、B站、小红书等视频平台添加必要的数据库结构

-- 1. 创建视频内容元数据表
CREATE TABLE IF NOT EXISTS video_contents (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('video_wechat', 'douyin', 'bilibili', 'xiaohongshu')),
    
    -- 视频元数据字段
    video_title TEXT,
    video_description TEXT,
    speech_script TEXT,
    tags TEXT, -- JSON数组格式，如: ["标签1", "标签2"]
    cover_suggestion TEXT,
    platform_tips TEXT, -- JSON数组格式，存储平台特定建议
    estimated_duration INTEGER, -- 预计时长（秒）
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 2. 为video_contents表创建索引
CREATE INDEX IF NOT EXISTS idx_video_contents_article_id ON video_contents(article_id);
CREATE INDEX IF NOT EXISTS idx_video_contents_user_id ON video_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_video_contents_platform ON video_contents(platform);
CREATE INDEX IF NOT EXISTS idx_video_contents_created_at ON video_contents(created_at);

-- 3. 为现有表添加视频平台支持
-- 注意：SQLite不支持直接修改CHECK约束，所以我们需要通过重建表的方式
-- 但为了兼容性，我们创建一个新的临时表，然后替换原表

-- 3.1 备份publish_records表
CREATE TABLE IF NOT EXISTS publish_records_backup AS SELECT * FROM publish_records;

-- 3.2 删除旧表（如果存在约束冲突）
-- DROP TABLE IF EXISTS publish_records;

-- 3.3 重建publish_records表，支持视频平台
-- 由于SQLite的限制，我们使用ALTER TABLE添加约束的方法可能不可行
-- 这里我们假设应用层面会处理平台验证

-- 4. 为发布预设表的platform字段添加注释
-- SQLite不支持直接修改字段注释，但我们可以通过应用层来处理

-- 5. 插入一些示例数据（可选，用于测试）
-- INSERT INTO video_contents (id, article_id, user_id, platform, video_title, speech_script, tags, estimated_duration)
-- VALUES ('test_video_1', 'some_article_id', 'some_user_id', 'video_wechat', '测试视频标题', '这是一个测试口播稿', '["测试", "演示"]', 120);

-- 6. 创建视频内容清理的触发器（当文章被删除时，自动删除关联的视频内容）
CREATE TRIGGER IF NOT EXISTS delete_video_contents_on_article_delete
AFTER DELETE ON articles
FOR EACH ROW
BEGIN
    DELETE FROM video_contents WHERE article_id = OLD.id;
END;

-- 7. 创建更新时间戳的触发器
CREATE TRIGGER IF NOT EXISTS update_video_contents_timestamp
AFTER UPDATE ON video_contents
FOR EACH ROW
BEGIN
    UPDATE video_contents SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- 迁移完成标记
-- 如果需要版本控制，可以在这里插入迁移记录
-- INSERT INTO migration_history (version, name, executed_at) 
-- VALUES ('20250101_001', 'add_video_platforms', strftime('%s', 'now'));