import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { extractImagesFromMarkdown, markdownToPlainText, type ExtractedImage } from '@/lib/markdown-utils';

const SHORT_TEXT_PLATFORMS = [
  'wechat_xiaolushu',
  'xiaohongshu_note',
  'weibo',
  'jike',
  'x',
] as const;

const generateSchema = z.object({
  platform: z.enum(SHORT_TEXT_PLATFORMS),
  // Either provide articleId (server will fetch content) OR provide title+content directly
  articleId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(), // markdown
});

type ShortTextPlatform = (typeof SHORT_TEXT_PLATFORMS)[number];

const OUTPUT_LIMITS: Record<ShortTextPlatform, { titleMax?: number; contentMax?: number; tagMax?: number }> = {
  wechat_xiaolushu: { titleMax: 20, contentMax: 1000 },
  xiaohongshu_note: { titleMax: 20, contentMax: 1000, tagMax: 10 },
  weibo: { contentMax: 2000, tagMax: 5 },
  jike: { contentMax: 2000, tagMax: 5 },
  x: { contentMax: 4000, tagMax: 8 },
};

const PLATFORM_PROMPTS: Record<ShortTextPlatform, string> = {
  wechat_xiaolushu: `
你是"微信小绿书（公众号图片消息）"运营助手。请把原始内容改写为适合发布的小绿书短图文文案。
风格要求：类似小红书，但必须纯文字，不要使用Emoji或任何小图标/符号装饰。

要求：
1) 标题：可选，6-20个汉字（不要出现"标题："前缀）
2) 正文：200-900字，纯文本，允许换行；不要出现Markdown语法；不要输出图片URL；避免贴长链接
3) 话题/标签：3-5个，返回数组（不要带#号，直接给词）
4) 可以根据配图信息自然地写"第1张图/图里…"等
5) 每段不超过3行，留白感强
6) 结尾设置互动引导："你觉得呢？"/"收藏备用"

输出必须是严格 JSON（不要有任何额外文字）：
{"title":"...","content":"...","tags":["..."]}`,
  xiaohongshu_note: `
你是"小红书图文笔记"资深运营。请把原始内容改写为高互动率的小红书图文笔记。

风格要求：
- 第一人称叙事："我试了XX后发现..."、"分享一个我用了3年的方法"
- emoji适度：每2-3句用1个，不堆砌，优先用🔥💡✅❌📌等实用型
- 语气真诚有分享感，像给朋友安利，不要AI腔
- 绝对禁止使用"最好""第一""100%有效""史上最全"等绝对化用语（平台会限流）

标题要求：
1) 6-20字，关键词前置，格式参考"关键词｜具体利益点"
2) 有场景感/结果感/数字："用了3个月，终于搞懂了XX"
3) 可适度用｜和emoji但不超过2个

正文要求：
1) 300-800字，分段≤3行
2) 开头用痛点/场景/结果引入
3) 中间用分点或小标题组织
4) 结尾互动引导："你也遇到过吗？评论区聊聊"
5) 不要Markdown语法、不输出图片URL

话题要求：
- 5-8个，1个大话题 + 3个精准话题 + 2个长尾话题
- 不带#号，直接给词

输出严格JSON（不要有任何额外文字）：
{"title":"...","content":"...","tags":["..."]}`,

  weibo: `
你是"微博"资深运营。请把原始内容改写为微博爆款短文。

风格：
- 碎片化表达、观点鲜明、适度争议
- 开头直接抛观点，不要铺垫
- 结尾留互动钩子："你怎么看？"/"同意的转发"
- 不要AI腔，不要"总而言之""综上所述"

要求：
1) 80-220字，越短越好，信息密度高
2) 以段落为主，自然表达、自然分段，能合并就不要硬拆
3) 可包含 1-3 个话题词（返回 tags 数组，不要带#号）
4) 不要出现Markdown语法；不要输出图片URL；避免硬广

输出必须是严格 JSON（不要有任何额外文字）：
{"content":"...","tags":["..."]}`,

  jike: `
你是即刻社区活跃用户。请把内容改写为即刻动态。

风格：
- 真诚的个人分享，像写给同行的笔记
- 创业者/产品经理/开发者口吻
- 可以分享数据："上线第3天，DAU突破XX"
- 不要标题党，不要鸡汤，不要AI腔

要求：
1) 120-300字，自然分段
2) 开头用"今天..."/"最近..."/"分享一个发现..."引入
3) 不要Markdown语法；不要输出图片URL
4) 1-3个话题词（返回 tags 数组，不要带#号）

输出必须是严格 JSON（不要有任何额外文字）：
{"content":"...","tags":["..."]}`,

  x: `
You are an X (Twitter) post assistant. Rewrite the original content into an X post.

Requirements:
1) Keep the language consistent with the input (Chinese stays Chinese, English stays English).
2) Prefer a single post that is concise; keep it within 280-400 characters if possible (hard max 4000).
3) Prefer paragraph-style output; break lines only when it improves readability.
4) No Markdown syntax; do not output image URLs.
5) Return optional tags as a list of keywords (no #).
6) If content naturally exceeds 280 chars, structure as a thread:
   - First tweet = strongest hook/insight
   - Use line breaks between tweets
   - Last tweet includes CTA
7) Avoid AI-speak like "In conclusion" or "It's worth noting"

Output MUST be strict JSON only:
{"content":"...","tags":["..."]}`,

};

