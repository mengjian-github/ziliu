'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EditorLayout } from '@/components/editor/editor-layout';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';
import { ArticleCreationGuard } from '@/lib/subscription/components/FeatureGuard';
import { useStableSession } from '@/hooks/use-stable-session';

export default function NewEditorPage() {
  const { session, isUnauthenticated, isInitialLoading } = useStableSession();
  const router = useRouter();
  const { refreshUsage } = useUserPlan();

  useEffect(() => {
    if (isUnauthenticated) {
      router.push('/auth/signin');
    }
  }, [isUnauthenticated, router]);

  const handleSave = async (title: string, content: string) => {
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          status: 'draft',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 保存成功，更新使用统计并跳转到编辑页面
        console.log('文章保存成功:', data.data);
        refreshUsage(); // 刷新文章数量统计
        router.push(`/editor/${data.data.id}`);
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存文章失败:', error);
      throw error;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ArticleCreationGuard>
      <EditorLayout onSave={handleSave} />
    </ArticleCreationGuard>
  );
}
