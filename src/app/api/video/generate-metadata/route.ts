import { NextRequest } from 'next/server';

// 平台特定的元数据生成提示词
const METADATA_PROMPTS = {
  video_wechat: `
请为以下文章内容生成适合微信视频号的发布元数据：

要求：
1. 标题：必须严格控制在6-16个汉字之间（不包括标点符号），突出实用价值，适合微信社交传播。如果内容过长请精简，如果过短请适当扩展。
2. 描述：80-120字，温和友好，引导互动
3. 标签：3-5个相关话题标签，用#号格式
4. 封面建议：一句话描述适合的封面内容

重要：标题字数限制是硬性要求，必须在6-16个汉字范围内，超出或不足都不符合平台规范！

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3
封面：[封面建议]
`,

  douyin: `
请为以下文章内容生成适合抖音的发布元数据：

要求：
1. 标题：制造悬念或冲突，包含数字或极端词汇
2. 描述：30-55字，节奏感强，多用标签和emoji
3. 标签：5-8个热门话题标签，用#号格式
4. 封面建议：强调视觉冲击力和对比

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4 #标签5
封面：[封面建议]
`,

  bilibili: `
请为以下文章内容生成适合B站的发布元数据：

要求：
1. 标题：信息量大，可以稍长，体现专业性
2. 描述：150-250字，详细介绍内容大纲和亮点
3. 标签：选择合适的B站分区标签和内容标签
4. 封面建议：信息丰富，突出重点内容

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4
封面：[封面建议]
`,

  xiaohongshu: `
请为以下文章内容生成适合小红书的发布元数据：

要求：
1. 标题：真实体验感，多用感叹号和问号
2. 描述：200-500字，详细分享经历，多用emoji和换行
3. 标签：包含品类、功效、适用人群等标签
4. 封面建议：突出颜值和真实性

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4 #标签5
封面：[封面建议]
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
    if (!METADATA_PROMPTS[platform as keyof typeof METADATA_PROMPTS]) {
      return Response.json({
        success: false,
        error: '不支持的平台'
      }, { status: 400 });
    }

    const metadata = await generateMetadataWithAI(content, platform, title);
    
    return Response.json({
      success: true,
      data: {
        ...metadata,
        platform,
        platformTips: getPlatformTips(platform)
      }
    });
  } catch (error) {
    console.error('元数据生成失败:', error);
    return Response.json({
      success: false,
      error: '生成失败，请重试'
    }, { status: 500 });
  }
}

async function generateMetadataWithAI(content: string, platform: string, originalTitle?: string): Promise<any> {
  const prompt = METADATA_PROMPTS[platform as keyof typeof METADATA_PROMPTS];
  
  // 构建完整的AI请求内容
  const fullPrompt = `
${prompt}

原文章标题：${originalTitle || '无标题'}

文章内容：
${content}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu Video Metadata Generation',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // 使用性价比高的模型
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.8, // 稍微高一点，增加创意性
        top_p: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('AI返回空内容');
    }

    // 解析AI返回的结构化内容
    return parseAIResponse(aiResponse, platform);

  } catch (error) {
    console.error('AI生成失败，使用降级方案:', error);
    
    // 降级方案
    return fallbackMetadataGeneration(content, platform, originalTitle);
  }
}

// 解析AI返回的结构化内容
function parseAIResponse(response: string, platform: string): any {
  const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
  const metadata: any = {};

  lines.forEach(line => {
    if (line.startsWith('标题：')) {
      let title = line.replace('标题：', '').trim();
      // 对视频号标题进行二次验证和修正
      if (platform === 'video_wechat') {
        title = generateVideoWechatTitle(title);
      }
      metadata.title = title;
    } else if (line.startsWith('描述：')) {
      metadata.description = line.replace('描述：', '').trim();
    } else if (line.startsWith('标签：')) {
      const tagsLine = line.replace('标签：', '').trim();
      metadata.tags = tagsLine.split(/\s+/).filter(tag => tag.startsWith('#')).map(tag => tag.replace('#', ''));
    } else if (line.startsWith('封面：')) {
      metadata.coverSuggestion = line.replace('封面：', '').trim();
    }
  });

  return metadata;
}

