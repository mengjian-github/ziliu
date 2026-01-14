import { NextRequest } from 'next/server';

// 平台特定的转换提示词
const PLATFORM_PROMPTS = {
  video_wechat: `
请将以下文章内容转换为适合微信视频号的口播稿：

要求：
1. 时长控制在1-3分钟（约200-500字）
2. 语调亲切自然，像朋友聊天
3. 必须使用 PREP 结构：Point(观点) → Reason(理由) → Example(例子/场景) → Point(总结+互动引导)
4. 提取文章的核心价值点，用口语化表达，避免逐句复述
5. 适当添加"那么"、"接下来"等转场词

请直接输出口播稿内容，不要其他说明。
`,

  douyin: `
请将以下文章内容转换为适合抖音的口播稿：

要求：
1. 时长控制在30秒-1分钟（约100-200字）
2. 语调活泼有节奏感，制造悬念
3. 必须使用 PREP 结构：Point → Reason → Example → Point（最后一句要有关注引导）
4. 开头要有冲击力，能快速抓住注意力
5. 节奏紧凑，信息密度高

请直接输出口播稿内容，不要其他说明。
`,

  bilibili: `
请将以下文章内容转换为适合B站的口播稿：

要求：
1. 时长控制在3-10分钟（约500-1500字）
2. 语调专业且有趣，可以有个人风格
3. 必须使用 PREP 结构：Point → Reason → Example → Point（最后包含三连引导）
4. 开头简要交代背景，避免铺垫过长
5. 逻辑清晰，可以相对复杂和深入

请直接输出口播稿内容，不要其他说明。
`,

  xiaohongshu: `
请将以下文章内容转换为适合小红书的口播稿：

要求：
1. 时长控制在1-2分钟（约200-400字）
2. 语调真实亲切，像分享给闺蜜
3. 必须使用 PREP 结构：Point → Reason → Example → Point（最后引导评论区交流）
4. 突出个人体验和真实感受
5. 多用"我觉得"、"真的是"等口语词汇

请直接输出口播稿内容，不要其他说明。
`
,

  youtube: `
请将以下内容转换为适合 YouTube 的视频讲稿/口播稿：

要求：
1. 保持与原文一致的语言（中文就中文，英文就英文）
2. 时长控制在 3-8 分钟（可根据内容密度适当调整）
3. 必须使用 PREP 结构：Point → Reason → Example → Point（最后包含 CTA：订阅/评论/下一步）
4. 口语化但不油腻，面向海外用户时用更清晰的逻辑和例子
5. 适当加入自然的转场词，避免长篇照搬原文

请直接输出讲稿内容，不要其他说明。
`
} as const;

export async function POST(request: NextRequest) {
  try {
    const { content, platform, title } = await request.json();
    
    if (!content || !platform) {
      return Response.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 验证平台
    if (!PLATFORM_PROMPTS[platform as keyof typeof PLATFORM_PROMPTS]) {
      return Response.json({
        success: false,
        error: '不支持的平台'
      }, { status: 400 });
    }

    const speechScript = await convertToSpeechWithAI(content, platform, title);
    
    return Response.json({
      success: true,
      data: {
        speechScript,
        platform,
        wordCount: speechScript.length,
        estimatedDuration: Math.round(speechScript.length / 3) // 粗略估算秒数（按每秒3字计算）
      }
    });
  } catch (error) {
    console.error('口播稿转换失败:', error);
    return Response.json({
      success: false,
      error: '转换失败，请重试'
    }, { status: 500 });
  }
}

async function convertToSpeechWithAI(content: string, platform: string, title?: string): Promise<string> {
  const prompt = PLATFORM_PROMPTS[platform as keyof typeof PLATFORM_PROMPTS];
  
  // 构建完整的AI请求内容
  const fullPrompt = `
${prompt}

文章标题：${title || '无标题'}

文章内容：
${content}
`;

  try {
    // 使用OpenRouter API，可以选择合适的模型
    // 对于内容转换任务，Claude或GPT-3.5都比较合适
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu Video Speech Conversion',
      },
      body: JSON.stringify({
        // 选择性价比高的模型，比如Claude-3-haiku或GPT-3.5
        model: 'openai/gpt-5.2-chat', 
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const speechScript = data.choices[0]?.message?.content?.trim();

    if (!speechScript) {
      throw new Error('AI返回空内容');
    }

    return speechScript;

  } catch (error) {
    console.error('AI转换失败，使用降级方案:', error);
    
    // 降级方案：简单的内容摘要和口语化处理
    return fallbackConversion(content, platform, title);
  }
}

// 降级方案：当AI不可用时的简单转换
function fallbackConversion(content: string, platform: string, title?: string): string {
  // 移除HTML和Markdown语法
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');

  const keyPoints = extractKeyPoints(cleanContent, 3);

  // 基础的平台化处理
  const platformConfig = {
    video_wechat: {
      opening: '今天和大家分享一个重点观点：',
      ending: '如果有帮助，记得点赞关注，我们评论区见！'
    },
    douyin: {
      opening: '先抛个观点：',
      ending: '关注我，带你了解更多！'
    },
    bilibili: {
      opening: '先给出观点：',
      ending: '如果有用，麻烦三连支持一下！'
    },
    xiaohongshu: {
      opening: '我觉得这个点真的很实用：',
      ending: '有问题评论区见～'
    },
    youtube: {
      opening: 'Here is the main point:',
      ending: 'If this helps, please like, subscribe, and comment below!'
    }
  };

  const config = platformConfig[platform as keyof typeof platformConfig];
  
  return buildPrepScript({
    opening: config.opening,
    title,
    keyPoints,
    ending: config.ending
  });
}

function extractKeyPoints(content: string, max: number): string[] {
  const sentences = content
    .split(/[。！？.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 12);
  if (sentences.length === 0) return [];
  return sentences.slice(0, max);
}

function buildPrepScript(params: { opening: string; title?: string; keyPoints: string[]; ending: string }): string {
  const { opening, title, keyPoints, ending } = params;
  const reason = keyPoints[0] || '它能帮你更快抓住重点。';
  const example = keyPoints[1] || keyPoints[0] || '举个例子：用一个简单场景就能看出差别。';
  const summary = keyPoints[2] || '核心就是把重点说清楚、做得更有效率。';

  return `${opening}${title ? `${title}` : '这件事'}。

原因是：${reason}。

举个例子：${example}。

所以总结一下：${summary} ${ending}`;
}
