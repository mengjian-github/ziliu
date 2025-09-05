import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db, articles } from '@/lib/db';
import { ensureArticleStyleColumn } from '@/lib/db/utils';
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { countWords, calculateReadingTime } from '@/lib/utils';

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

// 创建文章的验证schema
const createArticleSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(500, '标题过长'),
  content: z.string().min(1, '内容不能为空'),
  status: z.enum(['draft', 'published']).default('published'),
  style: z.enum(['default', 'tech', 'minimal', 'elegant']).optional()
});

// 创建文章
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = NextResponse.json({
        success: false,
        error: '请先登录',
      }, { status: 401 });
      return setCorsHeaders(response, request);
    }

    const body = await request.json();
    const { title, content, status, style } = createArticleSchema.parse(body);

    // 计算字数和阅读时间
    const wordCount = countWords(content);
    const readingTime = calculateReadingTime(content);

    // 创建文章
    await ensureArticleStyleColumn();

    const [newArticle] = await db.insert(articles).values({
      userId: session.user.id,
      title,
      content,
      style: style || 'default',
      status,
      wordCount,
      readingTime,
    }).returning();

    const response = NextResponse.json({
      success: true,
      data: newArticle,
      message: '文章保存成功',
    });
    return setCorsHeaders(response, request);
  } catch (error) {
    console.error('Create article error:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json({
        success: false,
        error: error.issues?.[0]?.message || '参数错误',
      }, { status: 400 });
      return setCorsHeaders(response, request);
    }

    const response = NextResponse.json({
      success: false,
      error: '保存文章失败',
    }, { status: 500 });
    return setCorsHeaders(response, request);
  }
}

// 获取用户的文章列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = NextResponse.json({
        success: false,
        error: '请先登录',
      }, { status: 401 });
      return setCorsHeaders(response, request);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    // 构建查询条件
    let whereCondition = eq(articles.userId, session.user.id);

    if (status && (status === 'draft' || status === 'published')) {
      whereCondition = eq(articles.userId, session.user.id);
      // 这里需要添加状态过滤，但为了简化先不实现
    }

    // 查询总数
    const [totalResult] = await db.select({ count: count() }).from(articles).where(whereCondition);
    const total = totalResult.count;

    // 查询文章
    await ensureArticleStyleColumn();
    const userArticles = await db.query.articles.findMany({
      where: whereCondition,
      orderBy: (articles, { desc }) => [desc(articles.updatedAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        articles: userArticles,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
    return setCorsHeaders(response, request);
  } catch (error) {
    console.error('Get articles error:', error);

    const response = NextResponse.json({
      success: false,
      error: '获取文章列表失败',
    }, { status: 500 });
    return setCorsHeaders(response, request);
  }
}