const MODEL_MAP: Record<ShortTextPlatform, string> = {
  xiaohongshu_note: 'openai/gpt-4o-mini',
  wechat_xiaolushu: 'openai/gpt-4o-mini',
  weibo: 'openai/gpt-4o-mini',
  jike: 'openai/gpt-4o-mini',
  x: 'openai/gpt-4o-mini',
};

const aiOutputSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

async function generateShortTextCover(input: {
  platform: ShortTextPlatform;
  title?: string;
  content: string;
  images: ExtractedImage[];
}): Promise<{ coverImage?: string; coverSuggestion?: string }> {
  if (input.platform !== 'xiaohongshu_note') return {};

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return {};

  const suggestion = buildShortTextCoverSuggestion(input);
  const prompt = buildShortTextCoverPrompt(suggestion, input.title, input.content);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu Short Text Cover Generation',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const images = data.choices?.[0]?.message?.images;
    const imageUrl = images?.[0]?.image_url?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return { coverSuggestion: suggestion };
    }

    return { coverImage: imageUrl, coverSuggestion: suggestion };
  } catch (error) {
    console.error('小红书封面生成失败:', error);
    return { coverSuggestion: suggestion };
  }
}

function buildShortTextCoverSuggestion(input: {
  title?: string;
  content: string;
  images: ExtractedImage[];
}): string {
  const cleanTitle = String(input.title || '').trim();
  const firstLine = input.content.split('\n').find(line => line.trim()) || '';
  const imageHints = input.images
    .slice(0, 3)
    .map((img, index) => `图${index + 1}${img.alt ? `（${img.alt}）` : ''}`)
    .join('、');
  const base = cleanTitle || firstLine || '实用图文分享';
  const imagesText = imageHints ? `；可参考配图：${imageHints}` : '';
  return `小红书爆款封面，突出"${base}"的主题与结果感${imagesText}`;
}

function buildShortTextCoverPrompt(suggestion: string, title?: string, content?: string): string {
  const safeTitle = title || '小红书笔记';
  const summary = content ? content.slice(0, 120) : '';

  return [
    `为小红书图文笔记生成高点击率封面图。主题：${safeTitle}`,
    `封面建议：${suggestion}`,
    `正文摘要（仅供理解主题）：${summary}`,
    '',
    '硬性要求：',
    '1) 画幅比例 3:4（1080x1440）；',
    '2) 标题文字 6-12 字，副标题 8-14 字；',
    '3) 视觉清新、留白足、质感强，避免杂乱；',
    '4) 不出现人物/人脸/真人；',
    '5) 文字清晰可读，关键字可高亮。',
    '',
    '风格参考：清新自然、质感静物、简洁排版、柔和配色。'
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, articleId, title, content } = generateSchema.parse(body);

    const resolved = await resolveSource({ articleId, title, content });
    if (!resolved.markdown.trim()) {
      return NextResponse.json({ success: false, error: '内容为空' }, { status: 400 });
    }

    const images = extractImagesFromMarkdown(resolved.markdown);
    const plainText = markdownToPlainText(resolved.markdown);

    const generated = await generateWithAI({
      platform,
      title: resolved.title,
      plainText,
      images,
    });

    const normalized = normalizeOutput(platform, generated, resolved.title);
    const { coverImage, coverSuggestion } = await generateShortTextCover({
      platform,
      title: normalized.title || resolved.title,
      content: normalized.content,
      images,
    });

    return NextResponse.json({
      success: true,
      data: {
        platform,
        title: normalized.title,
        content: normalized.content,
        tags: normalized.tags,
        images,
        imageCount: images.length,
        plainText,
        coverImage,
        coverSuggestion,
      },
    });
  } catch (error) {
    console.error('短图文生成失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : '';
    if (message === '未登录') {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    if (message.includes('文章不存在') || message.includes('无权访问')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: '生成失败，请重试' }, { status: 500 });
  }
}

async function resolveSource(input: {
  articleId?: string;
  title?: string;
  content?: string;
}): Promise<{ title: string; markdown: string }> {
  if (input.articleId) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('未登录');
    }

    const article = await db.query.articles.findFirst({
      where: and(eq(articles.id, input.articleId), eq(articles.userId, session.user.id)),
    });

    if (!article) {
      throw new Error('文章不存在或无权访问');
    }

    return { title: article.title || '', markdown: article.content || '' };
  }

  return { title: input.title || '', markdown: input.content || '' };
}

