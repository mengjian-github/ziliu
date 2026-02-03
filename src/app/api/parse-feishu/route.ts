import { NextRequest, NextResponse } from 'next/server';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkImageQuota, uploadImageFromUrl } from '@/lib/services/image-service';


/**
 * 统计HTML中的图片数量（需要上传的）
 */
function countImagesInHtml(html: string): number {
  const imgRegex = /<img[^>]*>/g;
  const imgTags = Array.from(html.matchAll(imgRegex));
  
  let count = 0;
  for (const imgMatch of imgTags) {
    const fullImgTag = imgMatch[0];
    const srcMatch = fullImgTag.match(/src="([^"]+)"/);
    if (!srcMatch) continue;
    
    const originalSrc = srcMatch[1];
    
    // 跳过已经是base64或本地URL的图片
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('/') || 
        originalSrc.includes(process.env.R2_PUBLIC_URL || '')) {
      continue;
    }
    
    count++;
  }
  
  return count;
}


export async function POST(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: '内容不能为空' },
        { status: 400 }
      );
    }

    // 解析飞书内容，包括图片上传处理（会在内部做降级处理）
    const result = await parseFeishuContent(content, session);

    return NextResponse.json({
      success: true,
      title: result.title,
      markdown: result.markdown,
      imageWarning: result.imageWarning, // 添加图片处理警告信息
      imageCount: result.imageCount, // 添加图片数量信息
      processedImages: result.processedImages // 添加已处理图片数量
    });
  } catch (error) {
    console.error('解析飞书内容失败:', error);
    return NextResponse.json(
      { success: false, error: '解析失败' },
      { status: 500 }
    );
  }
}

async function parseFeishuContent(htmlContent: string, session: any): Promise<{ 
  title: string; 
  markdown: string; 
  imageWarning?: string; 
  imageCount?: number;
  processedImages?: number;
}> {
  // 先处理图片上传，然后转换HTML到Markdown
  const imageResult = await processImagesInHtml(htmlContent, session);
  const markdown = convertHtmlToMarkdownWithTurndown(imageResult.processedHtml);

  return { 
    title: '', 
    markdown,
    imageWarning: imageResult.warning,
    imageCount: imageResult.totalImages,
    processedImages: imageResult.processedImages
  };
}

