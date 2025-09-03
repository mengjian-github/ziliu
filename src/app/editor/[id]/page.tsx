'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { EditorLayout } from '@/components/editor/editor-layout';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // 获取文章详情
    fetchArticle();
  }, [session, status, router, articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/articles/${articleId}`);
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
      setLoading(false);
    }
  };

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">出错了</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">文章不存在</h2>
          <p className="text-gray-600 mb-4">您要编辑的文章不存在或已被删除</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
