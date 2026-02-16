import { db, articles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { convertToWechatInline, WECHAT_STYLES } from '@/lib/converter';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ style?: string; mode?: string }>;
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  return {
    title: article?.title ? `${article.title} - 字流预览` : '文章预览 - 字流',
    description: article?.content?.slice(0, 120),
  };
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { id } = await params;
  const { style = 'default', mode = 'day' } = await searchParams;

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  if (!article) {
    notFound();
  }

  // Convert markdown to inline-styled HTML
  const themeMode = mode === 'night' ? 'night' : 'day';
  const styleKey = (style in WECHAT_STYLES ? style : 'default') as keyof typeof WECHAT_STYLES;
  const htmlContent = convertToWechatInline(article.content, styleKey, themeMode);

  const isNight = themeMode === 'night';
  const bgColor = isNight ? '#111111' : '#f5f5f5';
  const containerBg = isNight ? '#1e1e1e' : '#ffffff';
  const titleColor = isNight ? '#e8e8e8' : '#1a1a1a';
  const metaColor = isNight ? '#888888' : '#999999';
  const footerBg = isNight ? '#2a2a2a' : '#f0f7ff';
  const footerTextColor = isNight ? '#cccccc' : '#333333';
  const footerAccent = isNight ? '#60A5FA' : '#1890ff';

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            background: ${bgColor};
            line-height: 1.8;
            -webkit-font-smoothing: antialiased;
          }
          .preview-container {
            max-width: 680px;
            margin: 0 auto;
            background: ${containerBg};
            padding: 24px 20px;
            min-height: 100vh;
          }
          .preview-title {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 8px;
            color: ${titleColor};
            text-align: center;
          }
          .preview-meta {
            color: ${metaColor};
            font-size: 14px;
            margin-bottom: 24px;
            text-align: center;
          }
          .preview-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
            display: block;
          }
          .preview-footer {
            background: ${footerBg};
            border-radius: 8px;
            padding: 16px;
            margin-top: 32px;
            text-align: center;
            font-size: 15px;
            color: ${footerTextColor};
          }
          .preview-footer strong {
            color: ${footerAccent};
          }
          .preview-toolbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.85);
            padding: 8px 16px;
            display: flex;
            justify-content: center;
            gap: 12px;
            z-index: 100;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .preview-toolbar a {
            color: #fff;
            text-decoration: none;
            font-size: 13px;
            padding: 6px 14px;
            border-radius: 16px;
            background: rgba(255,255,255,0.15);
            transition: background 0.2s;
          }
          .preview-toolbar a:hover, .preview-toolbar a.active {
            background: #1890ff;
          }
          @media (max-width: 680px) {
            .preview-container { padding: 16px 16px 80px; }
          }
        `}} />
      </head>
      <body>
        <div className="preview-container">
          <h1 className="preview-title">{article.title}</h1>
          <p className="preview-meta">
            字流预览 · {new Date(article.createdAt).toLocaleDateString('zh-CN')}
          </p>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          <div className="preview-footer">
            <strong>✍️ 孟健AI编程</strong><br />
            关注我，一起用AI改变工作方式
          </div>
        </div>
        <div className="preview-toolbar">
          <a href={`/preview/${id}?style=${style}&mode=day`} className={themeMode === 'day' ? 'active' : ''}>
            ☀️ 日间
          </a>
          <a href={`/preview/${id}?style=${style}&mode=night`} className={themeMode === 'night' ? 'active' : ''}>
            🌙 夜间
          </a>
          {Object.entries(WECHAT_STYLES).slice(0, 5).map(([key, theme]) => (
            <a
              key={key}
              href={`/preview/${id}?style=${key}&mode=${themeMode}`}
              className={style === key ? 'active' : ''}
            >
              {theme.name}
            </a>
          ))}
        </div>
      </body>
    </html>
  );
}