// 处理HTML中的图片，上传到图床并替换URL
async function processImagesInHtml(html: string, session: any): Promise<{
  processedHtml: string;
  warning?: string;
  totalImages?: number;
  processedImages?: number;
}> {
  // 检查用户图片权限
  let hasImageQuota = true;
  let quotaWarning = '';
  
  if (!session?.user?.email) {
    hasImageQuota = false;
    quotaWarning = '用户未登录，飞书图片将保留原始链接';
  } else {
    try {
      // 使用公共服务检查用户配额
      const quotaCheck = await checkImageQuota(session.user.email);
      hasImageQuota = quotaCheck.hasQuota;
      
      if (!hasImageQuota) {
        quotaWarning = quotaCheck.reason || '当月图片额度不足，飞书图片将保留原始链接';
      }
    } catch (error) {
      console.error('检查图片配额失败:', error);
      // 如果检查失败，为了用户体验，先允许尝试上传，让具体上传时再处理错误
      hasImageQuota = true;
    }
  }

  // 使用正则表达式匹配所有img标签，并提取src属性
  const imgRegex = /<img[^>]*>/g;
  let processedHtml = html;
  const imgTags = Array.from(html.matchAll(imgRegex));
  
  // 如果没有图片需要处理，直接返回
  if (imgTags.length === 0) {
    return { 
      processedHtml, 
      warning: quotaWarning || undefined,
      totalImages: 0,
      processedImages: 0
    };
  }

  // 收集所有需要处理的图片信息
  const imagesToProcess: Array<{
    fullImgTag: string;
    originalSrc: string;
    index: number;
  }> = [];

  imgTags.forEach((imgMatch, index) => {
    const fullImgTag = imgMatch[0];
    const srcMatch = fullImgTag.match(/src="([^"]+)"/);
    if (!srcMatch) return;

    const originalSrc = srcMatch[1];
    
    // 跳过已经是base64或本地URL的图片
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('/') || 
        originalSrc.includes(process.env.R2_PUBLIC_URL || '')) {
      return;
    }

    imagesToProcess.push({ fullImgTag, originalSrc, index });
  });

  // 如果没有需要处理的图片，直接返回
  if (imagesToProcess.length === 0) {
    return { 
      processedHtml, 
      warning: quotaWarning || undefined,
      totalImages: imgTags.length,
      processedImages: 0
    };
  }

  // 如果没有图片额度，直接返回不处理
  if (!hasImageQuota) {
    return { 
      processedHtml, 
      warning: quotaWarning || `${imagesToProcess.length} 张图片保留原始链接（额度不足）`,
      totalImages: imagesToProcess.length,
      processedImages: 0
    };
  }

  let uploadedCount = 0;
  let failedCount = 0;

  console.log(`开始并行处理 ${imagesToProcess.length} 张图片`);
  
  // 并行处理所有图片，设置合理的并发数限制
  const concurrencyLimit = 3; // 限制并发数为3，避免过多并发请求
  const results = await processImagesInBatches(imagesToProcess, concurrencyLimit, session.user.email);

  // 应用处理结果
  results.forEach(({ imageInfo, uploadResult }) => {
    if (uploadResult.success && uploadResult.url) {
      processedHtml = processedHtml.replace(
        imageInfo.fullImgTag, 
        imageInfo.fullImgTag.replace(imageInfo.originalSrc, uploadResult.url)
      );
      console.log('图片上传成功:', imageInfo.originalSrc, '->', uploadResult.url);
      uploadedCount++;
    } else {
      console.warn('图片上传失败，保留原始URL:', imageInfo.originalSrc, uploadResult.error);
      failedCount++;
    }
  });

  // 生成警告消息
  let warning = quotaWarning;
  if (failedCount > 0 && uploadedCount > 0) {
    warning = warning || `成功上传 ${uploadedCount} 张图片，${failedCount} 张图片保留原始链接`;
  } else if (failedCount > 0) {
    warning = warning || `${failedCount} 张图片保留原始链接（上传失败）`;
  } else if (uploadedCount > 0) {
    warning = warning || `成功上传 ${uploadedCount} 张图片`;
  }

  return { 
    processedHtml, 
    warning: warning || undefined,
    totalImages: imagesToProcess.length,
    processedImages: uploadedCount
  };
}

// 分批并行处理图片
async function processImagesInBatches(
  imagesToProcess: Array<{
    fullImgTag: string;
    originalSrc: string;
    index: number;
  }>,
  concurrencyLimit: number,
  userEmail: string
) {
  const results: Array<{
    imageInfo: typeof imagesToProcess[0];
    uploadResult: any;
  }> = [];

  // 分批处理
  for (let i = 0; i < imagesToProcess.length; i += concurrencyLimit) {
    const batch = imagesToProcess.slice(i, i + concurrencyLimit);
    
    const batchPromises = batch.map(async (imageInfo) => {
      try {
        console.log('处理图片:', imageInfo.originalSrc);
        const uploadResult = await uploadImageFromUrl(imageInfo.originalSrc, userEmail);
        return { imageInfo, uploadResult };
      } catch (error) {
        console.error('处理图片失败:', imageInfo.originalSrc, error);
        return { 
          imageInfo, 
          uploadResult: { success: false, error: error instanceof Error ? error.message : '处理失败' }
        };
      }
    });

    // 等待当前批次完成
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

// 使用 turndown 库的转换函数，针对飞书特殊结构进行优化
function convertHtmlToMarkdownWithTurndown(html: string): string {
  // 创建 turndown 实例，使用默认配置
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  // 启用 GFM 插件（支持表格、删除线、任务列表）
  turndownService.use(gfm);

  // 添加自定义表格规则，处理没有表头的飞书表格
  turndownService.addRule('feishuTable', {
    filter: function (node: HTMLElement) {
      return node.nodeName === 'TABLE';
    },
    replacement: function (_content: string, node: HTMLElement) {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.rows);
      if (rows.length === 0) return '';

      const result: string[] = [];
      
      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.cells);
        const cellContents = cells.map(cell => {
          // 获取单元格文本内容，清理换行
          let text = cell.textContent?.trim() || '';
          text = text.replace(/\n/g, ' ').replace(/\|/g, '\\|');
          return text;
        });
        
        result.push('| ' + cellContents.join(' | ') + ' |');
        
        // 在第一行后添加分隔行
        if (rowIndex === 0) {
          const separator = cells.map(() => '---').join(' | ');
          result.push('| ' + separator + ' |');
        }
      });

      return '\n\n' + result.join('\n') + '\n\n';
    }
  });

  // 针对飞书特殊结构的预处理
  let cleanHtml = html;

  // 处理飞书特有的 white-space:pre 结构
  // 这种结构通常包含用换行符分隔的多行内容，需要转换为正确的HTML结构
  cleanHtml = cleanHtml.replace(
    /<div[^>]*style="white-space:pre;"[^>]*>([\s\S]*?)<\/div>/g,
    (_match, content: string) => {
      // 将换行符转换为段落标签
      const lines = content.split('\n').filter((line: string) => line.trim());
      return lines.map((line: string) => `<p>${line.trim()}</p>`).join('');
    }
  );

  // 处理飞书特有的包含 white-space:pre 样式的div结构（可能样式属性顺序不同）
  cleanHtml = cleanHtml.replace(
    /<div[^>]*white-space:\s*pre[^>]*>([\s\S]*?)<\/div>/g,
    (_match, content: string) => {
      // 将换行符转换为段落标签
      const lines = content.split('\n').filter((line: string) => line.trim());
      return lines.map((line: string) => `<p>${line.trim()}</p>`).join('');
    }
  );

  // 清理飞书特有的属性（但保留表格结构）
  cleanHtml = cleanHtml
    .replace(/data-[^=]*="[^"]*"/g, '') // 移除data-*属性
    .replace(/style="[^"]*"/g, '') // 移除style属性
    .replace(/class="[^"]*"/g, '') // 移除class属性
    .replace(/id="[^"]*"/g, ''); // 移除id属性

  // 修复不完整的表格结构（飞书复制可能缺少 <table> 开始标签）
  if (cleanHtml.includes('<tr') && !cleanHtml.includes('<table')) {
    cleanHtml = '<table>' + cleanHtml;
  }
  if (cleanHtml.includes('</table>') && !cleanHtml.includes('<table')) {
    cleanHtml = '<table>' + cleanHtml;
  }
  // 如果有 </tbody> 但没有 <tbody>
  if (cleanHtml.includes('</tbody>') && !cleanHtml.includes('<tbody')) {
    cleanHtml = cleanHtml.replace(/<table>/g, '<table><tbody>');
  }

  // 直接使用 turndown 转换
  let markdown = turndownService.turndown(cleanHtml);

  // 后处理
  markdown = markdown
    .replace(/\*\*\*\*/g, '** **') // 修复连续加粗问题（**文字1****文字2** → **文字1** **文字2**）
    .replace(/\*\*\s+\*\*/g, ' ') // 移除空的加粗标记（** ** → 空格）
    .replace(/\$/g, '\\$') // 转义 $ 符号，防止被解析为 LaTeX 公式
    .replace(/[ \t]+$/gm, '') // 移除行尾空白
    .replace(/\n{3,}/g, '\n\n') // 清理多余换行
    .replace(/^\n+/, '') // 移除开头换行
    .replace(/\n+$/, '') // 移除结尾换行
    .trim();

  return markdown;
}
