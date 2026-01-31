import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SUPPORTED_PLATFORMS = [
  'wechat',
  'zhihu',
  'juejin',
  'xiaohongshu_note',
  'douyin',
  'bilibili',
  'x',
  'weibo',
  'jike',
  'zsxq',
  'wechat_xiaolushu',
  'video_wechat',
  'xiaohongshu',
  'youtube',
  'linkedin',
] as const;

type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

const requestSchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS),
  title: z.string().min(1, '标题不能为空'),
  content: z.string().optional(),
});

const PLATFORM_TITLE_RULES: Record<string, string> = {
  wechat: `公众号标题规则：
- 长度 ≤ 64 字
- 制造悬念感、好奇心驱动
- 可用数字、反常识、痛点共鸣
- 避免标题党但要有点击欲望
- 示例风格："为什么90%的人都不知道这个方法？"`,

  zhihu: `知乎标题规则：
- 问答式或干货型标题
- 可以用"如何…""为什么…""…是怎样的体验"等句式
- 体现专业度和深度
- 示例风格："如何从零开始掌握XXX？这篇指南够用了"`,

  juejin: `掘金标题规则：
- 技术关键词前置
- 格式参考："技术词 | 具体内容描述"
- 突出实战、源码、原理等技术深度
- 示例风格："React 18 并发模式：从源码理解 Suspense 的工作原理"`,

  xiaohongshu_note: `小红书标题规则：
- 6-20 字
- 可加 1-2 个 emoji
- 关键词前置
- 有场景感/结果感/数字
- 格式参考："关键词｜具体利益点"
- 示例风格："用了3个月🔥终于搞懂了这个方法"`,

  douyin: `抖音标题规则：
- ≤ 20 字
- 黄金3秒钩子：开头就要抓住注意力
- 口语化、有冲突感
- 适合朗读、节奏感强
- 示例风格："别再这样做了！90%的人都踩过这个坑"`,

  bilibili: `B站标题规则：
- 可使用【】方括号格式突出关键词
- 融入B站黑话/梗文化
- 有吸引力但不过度标题党
- 示例风格："【干货】从零到一的完整攻略，看完直接起飞！"`,

  x: `X/Twitter 标题规则：
- English-friendly，如果原标题是中文也生成中英各有的方案
- Hook first — 前几个词就要吸引眼球
- 简洁有力，适合社交传播
- 示例风格："This changed how I think about XXX. Here's why 👇"`,

  weibo: `微博标题规则：
- 简短有力，观点鲜明
- 口语化，有传播性
- 适当加入话题感
- 示例风格："说真的，这件事很多人都想错了"`,

  jike: `即刻标题规则：
- 真诚、个人化的分享口吻
- 创业者/产品经理/开发者视角
- 有见解、有数据
- 示例风格："分享一个我用了3年的工作流，效率翻倍"`,

  zsxq: `知识星球标题规则：
- 干货导向，体现价值
- 适合付费内容的标题风格
- 突出独家、深度、实操
- 示例风格："深度复盘：从0到10万用户的增长策略（含数据）"`,

  wechat_xiaolushu: `小绿书标题规则：
- 6-20 字
- 类似小红书但更文艺
- 纯文字风格，不加emoji
- 示例风格："终于找到最适合自己的方法了"`,

  video_wechat: `视频号标题规则：
- ≤ 30 字
- 口语化，适合视频内容
- 有悬念或结果导向
- 示例风格："这个方法我用了3年，今天终于分享出来"`,

  xiaohongshu: `小红书视频标题规则：
- 6-20 字，关键词前置
- 可加 1-2 个 emoji
- 有场景感和结果感
- 示例风格："3分钟学会🔥这个效果太绝了"`,

  linkedin: '第一行即 hook，≤100字符，专业+洞察感。用问句/数据/反常识开头。避免 clickbait。',

  youtube: `YouTube 标题规则：
- English-friendly
- 包含搜索关键词
- 有好奇心驱动或价值承诺
- 示例风格："How I Built XXX in 30 Days (Step by Step Guide)"`,
};

const aiOutputSchema = z.object({
  titles: z.array(z.object({
    text: z.string().min(1),
    reason: z.string().min(1),
  })).min(1).max(5),
});

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

  // 3) Try to find array pattern
  const arrStart = raw.indexOf('[');
  const arrEnd = raw.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const arrText = raw.slice(arrStart, arrEnd + 1);
    try {
      const arr = JSON.parse(arrText);
      if (Array.isArray(arr)) {
        return { titles: arr };
      }
    } catch {
      // continue
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, title, content } = requestSchema.parse(body);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI 服务未配置' },
        { status: 500 }
      );
    }

    const platformRules = PLATFORM_TITLE_RULES[platform] || '通用标题：简洁有力，突出核心价值';
    const contentSnippet = content ? content.slice(0, 500) : '';

    const prompt = `你是一个内容平台标题优化专家。请根据以下信息，为指定平台生成 3 个优化后的备选标题（A/B/C方案）。

当前平台：${platform}

${platformRules}

原始标题：
${title}

${contentSnippet ? `正文摘要（仅供理解主题，不要照搬）：\n${contentSnippet}` : ''}

要求：
1. 生成 3 个不同风格/角度的备选标题
2. 每个标题都要符合上述平台规则
3. 3 个标题之间要有明显差异（不同切入角度、不同表达手法）
4. 为每个标题附上简短的优化理由（1-2句话说明为什么这样改）

输出必须是严格 JSON（不要有任何额外文字）：
{"titles":[{"text":"标题A","reason":"理由A"},{"text":"标题B","reason":"理由B"},{"text":"标题C","reason":"理由C"}]}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu AB Title Generation',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.9,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('AI 返回空内容');

    const parsed = parseJsonBestEffort(raw);
    if (!parsed) throw new Error('无法解析 AI 返回内容');

    const validated = aiOutputSchema.parse(parsed);

    return NextResponse.json({
      success: true,
      data: {
        titles: validated.titles,
      },
    });
  } catch (error) {
    console.error('A/B 标题生成失败:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: '生成失败，请重试' },
      { status: 500 }
    );
  }
}
