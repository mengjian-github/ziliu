#!/usr/bin/env node

/**
 * 视频平台数据库迁移脚本
 * 执行add-video-platforms.sql迁移文件
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 开始执行视频平台数据库迁移...');

  // 创建数据库客户端
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../src/lib/db/migrations/add-video-platforms.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 读取迁移文件:', migrationPath);
    
    // 更智能的SQL语句分割（处理多行语句和注释）
    const statements = migrationSQL
      // 移除注释行
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      // 按分号分割，但保留完整的CREATE语句
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.length > 10) // 过滤掉空语句和过短的语句
      .map(stmt => stmt.endsWith(';') ? stmt : stmt + ';'); // 确保每个语句都以分号结尾

    console.log(`📝 发现 ${statements.length} 个SQL语句需要执行`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚡ 执行语句 ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        await client.execute(statement);
        console.log(`✅ 语句 ${i + 1} 执行成功`);
      } catch (error) {
        // 如果是"表已存在"这类错误，可能是正常的
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  语句 ${i + 1} 跳过（表或索引已存在）`);
          continue;
        }
        throw error;
      }
    }

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    
    // 检查video_contents表是否创建成功
    const tableCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='video_contents'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ video_contents表创建成功');
    } else {
      throw new Error('video_contents表创建失败');
    }

    // 检查索引是否创建成功
    const indexCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_video_contents_%'
    `);
    
    console.log(`✅ 创建了 ${indexCheck.rows.length} 个索引`);

    // 检查触发器是否创建成功
    const triggerCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name LIKE '%video_contents%'
    `);
    
    console.log(`✅ 创建了 ${triggerCheck.rows.length} 个触发器`);

    console.log('🎉 视频平台数据库迁移完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// 如果直接执行此脚本
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };