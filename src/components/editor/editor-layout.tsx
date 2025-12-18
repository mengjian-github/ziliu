'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MultiPlatformEditor } from './multi-platform-editor';
import { PlatformPreview } from './platform-preview';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { countWords, calculateReadingTime } from '@/lib/utils';
import { FeishuImportDialog } from './feishu-import-dialog';

export type Platform = 'wechat' | 'zhihu' | 'juejin' | 'zsxq';

interface EditorLayoutProps {
  initialTitle?: string;
  initialContent?: string;
  articleId?: string;
  onSave?: (title: string, content: string) => Promise<void>;
}

export function EditorLayout({
  initialTitle = '',
  initialContent = '',
  articleId,
  onSave
}: EditorLayoutProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const draftStorageKey = useMemo(() => {
    const key = articleId ? `ziliu:editor:draft:${articleId}` : 'ziliu:editor:draft:new';
    return key;
  }, [articleId]);

  const baseRef = useRef({ title: initialTitle, content: initialContent });
  const persistTimerRef = useRef<number | null>(null);

  const isDirty = title !== baseRef.current.title || content !== baseRef.current.content;

  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { title?: unknown; content?: unknown; updatedAt?: unknown };
      const draftTitle = typeof parsed.title === 'string' ? parsed.title : undefined;
      const draftContent = typeof parsed.content === 'string' ? parsed.content : undefined;

      const hasAnyDraft = Boolean((draftTitle && draftTitle.trim()) || (draftContent && draftContent.trim()));
      if (!hasAnyDraft) {
        localStorage.removeItem(draftStorageKey);
        return;
      }

      const base = baseRef.current;
      const effectiveTitle = draftTitle ?? base.title;
      const effectiveContent = draftContent ?? base.content;
      const differsFromBase = effectiveTitle !== base.title || effectiveContent !== base.content;

      if (differsFromBase) {
        setTitle(effectiveTitle);
        setContent(effectiveContent);
        showToast('已恢复未保存草稿（本地）', 'info');
      } else {
        localStorage.removeItem(draftStorageKey);
      }
    } catch {
      localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, showToast]);

  useEffect(() => {
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    if (!isDirty) {
      localStorage.removeItem(draftStorageKey);
      return;
    }

    persistTimerRef.current = window.setTimeout(() => {
      const payload = {
        title,
        content,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    }, 400);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [title, content, isDirty, draftStorageKey]);

  // 处理编辑器内容变化
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // 计算统计信息
  const wordCount = countWords(content);
  const readingTime = calculateReadingTime(content);

  // 保存文章
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('请填写标题和内容', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(title, content);
        baseRef.current = { title, content };
        localStorage.removeItem(draftStorageKey);
        setLastSaved(new Date());
        showToast('保存成功', 'success');
      }
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 处理飞书导入
  const handleFeishuImport = (importedTitle: string, importedContent: string) => {
    if (importedTitle && !title.trim()) {
      setTitle(importedTitle);
    }
    if (importedContent) {
      setContent(importedContent);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#020617] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] pointer-events-none rounded-full mix-blend-screen opacity-20" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 blur-[120px] pointer-events-none rounded-full mix-blend-screen opacity-20" />

      {/* Toast 提示 */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm backdrop-blur-xl ${toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : toast.type === 'info'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : toast.type === 'info' ? (
            <Info className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 顶部工具栏 */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl z-10 sticky top-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回和统计 */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  返回工作台
                </Button>
              </Link>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex items-center space-x-3 text-sm text-zinc-500">
                <FileText className="h-4 w-4" />
                <span>{wordCount} 字</span>
                <span>·</span>
                <span>预计阅读 {readingTime} 分钟</span>
                {lastSaved && (
                  <>
                    <span>·</span>
                    <span className="text-zinc-600">
                      上次保存: {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 右侧：功能按钮 */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeishuImport(true)}
                className="text-blue-400 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300"
              >
                <Upload className="h-4 w-4 mr-1" />
                导入飞书
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 左右分栏布局 */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* 主编辑区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：编辑器 */}
          <div className="w-1/2 border-r border-white/5 bg-white/[0.02]">
            <MultiPlatformEditor
              title={title}
              content={content}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
            />
          </div>

          {/* 右侧：预览区域 */}
          <div className="w-1/2 bg-black/20">
            <PlatformPreview
              title={title}
              content={content}
              articleId={articleId}
            />
          </div>
        </div>

      </div>

      {/* 飞书导入弹框 */}
      <FeishuImportDialog
        open={showFeishuImport}
        onOpenChange={setShowFeishuImport}
        onImport={handleFeishuImport}
        onShowToast={showToast}
      />
    </div>
  );
}
