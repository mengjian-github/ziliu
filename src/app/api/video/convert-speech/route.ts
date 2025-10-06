import { NextRequest } from 'next/server';

// 平台特定的转换提示词
const PLATFORM_PROMPTS = {
  video_wechat: `
请将以下文章内容转换为适合微信视频号的口播稿：

要求：
1. 时长控制在1-3分钟（约200-500字）
2. 语调亲切自然，像朋友聊天
3. 开头直入主题，结尾引导互动
4. 提取文章的核心价值点，用口语化表达
5. 适当添加"那么"、"接下来"等转场词

请直接输出口播稿内容，不要其他说明。
`,

  douyin: `
请将以下文章内容转换为适合抖音的口播稿：

要求：
1. 时长控制在30秒-1分钟（约100-200字）
2. 语调活泼有节奏感，制造悬念
3. 开头要有冲击力，能快速抓住注意力
4. 节奏紧凑，信息密度高
5. 结尾强化记忆点，引导关注

请直接输出口播稿内容，不要其他说明。
`,

  bilibili: `
请将以下文章内容转换为适合B站的口播稿：

要求：
1. 时长控制在3-10分钟（约500-1500字）
2. 语调专业且有趣，可以有个人风格
3. 开头详细介绍背景和要点
4. 逻辑清晰，可以相对复杂和深入
5. 结尾总结要点，引导三连

请直接输出口播稿内容，不要其他说明。
`,

  xiaohongshu: `
请将以下文章内容转换为适合小红书的口播稿：

要求：
1. 时长控制在1-2分钟（约200-400字）
2. 语调真实亲切，像分享给闺蜜
3. 突出个人体验和真实感受
4. 多用"我觉得"、"真的是"等口语词汇
5. 结尾引导评论区交流

请直接输出口播稿内容，不要其他说明。
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
        model: 'deepseek/deepseek-chat-v3.1:free', 
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

  // 简单提取前几句作为要点
  const sentences = cleanContent.split(/[。！？]/).filter(s => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 3).join('。') + '。';

  // 基础的平台化处理
  const platformConfig = {
    video_wechat: {
      opening: '今天和大家分享',
      ending: '觉得有用记得点赞关注！'
    },
    douyin: {
      opening: '你知道吗',
      ending: '关注我了解更多！'
    },
    bilibili: {
      opening: '大家好，今天来聊聊',
      ending: '三连支持一下！'
    },
    xiaohongshu: {
      opening: '分享一个实用的',
      ending: '有问题评论区见！'
    }
  };

  const config = platformConfig[platform as keyof typeof platformConfig];
  
  return `${config.opening}${title ? `：${title}` : '内容'}。

${keyPoints}

${config.ending}`;
}