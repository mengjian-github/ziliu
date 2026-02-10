import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getAuthUser } from '@/lib/middleware/api-key-auth';
import { db, articles } from '@/lib/db';
import { ensureArticleStyleColumn } from '@/lib/db/utils';
import { eq, and } from 'drizzle-orm';
import { convertToWechatInline, WECHAT_STYLES } from '@/lib/converter';

// CORS headers for Chrome extension
function setCorsHeaders(response: NextResponse, request?: NextRequest) {
  // 获取请求的origin
  const origin = request?.headers.get('origin');

  // 从环境变量获取应用URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 允许的源列表
  const allowedOrigins = [
    appUrl,
    'https://mp.weixin.qq.com',
    // Chrome扩展的origin格式
  ];

  // 如果是Chrome扩展请求，允许所有chrome-extension://开头的origin
  if (origin?.startsWith('chrome-extension://')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', appUrl);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return setCorsHeaders(new NextResponse(null, { status: 200 }), request);
}

// 获取单个文章详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await context.params;
    await ensureArticleStyleColumn();
    const user = await getAuthUser(request);
    if (!user?.id) {
      const response = NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
      return setCorsHeaders(response, request);
    }

    // articleId already read from awaited params above

    // 查询文章
    const article = await db.query.articles.findFirst({
      where: and(
        eq(articles.id, articleId),
        eq(articles.userId, user.id)
      ),
    });

    if (!article) {
      const response = NextResponse.json({
        success: false,
        error: '文章不存在或无权访问',
        code: 'NOT_FOUND'
      }, { status: 404 });
      return setCorsHeaders(response, request);
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    // 样式优先级：URL参数 > 文章保存的样式 > 默认
    const requestedStyle = searchParams.get('style');
    let style = 'default';
    if (requestedStyle) {
      style = requestedStyle;
    } else if (article && (article as any).style) {
      style = (article as any).style as string;
    }
    const format = searchParams.get('format') || 'raw'; // 'raw', 'html', 'inline'

    let processedContent = article.content;

    // 根据格式参数处理内容
    if (format === 'inline') {
      // 生成带内联样式的HTML，用于公众号编辑器
      try {
        processedContent = convertToWechatInline(
          article.content,
          style as keyof typeof WECHAT_STYLES
        );
      } catch (error) {
        console.error('转换内联样式失败:', error);
        // 如果转换失败，返回原始内容
      }
    }

    // 返回文章详情
    const articleData = {
      id: article.id,
      title: article.title,
      content: processedContent,
      originalContent: article.content, // 始终返回原始Markdown内容
      status: article.status,
      wordCount: article.wordCount,
      readingTime: article.readingTime,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      style: style,
      format: format
    };

    const response = NextResponse.json({
      success: true,
      data: articleData
    });
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error('获取文章详情失败:', error);

    const response = NextResponse.json({
      success: false,
      error: '获取文章详情失败',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
    return setCorsHeaders(response, request);
  }
}

// 更新文章
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await context.params;
    await ensureArticleStyleColumn();
    const user = await getAuthUser(request);
    if (!user?.id) {
      const response = NextResponse.json({
        success: false,
        error: '请先登录',
      }, { status: 401 });
      return setCorsHeaders(response, request);
    }

    const body = await request.json();
    const { title, content, status, style } = body;

    // 验证文章是否存在且属于当前用户
    const existingArticle = await db.query.articles.findFirst({
      where: and(
        eq(articles.id, articleId),
        eq(articles.userId, user.id)
      ),
    });

    if (!existingArticle) {
      const response = NextResponse.json({
        success: false,
        error: '文章不存在或无权访问',
      }, { status: 404 });
      return setCorsHeaders(response, request);
    }

    // 更新文章
    const [updatedArticle] = await db.update(articles)
      .set({
        title: title || existingArticle.title,
        content: content || existingArticle.content,
        status: status || existingArticle.status,
        style: style || (existingArticle as any).style || 'default',
        updatedAt: new Date(),
      })
      .where(eq(articles.id, articleId))
      .returning();

    const response = NextResponse.json({
      success: true,
      data: updatedArticle,
      message: '文章更新成功',
    });
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error('更新文章失败:', error);

    const response = NextResponse.json({
      success: false,
      error: '更新文章失败',
    }, { status: 500 });
    return setCorsHeaders(response, request);
  }
}

// 删除文章
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await context.params;
    await ensureArticleStyleColumn();
    const user = await getAuthUser(request);
    if (!user?.id) {
      const response = NextResponse.json({
        success: false,
        error: '请先登录',
      }, { status: 401 });
      return setCorsHeaders(response, request);
    }


    // 验证文章是否存在且属于当前用户
    const existingArticle = await db.query.articles.findFirst({
      where: and(
        eq(articles.id, articleId),
        eq(articles.userId, user.id)
      ),
    });

    if (!existingArticle) {
      const response = NextResponse.json({
        success: false,
        error: '文章不存在或无权访问',
      }, { status: 404 });
      return setCorsHeaders(response, request);
    }

    // 删除文章
    await db.delete(articles).where(eq(articles.id, articleId));

    const response = NextResponse.json({
      success: true,
      message: '文章删除成功',
    });
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error('删除文章失败:', error);

    const response = NextResponse.json({
      success: false,
      error: '删除文章失败',
    }, { status: 500 });
    return setCorsHeaders(response, request);
  }
}
