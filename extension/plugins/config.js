/**
 * 插件配置文件 - 定义所有可用的插件和平台
 * 新增平台只需要在这里添加配置即可
 */
window.ZiliuPluginConfig = {
  // 平台插件配置
  platforms: [
    {
      id: 'wechat',
      name: '微信公众号平台插件',
      displayName: '微信公众号',
      enabled: true,
      urlPatterns: [
        'https://mp.weixin.qq.com/*',
        'http://mp.weixin.qq.com/*'
      ],
      editorUrl: 'https://mp.weixin.qq.com/',
      selectors: {
        title: '#title',
        author: '#author',
        content: '.ProseMirror, .rich_media_content .ProseMirror, [contenteditable="true"]:not(.editor_content_placeholder)',
        contentFallback: '#ueditor_0',
        digest: 'textarea[name="digest"], #js_description, textarea[placeholder*="选填"]'
      },
      features: ['title', 'author', 'content', 'digest', 'richText'],
      contentType: 'html',
      specialHandling: {
        initDelay: 500,
        noCopyButton: true  // 微信公众号禁用复制按钮
      },
      priority: 10
    },
    {
      id: 'zhihu',
      name: '知乎平台插件',
      displayName: '知乎',
      enabled: true,
      requiredPlan: 'pro', // 需要专业版
      featureId: 'zhihu-platform',
      urlPatterns: [
        'https://zhuanlan.zhihu.com/write*',
        'https://zhuanlan.zhihu.com/p/*/edit*'
      ],
      editorUrl: 'https://zhuanlan.zhihu.com/write',
      selectors: {
        title: '.WriteIndex-titleInput input, input[placeholder*="请输入标题"]',
        content: '.DraftEditor-editorContainer [contenteditable="true"]'
      },
      features: ['title', 'content', 'markdown'],
      contentType: 'markdown',
      specialHandling: {
        waitForEditor: true,
        maxWaitTime: 10000,
        initDelay: 1500,
        retryOnFail: true,
        retryDelay: 2000,
        // 知乎平台按钮定制
        buttonConfig: {
          fillButton: {
            text: '填充标题',
            tooltip: '知乎平台仅填充标题，正文请使用复制功能'
          },
          copyButton: {
            text: '复制正文',
            tooltip: '复制文章正文内容'  
          }
        },
        fillMode: 'titleOnly'  // 知乎只填充标题
      },
      priority: 8
    },
    {
      id: 'juejin',
      name: '掘金平台插件',
      displayName: '掘金',
      enabled: true,
      requiredPlan: 'pro', // 需要专业版
      featureId: 'juejin-platform',
      urlPatterns: [
        'https://juejin.cn/editor/*',
        'https://juejin.cn/post/*'
      ],
      editorUrl: 'https://juejin.cn/editor/drafts/new',
      selectors: {
        title: 'input[placeholder*="请输入标题"]',
        content: '.bytemd-editor .CodeMirror, .bytemd .CodeMirror'
      },
      features: ['title', 'content', 'markdown'],
      contentType: 'markdown',
      specialHandling: {
        initDelay: 2000,
        retryOnFail: true,
        retryDelay: 3000,
        // 掘金平台按钮定制
        buttonConfig: {
          fillButton: {
            text: '填充标题',
            tooltip: '掘金平台仅填充标题，正文请使用复制功能'
          },
          copyButton: {
            text: '复制正文',
            tooltip: '复制文章正文内容'  
          }
        },
        fillMode: 'titleOnly'  // 掘金只填充标题
      },
      priority: 6
    },
    {
      id: 'zsxq',
      name: '知识星球平台插件', 
      displayName: '知识星球',
      enabled: true,
      requiredPlan: 'pro', // 需要专业版
      featureId: 'zsxq-platform',
      urlPatterns: [
        'https://wx.zsxq.com/group/*',
        'https://wx.zsxq.com/article?groupId=*'
      ],
      editorUrl: 'https://wx.zsxq.com/',
      selectors: {
        title: 'input[placeholder*="请输入主题"]',
        content: '[contenteditable="true"]:not(.ql-editor-placeholder)'
      },
      features: ['title', 'content', 'listProcessing'],
      contentType: 'html',
      specialHandling: {
        processLists: true, // 处理ol/ul标签显示问题
        initDelay: 1000,
        noCopyButton: true, // 禁用复制按钮
        // 知识星球平台按钮定制
        buttonConfig: {
          fillButton: {
            text: '🌟 选择星球发布',
            tooltip: '选择知识星球进行一键发布',
            style: {
              background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
              color: 'white'
            }
          }
          // 不定义copyButton，因为noCopyButton: true
        }
      },
      priority: 7
    },
    {
      id: 'video_wechat',
      name: '微信视频号平台插件',
      displayName: '微信视频号',
      enabled: true,
      requiredPlan: 'pro', // 需要专业版
      featureId: 'video_wechat-platform',
      urlPatterns: [
        'https://channels.weixin.qq.com/platform/post/create*',
        'https://channels.weixin.qq.com/platform/post/edit/*'
      ],
      editorUrl: 'https://channels.weixin.qq.com/platform/post/create',
      selectors: {
        // 短标题输入框 - 精确匹配
        title: 'input[placeholder*="概括视频主要内容"]',
        // 视频描述编辑器 - 可能需要激活后出现
        description: '[contenteditable="true"], .input-editor, [role="textbox"]'
      },
      features: ['videoTitle', 'videoDescription', 'tags'],
      contentType: 'video',
      specialHandling: {
        initDelay: 1500,
        retryOnFail: true,
        retryDelay: 2000,
        // 视频平台按钮定制
        buttonConfig: {
          fillButton: {
            text: '📹 填充视频内容',
            tooltip: '填充视频标题、描述和标签到视频号编辑器'
          },
          copyButton: {
            text: '📋 复制视频文案',
            tooltip: '复制适合视频号的文案内容'
          }
        },
        // 视频平台特殊处理
        activateEditor: true, // 需要激活编辑器
        supportTags: true,    // 支持标签
        titleLimit: { min: 6, max: 16 } // 标题长度限制
      },
      priority: 9
    },
    {
      id: 'douyin',
      name: '抖音平台插件',
      displayName: '抖音',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'douyin-platform',
      urlPatterns: [
        'https://creator.douyin.com/creator-micro/content/post/video*'
      ],
      editorUrl: 'https://creator.douyin.com/creator-micro/content/post/video',
      selectors: {
        title: 'input[placeholder*="填写作品标题"], textbox[placeholder*="填写作品标题"]',
        content: '[contenteditable="true"], .text-editor, .content-editor',
        tags: 'input[placeholder*="添加话题"], .topic-input'
      },
      features: ['videoTitle', 'videoDescription', 'tags'],
      contentType: 'video',
      specialHandling: {
        initDelay: 3000,
        retryOnFail: true,
        retryDelay: 3000,
        buttonConfig: {
          fillButton: {
            text: '🎵 填充抖音内容',
            tooltip: '填充视频标题、描述和话题到抖音编辑器'
          },
          copyButton: {
            text: '📋 复制视频文案',
            tooltip: '复制适合抖音的短视频文案'
          }
        },
        activateEditor: true,
        supportTags: true,
        titleLimit: { min: 1, max: 30 },
        contentLimit: { max: 1000 }
      },
      priority: 7
    },
    {
      id: 'bilibili',
      name: 'B站(哔哩哔哩)平台插件',
      displayName: 'B站',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'bilibili-platform',
      urlPatterns: [
        'https://member.bilibili.com/platform/upload/video/frame*',
        'https://member.bilibili.com/york/video-up*'
      ],
      editorUrl: 'https://member.bilibili.com/platform/upload/video/frame',
      selectors: {
        title: 'input[placeholder*="请输入稿件标题"], textbox[placeholder*="请输入稿件标题"]',
        description: '[contenteditable="true"], .editor-content, textarea[placeholder*="简介"]',
        tagInput: 'input[placeholder*="按回车键Enter创建标签"]',
        recommendTags: '.hot-tag-container'
      },
      features: ['videoTitle', 'videoDescription', 'tags', 'smartTags'],
      contentType: 'video',
      specialHandling: {
        initDelay: 2000,
        retryOnFail: true,
        retryDelay: 2000,
        buttonConfig: {
          fillButton: {
            text: '📺 智能填充B站',
            tooltip: '智能填充标题、简介，特别是智能标签匹配功能'
          },
          copyButton: {
            text: '📋 复制视频文案',
            tooltip: '复制适合B站的视频内容'
          }
        },
        // B站特有功能
        smartTagMatching: true,    // 智能标签匹配
        useRecommendTags: true,    // 优先使用推荐标签
        manualTagInput: true,      // 支持手动输入标签
        titleLimit: { min: 1, max: 80 },
        contentLimit: { max: 2000 },
        tagLimit: { max: 10 }
      },
      priority: 8
    },
    {
      id: 'xiaohongshu',
      name: '小红书平台插件',
      displayName: '小红书',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'xiaohongshu-platform',
      urlPatterns: [
        'https://creator.xiaohongshu.com/publish/publish*'
      ],
      editorUrl: 'https://creator.xiaohongshu.com/publish/publish',
      selectors: {
        title: 'input[placeholder*="填写标题"]',
        content: 'div[contenteditable="true"]',
        topicButton: 'button:has-text("话题")',
        recommendTags: '.recommend-topic-wrapper > *'
      },
      features: ['videoTitle', 'videoDescription', 'tags', 'topics'],
      contentType: 'video',
      specialHandling: {
        initDelay: 2000,
        retryOnFail: true,
        retryDelay: 2000,
        buttonConfig: {
          fillButton: {
            text: '📖 填充小红书',
            tooltip: '智能填充标题、描述和话题标签到小红书编辑器'
          },
          copyButton: {
            text: '📋 复制笔记内容',
            tooltip: '复制适合小红书的笔记内容'
          }
        },
        // 小红书特有功能
        smartTopicMatching: true,    // 智能话题匹配
        useRecommendTopics: true,    // 优先使用推荐话题
        addTopicsToContent: true,    // 支持将话题添加到内容区
        titleLimit: { min: 1, max: 20 },
        contentLimit: { max: 1000 },
        topicLimit: { max: 10 }
      },
      priority: 9
    }
  ],

  // 服务插件配置
  services: [
    {
      id: 'article-service',
      name: '文章服务',
      enabled: true,
      dependencies: []
    },
    {
      id: 'preset-service', 
      name: '预设服务',
      enabled: true,
      dependencies: []
    },
    {
      id: 'publish-service',
      name: '发布服务',
      enabled: true,
      dependencies: ['article-service']
    }
  ],

  // UI组件插件配置
  ui: [
    {
      id: 'panel-manager',
      name: '面板管理器',
      enabled: true,
      dependencies: []
    },
    {
      id: 'button-generator',
      name: '按钮生成器', 
      enabled: true,
      dependencies: []
    }
  ],

  // 全局设置
  settings: {
    // 自动注入设置
    autoInject: true,
    
    // 调试模式
    debug: false,
    
    // 加载超时时间
    loadTimeout: 10000,
    
    // 平台检测延迟
    platformDetectionDelay: 1000
  }
};

/**
 * 根据当前URL获取应该加载的平台插件
 */
window.ZiliuPluginConfig.getPluginsForUrl = function(url) {
  return this.platforms.filter(platform => {
    if (!platform.enabled) return false;
    
    return platform.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern
          .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
          .replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(url);
      } catch (error) {
        console.warn('URL模式匹配失败:', { pattern, error });
        return false;
      }
    });
  });
};