async function generateWithAI(input: {
  platform: ShortTextPlatform;
  title: string;
  plainText: string;
  images: ExtractedImage[];
}): Promise<z.infer<typeof aiOutputSchema>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallbackShortText(input);
  }

  const prompt = PLATFORM_PROMPTS[input.platform];
  const imagesHint = summarizeImages(input.images);

  const fullPrompt = `
${prompt}

原始标题：
${input.title || '无'}

原始正文（已转为纯文本）：
${input.plainText}

配图信息（仅供参考，不要输出URL）：
${imagesHint}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu Short Text Generation',
      },
      body: JSON.stringify({
        model: MODEL_MAP[input.platform],
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 900,
        temperature: 0.8,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('AI返回空内容');

    const parsed = parseJsonBestEffort(raw);
    const validated = aiOutputSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('AI生成失败，使用降级方案:', error);
    return fallbackShortText(input);
  }
}

function normalizeOutput(
  platform: ShortTextPlatform,
  output: z.infer<typeof aiOutputSchema>,
  fallbackTitle: string
): { title?: string; content: string; tags: string[] } {
  const limits = OUTPUT_LIMITS[platform];
  const tags = (output.tags || [])
    .map(t => String(t || '').trim())
    .filter(Boolean)
    .slice(0, limits.tagMax || 0);

  let content = formatShortTextContent(platform, String(output.content || '').trim());
  if (limits.contentMax && content.length > limits.contentMax) {
    content = content.slice(0, limits.contentMax).trim();
  }

  let title = output.title?.trim();
  if (platform === 'xiaohongshu_note' || platform === 'wechat_xiaolushu') {
    title = title || fallbackTitle || (platform === 'wechat_xiaolushu' ? '图片消息' : '图文笔记');
    const max = limits.titleMax || 20;
    if (title.length > max) title = title.slice(0, max).trim();
  } else {
    // Non-title platforms: keep title optional
    title = title?.trim() || undefined;
  }

  if (platform === 'wechat_xiaolushu') {
    content = stripEmojis(content);
    if (title) {
      title = stripEmojis(title);
    }
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i += 1) {
        tags[i] = stripEmojis(tags[i]);
      }
    }
  }

  return { title, content, tags: limits.tagMax ? tags : [] };
}

function parseJsonBestEffort(raw: string): unknown {
  // 1) Direct JSON
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  // 2) Extract JSON object substring
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const jsonText = raw.slice(start, end + 1);
    try {
      return JSON.parse(jsonText);
    } catch {
      // continue
    }
  }

  // 3) Minimal fallback - treat whole output as content
  return { content: raw };
}

function summarizeImages(images: ExtractedImage[]): string {
  if (!images.length) return '无';
  return images
    .slice(0, 20)
    .map((img, i) => {
      const alt = img.alt ? `（描述：${img.alt}）` : '';
      return `图${i + 1}${alt}`;
    })
    .join('\n');
}

function stripEmojis(text: string): string {
  return String(text || '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatShortTextContent(platform: ShortTextPlatform, content: string): string {
  if (platform !== 'weibo' && platform !== 'jike' && platform !== 'x') {
    return content;
  }

  const formatted = String(content || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return formatted;
}

function fallbackShortText(input: {
  platform: ShortTextPlatform;
  title: string;
  plainText: string;
  images: ExtractedImage[];
}): z.infer<typeof aiOutputSchema> {
  const base = input.plainText
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const short = base.length > 600 ? `${base.slice(0, 600).trim()}…` : base;

  const commonTags = input.images.length > 0 ? ['配图', '分享'] : ['分享'];

  if (input.platform === 'wechat_xiaolushu') {
    const t = stripEmojis(input.title ? input.title.slice(0, 20) : '图片消息');
    return {
      title: t,
      content: stripEmojis(`${short}\n\n欢迎在评论区补充。`),
      tags: [],
    };
  }

  if (input.platform === 'xiaohongshu_note') {
    const t = input.title ? input.title.slice(0, 20) : '图文笔记';
    return {
      title: t,
      content: `${short}\n\n你更想看哪一部分？评论区聊聊～`,
      tags: ['干货', '记录', ...commonTags].slice(0, 10),
    };
  }

  if (input.platform === 'weibo') {
    return {
      content: formatShortTextContent('weibo', `${short.slice(0, 220)}\n\n你怎么看？`),
      tags: ['日常', ...commonTags].slice(0, 5),
    };
  }

  if (input.platform === 'jike') {
    return {
      content: formatShortTextContent('jike', `${short.slice(0, 300)}\n\n欢迎补充。`),
      tags: ['随手记', ...commonTags].slice(0, 5),
    };
  }

  if (input.platform === 'x') {
    return {
      content: formatShortTextContent('x', short.slice(0, 4000)),
      tags: ['thoughts', ...commonTags].slice(0, 8),
    };
  }

  return {
    content: `${short}\n\n你也有类似的经历吗？`,
    tags: ['分享', ...commonTags].slice(0, 10),
  };
}
