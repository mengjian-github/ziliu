import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { videoContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// 请求验证schema
const getVideoContentSchema = z.object({
  articleId: z.string(),
  platform: z.enum(['video_wechat', 'douyin', 'bilibili', 'xiaohongshu', 'youtube']),
});

const saveVideoContentSchema = z.object({
  articleId: z.string(),
  platform: z.enum(['video_wechat', 'douyin', 'bilibili', 'xiaohongshu', 'youtube']),
  videoTitle: z.string(),
  videoDescription: z.string(),
  speechScript: z.string(),
  tags: z.array(z.string()),
  coverSuggestion: z.string().optional(),
  coverImage: z.string().optional(),
  coverImage169: z.string().optional(),
  coverImage43: z.string().optional(),
  platformTips: z.array(z.string()).optional(),
  estimatedDuration: z.number().optional(),
});

// GET - 读取视频内容
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const platform = searchParams.get('platform');

    if (!articleId || !platform) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }

    const { articleId: validArticleId, platform: validPlatform } = getVideoContentSchema.parse({
      articleId,
      platform
    });

    // 查询现有的视频内容
    const existingContent = await db
      .select()
      .from(videoContents)
      .where(
        and(
          eq(videoContents.articleId, validArticleId),
          eq(videoContents.platform, validPlatform)
        )
      )
      .limit(1);

    if (existingContent.length === 0) {
      return NextResponse.json({ success: false, error: '未找到内容' }, { status: 404 });
    }

    const content = existingContent[0];

    return NextResponse.json({
      success: true,
      data: {
        title: content.videoTitle,
        description: content.videoDescription,
        speechScript: content.speechScript,
        tags: content.tags ? JSON.parse(content.tags) : [],
        coverSuggestion: content.coverSuggestion,
        coverImage: content.coverImage,
        coverImage169: content.coverImage169,
        coverImage43: content.coverImage43,
        platformTips: content.platformTips ? JSON.parse(content.platformTips) : [],
        estimatedDuration: content.estimatedDuration,
      }
    });

  } catch (error) {
    console.error('读取视频内容失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof z.ZodError ? '参数错误' : '读取失败'
    }, { status: 500 });
  }
}

// POST - 保存视频内容
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = saveVideoContentSchema.parse(body);

    // 检查是否已存在，如果存在则更新，否则创建
    const existingContent = await db
      .select()
      .from(videoContents)
      .where(
        and(
          eq(videoContents.articleId, validatedData.articleId),
          eq(videoContents.platform, validatedData.platform)
        )
      )
      .limit(1);

    const contentData = {
      articleId: validatedData.articleId,
      userId: session.user.id!,
      platform: validatedData.platform,
      videoTitle: validatedData.videoTitle,
      videoDescription: validatedData.videoDescription,
      speechScript: validatedData.speechScript,
      tags: JSON.stringify(validatedData.tags),
      coverSuggestion: validatedData.coverSuggestion,
      coverImage: validatedData.coverImage,
      coverImage169: validatedData.coverImage169,
      coverImage43: validatedData.coverImage43,
      platformTips: JSON.stringify(validatedData.platformTips || []),
      estimatedDuration: validatedData.estimatedDuration,
      updatedAt: new Date(),
    };

    if (existingContent.length > 0) {
      // 更新现有内容
      await db
        .update(videoContents)
        .set(contentData)
        .where(
          and(
            eq(videoContents.articleId, validatedData.articleId),
            eq(videoContents.platform, validatedData.platform)
          )
        );
    } else {
      // 创建新内容
      await db
        .insert(videoContents)
        .values({
          ...contentData,
          createdAt: new Date(),
        });
    }

    return NextResponse.json({
      success: true,
      message: '视频内容保存成功'
    });

  } catch (error) {
    console.error('保存视频内容失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof z.ZodError ? '参数错误' : '保存失败'
    }, { status: 500 });
  }
}