// 生成符合视频号要求的标题
function generateVideoWechatTitle(originalTitle?: string): string {
  if (!originalTitle) {
    return '实用干货分享';
  }
  
  // 移除标点符号后计算汉字长度
  const cleanTitle = originalTitle.replace(/[^\u4e00-\u9fa5]/g, '');
  const length = cleanTitle.length;
  
  if (length >= 6 && length <= 16) {
    // 长度合适，直接返回
    return originalTitle;
  } else if (length > 16) {
    // 太长，截取前16个汉字
    const truncated = cleanTitle.substring(0, 16);
    // 尝试在合适的位置截断
    const goodBreakPoints = ['的', '与', '和', '或', '及'];
    for (let i = 12; i < truncated.length; i++) {
      if (goodBreakPoints.includes(truncated[i])) {
        return truncated.substring(0, i);
      }
    }
    return truncated;
  } else {
    // 太短，适当扩展
    const extensions = ['分享', '干货', '技巧', '方法', '经验', '心得'];
    let extended = originalTitle;
    
    for (const ext of extensions) {
      const testTitle = extended + ext;
      const testLength = testTitle.replace(/[^\u4e00-\u9fa5]/g, '').length;
      if (testLength >= 6 && testLength <= 16) {
        return testTitle;
      }
    }
    
    // 如果还是不够，直接补充
    return originalTitle + '实用分享';
  }
}

// 降级方案
function fallbackMetadataGeneration(content: string, platform: string, originalTitle?: string): any {
  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
  const firstSentence = cleanContent.split(/[。！？]/)[0] || '';
  
  const platformDefaults = {
    video_wechat: {
      title: generateVideoWechatTitle(originalTitle),
      description: `${firstSentence}，今天和大家分享一些实用的方法和技巧。`,
      tags: ['实用技巧', '干货分享', '个人成长'],
      coverSuggestion: '简洁清晰的标题配图，突出重点信息'
    },
    douyin: {
      title: `你绝对想不到${originalTitle ? '：' + originalTitle : '这个方法'}！`,
      description: `${firstSentence} 🔥`,
      tags: ['涨知识', '实用技巧', '干货', '必看'],
      coverSuggestion: '高对比度配色，大字体标题，制造视觉冲击'
    },
    bilibili: {
      title: `【干货分享】${originalTitle || '实用技巧合集'}`,
      description: `${firstSentence}。这期视频详细分享相关方法和经验，希望对大家有帮助。`,
      tags: ['知识分享', '干货', '教程', '实用'],
      coverSuggestion: '信息量丰富的封面，包含主题和要点预览'
    },
    xiaohongshu: {
      title: `真的太实用了！${originalTitle || '必须分享'}`,
      description: `${firstSentence}✨\n\n真心推荐给大家，亲测有效！\n\n有问题评论区见～`,
      tags: ['实用好物', '真实测评', '干货分享', '必看'],
      coverSuggestion: '真实自然的生活场景，突出产品或效果'
    }
  };

  return platformDefaults[platform as keyof typeof platformDefaults] || platformDefaults.video_wechat;
}

// 平台特定建议
function getPlatformTips(platform: string): string[] {
  const tipsMap = {
    video_wechat: [
      '建议视频时长1-3分钟',
      '内容要有价值感，适合分享',
      '封面简洁突出重点',
      '可以添加地理位置增加曝光'
    ],
    douyin: [
      '前3秒很关键，要有视觉冲击',
      '建议配有节奏感的BGM',
      '时长控制在15-60秒效果最好',
      '多用热门音乐和特效'
    ],
    bilibili: [
      '记得选择合适的分区投稿',
      '封面要信息丰富吸引点击',
      '可以考虑分P或做成系列',
      '简介要详细，有利于搜索'
    ],
    xiaohongshu: [
      '真实自然最重要',
      '可以露脸增加信任感',
      '记得添加地理位置',
      '多用emoji让内容更生动'
    ]
  };
  
  return tipsMap[platform as keyof typeof tipsMap] || [];
}