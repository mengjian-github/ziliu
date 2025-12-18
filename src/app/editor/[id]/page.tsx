'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EditorLayout } from '@/components/editor/editor-layout';
import { useStableSession } from '@/hooks/use-stable-session';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditArticlePage() {
  const { isAuthenticated, isUnauthenticated, isInitialLoading: isSessionInitialLoading } = useStableSession();
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedArticleIdRef = useRef<string | null>(null);

  const articleId = params.id as string;

  const fetchArticle = useCallback(async (id: string) => {
    try {
      setIsArticleLoading(true);
      setError(null);

      const response = await fetch(`/api/articles/${id}`);
      const data = await response.json();

      if (data.success) {
        setArticle(data.data);
      } else {
        setError(data.error || '获取文章失败');
        if (response.status === 404) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('获取文章失败:', error);
      setError('获取文章失败');
    } finally {
      setIsArticleLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isUnauthenticated) {
      router.push('/auth/signin');
    }
  }, [isUnauthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!articleId) return;

    if (fetchedArticleIdRef.current === articleId) return;
    fetchedArticleIdRef.current = articleId;

    setArticle(null);
    void fetchArticle(articleId);
  }, [isAuthenticated, articleId, fetchArticle]);

  const handleSave = async (title: string, content: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
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
        // 更新本地状态
        setArticle(data.data);
        console.log('文章更新成功:', data.data);
      } else {
        throw new Error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  };

  if (isSessionInitialLoading || (isArticleLoading && !article)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">出错了</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">文章不存在</h2>
          <p className="text-zinc-400 mb-4">您要编辑的文章不存在或已被删除</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditorLayout
      initialTitle={article.title}
      initialContent={article.content}
      articleId={articleId}
      onSave={handleSave}
    />
  );
}
