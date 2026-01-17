import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { shortTextContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const contentSchema = z.object({
    articleId: z.string(),
    platform: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.any()).optional(),
    coverImage: z.string().optional(),
    coverSuggestion: z.string().optional(),
});

// GET: 获取保存的短图文内容
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const articleId = searchParams.get('articleId');
        const platform = searchParams.get('platform');

        if (!articleId || !platform) {
            return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
        }

        const existingContent = await db.query.shortTextContents.findFirst({
            where: and(
                eq(shortTextContents.articleId, articleId),
                eq(shortTextContents.platform, platform),
                eq(shortTextContents.userId, session.user.id)
            ),
        });

        if (!existingContent) {
            return NextResponse.json({ success: false, error: '未找到内容' }, { status: 404 });
        }

        let tags = [];
        let images = [];

        try {
            if (existingContent.tags) tags = JSON.parse(existingContent.tags);
            if (existingContent.images) images = JSON.parse(existingContent.images);
        } catch (e) {
            console.warn('解析JSON失败', e);
        }

        return NextResponse.json({
            success: true,
            data: {
                title: existingContent.title,
                content: existingContent.content,
                tags,
                images,
                coverImage: existingContent.coverImage,
                coverSuggestion: existingContent.coverSuggestion
            }
        });

    } catch (error) {
        console.error('获取短图文内容失败:', error);
        return NextResponse.json({ success: false, error: '获取内容失败' }, { status: 500 });
    }
}

// POST: 保存短图文内容
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
        }

        const body = await request.json();
        const data = contentSchema.parse(body);

        const existingContent = await db.query.shortTextContents.findFirst({
            where: and(
                eq(shortTextContents.articleId, data.articleId),
                eq(shortTextContents.platform, data.platform),
                eq(shortTextContents.userId, session.user.id)
            ),
        });

        const contentToSave = {
            title: data.title || '',
            content: data.content || '',
            tags: JSON.stringify(data.tags || []),
            images: JSON.stringify(data.images || []),
            coverImage: data.coverImage,
            coverSuggestion: data.coverSuggestion,
            updatedAt: new Date()
        };

        if (existingContent) {
            await db.update(shortTextContents)
                .set(contentToSave)
                .where(eq(shortTextContents.id, existingContent.id));
        } else {
            await db.insert(shortTextContents).values({
                id: crypto.randomUUID(),
                articleId: data.articleId,
                userId: session.user.id,
                platform: data.platform,
                ...contentToSave
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('保存短图文内容失败:', error);
        return NextResponse.json({ success: false, error: '保存内容失败' }, { status: 500 });
    }
}
