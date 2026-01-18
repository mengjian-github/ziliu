import { NextRequest } from 'next/server';

// 平台特定的元数据生成提示词
const METADATA_PROMPTS = {
  video_wechat: `
请为以下文章内容生成适合微信视频号的发布元数据：

要求：
1. 标题：必须严格控制在6-16个汉字之间（不包括标点符号），突出实用价值，适合微信社交传播。
2. 描述：80-120字，温和友好，引导互动，必须包含核心价值点与适用人群或场景。注意：描述中严禁出现#话题标签。
3. 标签：3-5个相关话题标签，用#号格式输出。
4. 封面建议：一句话描述适合的封面内容（优先用物件/图标/场景/插画，避免人物）
5. 不能直接复述文章第一句话，要进行提炼总结

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3
封面：[封面建议]
`,

  douyin: `
请为以下文章内容生成适合抖音的发布元数据：

要求：
1. 标题：制造悬念或冲突，包含数字或极端词汇。
2. 描述：30-55字，节奏感强，多用emoji，必须包含1个核心亮点。注意：描述文本中不要带#话题标签，标签会单独放在标签字段。
3. 标签：5-8个热门话题标签，用#号格式输出。
4. 封面建议：强调视觉冲击力和对比（避免真人与人物特写）
5. 不能直接复述文章第一句话，要进行提炼总结

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4 #标签5
封面：[封面建议]
`,

  bilibili: `
请为以下文章内容生成适合B站的发布元数据：

要求：
1. 标题：信息量大，可以稍长，体现专业性。
2. 描述：150-250字，详细介绍内容大纲和亮点，包含2-3个要点。注意：描述中不要包含#话题标签。
3. 标签：选择合适的B站分区标签和内容标签，用#号格式输出。
4. 封面建议：信息丰富，突出重点内容（以图标/数据/场景为主，避免人物）
5. 不能直接复述文章第一句话，要进行提炼总结

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4
封面：[封面建议]
`,

  xiaohongshu: `
请为以下文章内容生成适合小红书的发布元数据：

要求：
1. 标题：强体验感，但必须在18-20字以内，最多1个问号或感叹号，避免多重标点堆叠。
2. 描述：200-500字，详细分享经历，多用emoji和换行，突出真实体验和效果。注意：描述正文中禁止携带#话题标签。
3. 标签：包含品类、功效、适用人群等标签，用#号格式输出。
4. 封面建议：突出主题与质感（优先物件/场景/插画，避免人物）
5. 不能直接复述文章第一句话，要进行提炼总结

请按以下格式输出：
标题：[标题内容]
描述：[描述内容]
标签：#标签1 #标签2 #标签3 #标签4 #标签5
封面：[封面建议]
`
  ,

  youtube: `
请为以下内容生成适合 YouTube 的发布元数据：

要求：
1. 标题：尽量控制在 40-70 个字符（中英文均可），包含核心关键词，避免过度标题党
2. 描述：建议 150-300 字（可根据语言适配），包含：
   - 2-4 个要点（可用短句/项目符号）
   - 关键链接位（如官网/产品页/Newsletter，可留占位符）
   注意：描述文本中严禁出现#话题标签。
3. 标签：8-15 个相关关键词（用 #号格式输出）
4. 封面建议：一句话描述封面构图与文字要点（避免人物）
5. 保持与原文一致的语言（中文就中文，英文就英文）
6. 不能直接复述文章第一句话，要进行提炼总结

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
    let coverImage = undefined;
    let coverImage169 = undefined;
    let coverImage43 = undefined;

    if (metadata.coverSuggestion) {
      if (platform === 'bilibili') {
        // B站生成两个规格
        console.log('📺 为B站生成16:9和4:3封面...');
        [coverImage169, coverImage43] = await Promise.all([
          generateCoverImage(metadata.coverSuggestion, platform, title, content, '16:9'),
          generateCoverImage(metadata.coverSuggestion, platform, title, content, '4:3')
        ]);
        coverImage = coverImage169; // 默认使用16:9
      } else {
        coverImage = await generateCoverImage(metadata.coverSuggestion, platform, title, content);
      }
    }

    return Response.json({
      success: true,
      data: {
        ...metadata,
        coverImage,
        coverImage169,
        coverImage43,
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
        model: 'openai/gpt-5.2-chat', // 使用性价比高的模型
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
    const parsed = parseAIResponse(aiResponse, platform);

    // 如果解析结果不完整，补充降级方案，避免字段为空
    const fallback = fallbackMetadataGeneration(content, platform, originalTitle);
    return {
      title: parsed.title || fallback.title,
      description: parsed.description || fallback.description,
      tags: parsed.tags && parsed.tags.length > 0 ? parsed.tags : fallback.tags,
      coverSuggestion: parsed.coverSuggestion || fallback.coverSuggestion
    };

  } catch (error) {
    console.error('AI生成失败，使用降级方案:', error);

    // 降级方案
    return fallbackMetadataGeneration(content, platform, originalTitle);
  }
}

async function generateCoverImage(
  coverSuggestion: string,
  platform: string,
  title?: string,
  contentForCover?: string,
  ratioOverride?: string
): Promise<string | undefined> {
  try {
    const prompt = buildCoverImagePrompt(coverSuggestion, platform, title, contentForCover, ratioOverride);
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Ziliu Video Cover Generation',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
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
      return undefined;
    }

    return imageUrl;
  } catch (error) {
    console.error('封面图片生成失败:', error);
    return undefined;
  }
}

function buildCoverImagePrompt(
  coverSuggestion: string,
  platform: string,
  title?: string,
  contentForCover?: string,
  ratioOverride?: string
): string {
  const base = `根据以下封面建议生成一张更高点击率的封面图片。封面主题：${title || '未指定标题'}。封面建议：${coverSuggestion}`;

  const subjectRules = [
    '主体优先：物件/图标/数据可视化/场景元素/抽象形状/插画',
    '避免人物：不出现真人、卡通人物、人物剪影或脸部特写',
    '如需表达“人群/用户”，使用符号化图标或抽象轮廓替代',
  ].join('\n');

  const coverSpecs = {
    video_wechat: {
      ratio: '16:9',
      size: '1280x720',
      layout: '简洁信息层级，主标题+一句副标题',
      style: '清爽、可信、易分享',
      text: '主标题6-10字，副标题10-16字，字号对比明显',
    },
    douyin: {
      ratio: '9:16',
      size: '1080x1920',
      layout: '强对比视觉冲击，主体居中或偏下，留上方标题区',
      style: '高饱和、强光影、情绪明显',
      text: '主标题6-9字，关键词加粗高亮',
    },
    bilibili: {
      ratio: ratioOverride || '16:9',
      size: ratioOverride === '4:3' ? '960x720' : '1280x720',
      layout: '信息量更足，标题+要点/数字+小角标，主体内容务必保持在画面中央',
      style: '内容导向、清晰利落、专业感',
      text: '主标题6-12字，支持1个关键词高亮',
    },
    xiaohongshu: {
      ratio: '3:4（优先）/1:1（兼容）',
      size: '1080x1440（优先）/1080x1080（兼容）',
      layout: '竖版构图，物件/插画/场景居中，标题在上或中，留出留白',
      style: '清新自然、质感明确、色调柔和',
      text: '主标题6-12字，副标题8-14字，避免过多文字',
    },
    youtube: {
      ratio: '16:9',
      size: '1280x720',
      layout: '强对比+大标题+主体特写，易识别',
      style: '高对比、清晰、主题明确',
      text: '主标题4-8词（或6-12字），关键词高亮',
    },
  };

  const coverTemplatesByCategory = {
    video_wechat: {
      tutorial: '模板：简洁大标题 + 小副标题 + 单一物件/图标，背景纯色或柔和渐变',
      review: '模板：对比式布局 + 关键词高亮 + 参数/指标小角标',
      list: '模板：信息图风格，1个大数字/关键词 + 图标矩阵',
      news: '模板：版式干净 + 时间/要点条目 + 轻量图标',
      lifestyle: '模板：清爽生活方式静物 + 柔和渐变 + 细体标题',
      food: '模板：简洁餐食静物（不含人物）+ 温暖色调 + 关键词高亮',
      travel: '模板：目的地场景剪影/地标图标 + 位置标签 + 大标题',
      tech: '模板：科技卡片布局 + 设备/界面图标 + 主标题高亮',
      finance: '模板：数据面板风 + 上升箭头/图表元素 + 稳重配色',
      productivity: '模板：清单式布局 + 勾选符号 + 关键字大标题',
      entertainment: '模板：高对比配色 + 夸张符号元素 + 大标题',
      general: '模板：简洁大标题 + 单一物件/图标 + 干净背景',
    },
    douyin: {
      tutorial: '模板：高对比撞色背景 + 3-5字超大标题 + 放射光效',
      review: '模板：对比式排版 + 参数标签贴纸 + 强对比配色',
      list: '模板：大数字爆款样式 + 标签贴纸 + 高饱和背景',
      news: '模板：标题条幅 + 热点标签贴纸 + 强对比底色',
      lifestyle: '模板：明快撞色 + 生活物件拼贴 + 粗体标题',
      food: '模板：高饱和美食静物 + 夸张贴纸 + 大标题',
      travel: '模板：明亮场景剪影 + 位置标签 + 关键词高亮',
      tech: '模板：赛博科技感 + HUD元素 + 关键词高亮',
      finance: '模板：强对比图表元素 + 关键词高亮 + 警示色点缀',
      productivity: '模板：清单式大字 + 勾选/计时元素 + 强对比背景',
      entertainment: '模板：潮流涂鸦风 + 贴纸/emoji点缀 + 粗体大字',
      general: '模板：高对比撞色背景 + 超大标题 + 简单图标',
    },
    bilibili: {
      tutorial: '模板：标题 + 2-3个要点词 + 小角标，信息层级清晰',
      review: '模板：参数对比卡片 + 关键词高亮 + 对比色拼贴',
      list: '模板：大数字清单 + 图标矩阵 + 标题置顶',
      news: '模板：要点条列 + 关键词高亮 + 轻量图标',
      lifestyle: '模板：低饱和物件拼贴 + 标题置顶 + 轻量贴纸',
      food: '模板：美食静物拼贴 + 关键词高亮 + 小角标',
      travel: '模板：地标/地图图标 + 位置标签 + 标题置顶',
      tech: '模板：科技感卡片布局 + 图标/数据元素 + 主标题高亮',
      finance: '模板：数据看板 + 上升/下降图标 + 关键词高亮',
      productivity: '模板：方法步骤卡片 + 勾选/清单元素 + 标题置顶',
      entertainment: '模板：强对比拼贴 + 夸张符号元素 + 大标题',
      general: '模板：信息密度适中，标题 + 要点词 + 小角标',
    },
    xiaohongshu: {
      tutorial: '模板：清新INS风 + 大标题 + 小副标题 + 图标点缀',
      review: '模板：对比式拼贴 + 关键词高亮 + 结果标签',
      list: '模板：拼贴图鉴风，多物件排版 + 标题置顶/置中',
      news: '模板：简洁条目 + 关键词高亮 + 轻量图标',
      lifestyle: '模板：清新静物 + 留白充足 + 细体标题',
      food: '模板：温暖色调美食静物 + 手写感标题 + 轻量贴纸',
      travel: '模板：目的地场景/地标图标 + 位置标签 + 清新配色',
      tech: '模板：简洁设备/界面图标 + 标题置顶 + 低饱和配色',
      finance: '模板：简洁数据图表 + 稳重配色 + 标题置顶',
      productivity: '模板：清单式布局 + 勾选符号 + 关键词高亮',
      entertainment: '模板：梦幻手绘插画风 + 柔和渐变 + 手写感标题',
      general: '模板：清新INS风 + 留白 + 精致静物',
    },
    youtube: {
      tutorial: '模板：极简对比，纯色背景 + 超大标题 + 单一物件',
      review: '模板：参数/评分条 + 关键词高亮 + 对比色背景',
      list: '模板：大数字标题 + 图标矩阵 + 高对比背景',
      news: '模板：标题条幅 + 时间/要点 + 轻量图标',
      lifestyle: '模板：极简静物 + 低饱和背景 + 大标题',
      food: '模板：美食静物主视觉 + 大标题 + 简洁点缀',
      travel: '模板：地标剪影 + 位置标签 + 大标题',
      tech: '模板：科技卡片布局 + 设备/数据元素 + 主标题高亮',
      finance: '模板：数据看板风 + 上升/下降图标 + 关键词高亮',
      productivity: '模板：清单式大字 + 计时/勾选元素 + 高对比',
      entertainment: '模板：电影感海报 + 强光源 + 大标题',
      general: '模板：极简对比 + 超大标题 + 单一物件',
    },
  };

  const spec = coverSpecs[platform as keyof typeof coverSpecs];
  const specText = spec
    ? [
      `画幅比例：${spec.ratio}`,
      `分辨率建议：${spec.size}`,
      `版式：${spec.layout}`,
      `风格：${spec.style}`,
      `文字：${spec.text}`,
    ].join('\n')
    : `画幅比例：${ratioOverride || '16:9'}\n风格：清晰、主题突出、构图干净。`;

  const category = classifyCoverCategory(`${title || ''} ${coverSuggestion} ${contentForCover || ''}`);
  const templateText =
    coverTemplatesByCategory[platform as keyof typeof coverTemplatesByCategory]?.[category] ||
    coverTemplatesByCategory[platform as keyof typeof coverTemplatesByCategory]?.general ||
    '模板：极简大标题 + 单一物件/图标 + 干净背景';

  const commonRules = [
    '文字必须清晰可读，避免过小或过多文字',
    '对比强、主体突出，留出安全边距（四周至少5%留白）',
    '避免复杂背景和杂乱元素',
    '整体构图有明确视觉焦点',
    '禁止人物/人脸/人体特写，避免真人写实风格',
  ].join('\n');

  return `${base}\n\n主体与禁用规则：\n${subjectRules}\n\n平台规格与风格要求：\n${specText}\n\n内容类型判定：${category}\n指定模板：${templateText}\n\n通用规则：\n${commonRules}`;
}

type CoverCategory =
  | 'tutorial'
  | 'review'
  | 'list'
  | 'news'
  | 'lifestyle'
  | 'food'
  | 'travel'
  | 'tech'
  | 'finance'
  | 'productivity'
  | 'entertainment'
  | 'general';

function classifyCoverCategory(text: string): CoverCategory {
  const t = text.toLowerCase();
  if (/(教程|教学|指南|步骤|入门|技巧|方法|how to|tutorial|guide|tips)/i.test(t)) return 'tutorial';
  if (/(测评|评测|对比|横评|开箱|review|benchmark|vs)/i.test(t)) return 'review';
  if (/(清单|合集|盘点|top\s?\d+|排行榜|list|合集)/i.test(t)) return 'list';
  if (/(新闻|快讯|热点|趋势|发布|解读|news|trend|breaking)/i.test(t)) return 'news';
  if (/(生活|日常|穿搭|护肤|家居|vlog|lifestyle)/i.test(t)) return 'lifestyle';
  if (/(美食|料理|做饭|餐厅|探店|food|recipe|cooking)/i.test(t)) return 'food';
  if (/(旅行|攻略|打卡|景点|旅拍|travel|trip|itinerary)/i.test(t)) return 'travel';
  if (/(科技|数码|软件|硬件|ai|工具|tech|product|app|saas)/i.test(t)) return 'tech';
  if (/(金融|理财|投资|股票|基金|收益|finance|stock|invest|trade)/i.test(t)) return 'finance';
  if (/(效率|复盘|习惯|时间管理|生产力|productivity)/i.test(t)) return 'productivity';
  if (/(游戏|娱乐|影视|电影|综艺|动漫|music|movie|game|entertainment)/i.test(t)) return 'entertainment';
  return 'general';
}

// 解析AI返回的结构化内容
function parseAIResponse(response: string, platform: string): any {
  const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
  const metadata: any = {};
  const descriptionLines: string[] = [];
  const tagTokens: string[] = [];
  let currentKey: 'title' | 'description' | 'tags' | 'cover' | null = null;

  const matchLabel = (line: string) => {
    if (/^(标题|title)[:：]/i.test(line)) return 'title';
    if (/^(描述|简介|视频描述|description)[:：]/i.test(line)) return 'description';
    if (/^(标签|tag|tags)[:：]/i.test(line)) return 'tags';
    if (/^(封面|封面建议|cover)[:：]/i.test(line)) return 'cover';
    return null;
  };

  const extractAfterLabel = (line: string) => line.replace(/^[^:：]+[:：]/, '').trim();
  const extractTags = (text: string) => {
    const matches = text.match(/[#＃][^\s#＃]+/g);
    if (!matches) return [];
    return matches.map(tag => tag.replace(/^[#＃]/, '').trim()).filter(Boolean);
  };

  for (const line of lines) {
    const label = matchLabel(line);
    if (label) {
      currentKey = label;
      const value = extractAfterLabel(line);

      if (label === 'title') {
        let title = value;
        if (platform === 'video_wechat') {
          title = generateVideoWechatTitle(title);
        }
        if (title) metadata.title = title;
      } else if (label === 'description') {
        if (value) descriptionLines.push(value);
      } else if (label === 'tags') {
        if (value) tagTokens.push(...extractTags(value));
      } else if (label === 'cover') {
        if (value) metadata.coverSuggestion = value;
      }
      continue;
    }

    if (currentKey === 'description') {
      descriptionLines.push(line);
    } else if (currentKey === 'tags') {
      tagTokens.push(...extractTags(line));
    }
  }

  if (descriptionLines.length > 0) {
    metadata.description = descriptionLines.join('\n').trim();
  }

  if (tagTokens.length > 0) {
    metadata.tags = Array.from(new Set(tagTokens));
  }

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
  const keyPoints = extractKeyPoints(cleanContent, 3);
  const summary = buildSummary(keyPoints);

  const platformDefaults = {
    video_wechat: {
      title: generateVideoWechatTitle(originalTitle),
      description: `${summary} 更适合希望提升效率、掌握关键方法的人。`,
      tags: ['实用技巧', '干货分享', '个人成长'],
      coverSuggestion: '简洁清晰的标题配图，突出重点信息'
    },
    douyin: {
      title: `你绝对想不到${originalTitle ? '：' + originalTitle : '这个方法'}！`,
      description: `${summary} 🔥`,
      tags: ['涨知识', '实用技巧', '干货', '必看'],
      coverSuggestion: '高对比度配色，大字体标题，制造视觉冲击'
    },
    bilibili: {
      title: `【干货分享】${originalTitle || '实用技巧合集'}`,
      description: `${summary}。本期会拆解思路、方法与常见误区，适合想系统了解的朋友。`,
      tags: ['知识分享', '干货', '教程', '实用'],
      coverSuggestion: '信息量丰富的封面，包含主题和要点预览'
    },
    xiaohongshu: {
      title: `真的太实用了！${originalTitle || '必须分享'}`,
      description: `${summary}✨\n\n亲测有效，分享我的真实体验和方法细节～\n\n有问题评论区见～`,
      tags: ['实用好物', '真实测评', '干货分享', '必看'],
      coverSuggestion: '真实自然的生活场景，突出产品或效果'
    },
    youtube: {
      title: `${originalTitle || 'Product Deep Dive'} | Key Takeaways`,
      description: `${summary}\n\nIn this video, we cover the key ideas and practical takeaways.\n\nLinks:\n- Website: [link]\n- Newsletter: [link]`,
      tags: ['product', 'saas', 'growth', 'startup', 'marketing', 'tutorial', 'howto', 'strategy'],
      coverSuggestion: '高对比度背景 + 3-5个关键词大字标题 + 产品/场景元素点缀'
    }
  };

  return platformDefaults[platform as keyof typeof platformDefaults] || platformDefaults.video_wechat;
}

function extractKeyPoints(content: string, max: number): string[] {
  const sentences = content
    .split(/[。！？.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 12);
  if (sentences.length === 0) return [];
  return sentences.slice(0, max);
}

function buildSummary(keyPoints: string[]): string {
  if (keyPoints.length === 0) {
    return '今天分享一个能帮助你更高效解决问题的方法。';
  }
  if (keyPoints.length === 1) return keyPoints[0];
  return `${keyPoints[0]}，并结合${keyPoints[1]}给出具体做法。`;
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
    ],
    youtube: [
      '标题尽量包含核心关键词，避免过度标题党',
      '描述前两行最重要：放价值点与链接',
      '建议添加时间戳/章节（长视频更友好）',
      '标签更偏SEO关键词，注意相关性'
    ]
  };

  return tipsMap[platform as keyof typeof tipsMap] || [];
}
