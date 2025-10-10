import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { marked } from 'marked';
import { authOptions } from '@/lib/auth';
import { checkImageQuota, uploadImageFromUrl } from '@/lib/services/image-service';

interface MarkdownImageInfo {
  raw: string;
  url: string;
  index: number;
}

function collectMarkdownImages(markdown: string): MarkdownImageInfo[] {
  const tokens = marked.lexer(markdown);
  const images: MarkdownImageInfo[] = [];
  let counter = 0;

  const traverseTokens = (tokenList?: any[]) => {
    if (!tokenList) return;
    for (const token of tokenList) {
      if (!token) continue;

      if (token.type === 'image' && typeof token.href === 'string') {
        images.push({
          raw: token.raw,
          url: token.href.trim(),
          index: counter++,
        });
      }

      if (token.tokens && Array.isArray(token.tokens)) {
        traverseTokens(token.tokens);
      }

      if (token.type === 'list' && Array.isArray(token.items)) {
        token.items.forEach((item: any) => traverseTokens(item.tokens));
      }

      if (token.type === 'table') {
        if (Array.isArray(token.header)) {
          token.header.forEach((cell: any) => traverseTokens(cell.tokens));
        }
        if (Array.isArray(token.rows)) {
          token.rows.forEach((row: any[]) =>
            row.forEach((cell: any) => traverseTokens(cell.tokens))
          );
        }
      }

      if (token.type === 'blockquote' && token.tokens) {
        traverseTokens(token.tokens);
      }
    }
  };

  traverseTokens(tokens as any[]);
  return images;
}

function shouldSkipImage(url: string, cdnUrl?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('data:') ||
    lower.startsWith('/') ||
    lower.startsWith('blob:') ||
    lower.startsWith('file:') ||
    lower.startsWith('asset:')
  ) {
    return true;
  }

  if (cdnUrl && trimmed.includes(cdnUrl)) {
    return true;
  }

  // 未带协议的URL通常无法直接下载，跳过处理
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return true;
  }

  return false;
}

function replaceFirstOccurrence(source: string, search: string, replacement: string): string {
  const index = source.indexOf(search);
  if (index === -1) return source;
  return source.slice(0, index) + replacement + source.slice(index + search.length);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const markdown = typeof body?.markdown === 'string' ? body.markdown : '';

    if (!markdown.trim()) {
      return NextResponse.json(
        { success: false, error: '内容不能为空' },
        { status: 400 }
      );
    }

    const allImages = collectMarkdownImages(markdown);
    const totalImages = allImages.length;
    const cdnUrl = process.env.R2_PUBLIC_URL;

    if (totalImages === 0) {
      return NextResponse.json({
        success: true,
        markdown,
        imageCount: 0,
        processedImages: 0,
        imageWarning: '未检测到需要处理的图片'
      });
    }

    const imagesToProcess = allImages.filter(image => !shouldSkipImage(image.url, cdnUrl));
    const targetCount = imagesToProcess.length;

    if (targetCount === 0) {
      return NextResponse.json({
        success: true,
        markdown,
        imageCount: 0,
        processedImages: 0,
        imageWarning: '所有图片已在智流 CDN 或为本地资源，无需转换'
      });
    }

    let hasImageQuota = true;
    let quotaWarning = '';

    try {
      const quotaCheck = await checkImageQuota(session.user.email);
      hasImageQuota = quotaCheck.hasQuota;
      if (!quotaCheck.hasQuota) {
        quotaWarning = quotaCheck.reason || '当月图片额度不足，图片将保留原始链接';
      }
    } catch (error) {
      console.error('检查图片配额失败:', error);
      // 若配额检查失败，为保障体验，先允许继续尝试，具体错误在上传阶段处理
      hasImageQuota = true;
    }

    if (!hasImageQuota) {
      return NextResponse.json({
        success: true,
        markdown,
        imageCount: targetCount,
        processedImages: 0,
        imageWarning: quotaWarning || `${targetCount} 张图片保留原始链接（额度不足）`
      });
    }

    const concurrencyLimit = 3;
    const replacements: Array<{ index: number; original: string; replacement: string }> = [];
    let uploadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < imagesToProcess.length; i += concurrencyLimit) {
      const batch = imagesToProcess.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(async (imageInfo) => {
          try {
            const result = await uploadImageFromUrl(imageInfo.url, session.user.email!);
            return { imageInfo, result };
          } catch (error) {
            console.error('处理Markdown图片失败:', imageInfo.url, error);
            return {
              imageInfo,
              result: {
                success: false,
                error: error instanceof Error ? error.message : '处理失败'
              }
            };
          }
        })
      );

      batchResults.forEach(({ imageInfo, result }) => {
        if (result.success && result.url) {
          const newRaw = imageInfo.raw.replace(imageInfo.url, result.url);
          replacements.push({
            index: imageInfo.index,
            original: imageInfo.raw,
            replacement: newRaw
          });
          uploadedCount++;
        } else {
          failedCount++;
        }
      });
    }

    let updatedMarkdown = markdown;
    replacements
      .sort((a, b) => a.index - b.index)
      .forEach(({ original, replacement }) => {
        updatedMarkdown = replaceFirstOccurrence(updatedMarkdown, original, replacement);
      });

    let warningMessage = quotaWarning;
    if (failedCount > 0 && uploadedCount > 0) {
      warningMessage = warningMessage
        ? `${warningMessage}；成功上传 ${uploadedCount} 张图片，${failedCount} 张图片保留原始链接`
        : `成功上传 ${uploadedCount} 张图片，${failedCount} 张图片保留原始链接`;
    } else if (failedCount > 0) {
      warningMessage = warningMessage
        ? `${warningMessage}；${failedCount} 张图片保留原始链接（上传失败）`
        : `${failedCount} 张图片保留原始链接（上传失败）`;
    } else if (uploadedCount > 0) {
      warningMessage = warningMessage
        ? `${warningMessage}；成功上传 ${uploadedCount} 张图片`
        : `成功上传 ${uploadedCount} 张图片`;
    }

    return NextResponse.json({
      success: true,
      markdown: updatedMarkdown,
      imageCount: targetCount,
      processedImages: uploadedCount,
      imageWarning: warningMessage || undefined
    });
  } catch (error) {
    console.error('Markdown图片批量转换失败:', error);
    return NextResponse.json(
      { success: false, error: '图片批量转换失败，请稍后重试' },
      { status: 500 }
    );
  }
}
