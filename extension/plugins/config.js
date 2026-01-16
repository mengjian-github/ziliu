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
        'https://mp.weixin.qq.com/cgi-bin/appmsg?*createType=0*',
        'http://mp.weixin.qq.com/cgi-bin/appmsg?*createType=0*',
        'https://mp.weixin.qq.com/cgi-bin/appmsg?*action=edit*',
        'http://mp.weixin.qq.com/cgi-bin/appmsg?*action=edit*',
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
      id: 'wechat_xiaolushu',
      name: '微信小绿书平台插件',
      displayName: '小绿书',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'wechat_xiaolushu-platform',
      // 小绿书与长文同域名，靠 URL 参数区分：createType=8
      urlPatterns: [
        'https://mp.weixin.qq.com/cgi-bin/appmsg*createType=8*',
        'http://mp.weixin.qq.com/cgi-bin/appmsg*createType=8*',
        'https://mp.weixin.qq.com/cgi-bin/appmsg*createtype=8*',
        'http://mp.weixin.qq.com/cgi-bin/appmsg*createtype=8*'
      ],
      editorUrl: 'https://mp.weixin.qq.com/',
      // 微信编辑器由专用插件处理，这里的 selectors 仅用于展示/兜底
      selectors: {
        title: '#title',
        content: '.ProseMirror, .rich_media_content .ProseMirror, [contenteditable="true"]:not(.editor_content_placeholder)'
      },
      // 小绿书通常不需要作者/摘要，先保持最小字段
      features: ['title', 'content', 'tags', 'images'],
      // 小绿书使用短图文处理逻辑
      contentType: 'text',
      specialHandling: {
        initDelay: 500,
        noCopyButton: true
      },
      // 高于 wechat，让 createType=8 优先匹配
      priority: 20
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
            text: '📹 填充视频',
            tooltip: '填充视频标题、描述和标签到视频号编辑器'
          },
          copyButton: {
            text: '📋 复制文案',
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
            text: '🎵 填充抖音',
            tooltip: '填充视频标题、描述和话题到抖音编辑器'
          },
          copyButton: {
            text: '📋 复制文案',
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
            text: '📺 填充B站',
            tooltip: '智能填充标题、简介，特别是智能标签匹配功能'
          },
          copyButton: {
            text: '📋 复制文案',
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
      displayName: '小红书（视频）',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'xiaohongshu-platform',
      urlPatterns: [
        'https://creator.xiaohongshu.com/publish/publish*'
      ],
      editorUrl: 'https://creator.xiaohongshu.com/publish/publish',
      // 小红书页面复杂，由专用插件处理，selectors 用于兜底
      selectors: {
        title: 'input[placeholder*="填写标题"]',
        description: 'div[contenteditable="true"]'
      },
      features: ['videoTitle', 'videoDescription', 'tags', 'topics'],
      contentType: 'video',
      specialHandling: {
        // 与小红书图文共用 URL，允许根据网站端选择的平台进行匹配
        sharedUrlGroup: 'xiaohongshu',
        initDelay: 2000,
        retryOnFail: true,
        retryDelay: 2000,
        buttonConfig: {
          fillButton: {
            text: '📕 填充小红书',
            tooltip: '填充视频标题、描述与话题标签到小红书编辑器'
          },
          copyButton: {
            text: '📋 复制文案',
            tooltip: '复制适合小红书视频的文案'
          }
        },
        smartTopicMatching: true,
        useRecommendTopics: true,
        addTopicsToContent: true,
        titleLimit: { min: 1, max: 20 },
        contentLimit: { max: 1000 },
        topicLimit: { max: 10 }
      },
      priority: 9
    },
    {
      id: 'xiaohongshu_note',
      name: '小红书图文平台插件',
      displayName: '小红书（图文）',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'xiaohongshu_note-platform',
      // 目前小红书图文/视频在创作者平台大多共用 publish 页面，因此先复用 URL
      urlPatterns: [
        'https://creator.xiaohongshu.com/publish/publish*'
      ],
      editorUrl: 'https://creator.xiaohongshu.com/publish/publish',
      selectors: {
        title: 'input[placeholder*="填写标题"]',
        content: 'div[contenteditable="true"]',
        topicButton: 'button[class*="contentBtn"]',
        recommendTags: '.recommend-topic-wrapper > *'
      },
      features: ['title', 'content', 'tags', 'topics'],
      contentType: 'text',
      specialHandling: {
        sharedUrlGroup: 'xiaohongshu',
        initDelay: 2000,
        retryOnFail: true,
        retryDelay: 2000,
        buttonConfig: {
          fillButton: {
            text: '📕 填充小红书',
            tooltip: '填充标题、正文与话题标签到小红书图文编辑器'
          },
          copyButton: {
            text: '📋 复制文案',
            tooltip: '复制适合小红书图文的笔记内容'
          }
        },
        smartTopicMatching: true,
        useRecommendTopics: true,
        addTopicsToContent: true,
        titleLimit: { min: 1, max: 20 },
        contentLimit: { max: 1000 },
        topicLimit: { max: 10 }
      },
      priority: 8
    },

    // =========================
    // 🇨🇳 国内短图文（微博 / 即刻）
    // =========================
    {
      id: 'weibo',
      name: '微博平台插件',
      displayName: '微博',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'weibo-platform',
      urlPatterns: [
        'https://weibo.com/*',
        'https://www.weibo.com/*'
      ],
      editorUrl: 'https://weibo.com/',
      selectors: {
        content: [
          'textarea[placeholder*="新鲜事"]',
          'textarea[placeholder*="说点什么"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"]'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充微博',
            tooltip: '填充短文案到微博输入框'
          },
          copyButton: {
            text: '复制文案',
            tooltip: '复制适合微博的短文案'
          }
        },
        contentLimit: { max: 2000 }
      },
      priority: 8
    },
    {
      id: 'jike',
      name: '即刻平台插件',
      displayName: '即刻',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'jike-platform',
      urlPatterns: [
        'https://web.okjike.com/*'
      ],
      editorUrl: 'https://web.okjike.com/',
      selectors: {
        content: [
          'div[role="dialog"] div[role="textbox"][contenteditable="true"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充即刻',
            tooltip: '填充短文案到即刻发布框'
          },
          copyButton: {
            text: '复制文案',
            tooltip: '复制适合即刻的短文案'
          }
        },
        contentLimit: { max: 2000 }
      },
      priority: 8
    },

    // =========================
    // 🌍 海外 / 出海平台（短图文）
    // =========================
    {
      id: 'x',
      name: 'X 平台插件',
      displayName: 'X',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'x-platform',
      urlPatterns: [
        'https://x.com/*',
        'https://twitter.com/*'
      ],
      editorUrl: 'https://x.com/home',
      selectors: {
        content: [
          'div[data-testid="tweetTextarea_0"][contenteditable="true"]',
          'div[data-testid="tweetTextarea_0"] div[contenteditable="true"]',
          'div[role="textbox"][contenteditable="true"][data-testid^="tweetTextarea_"]',
          'div[role="textbox"][contenteditable="true"][aria-label*="Post"]',
          'div[role="textbox"][contenteditable="true"][aria-label*="Tweet"]'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充文案',
            tooltip: '填充短文案到 X 发布框'
          },
          copyButton: {
            text: '复制文案',
            tooltip: '复制适合 X 的短文案'
          }
        },
        contentLimit: { max: 4000 }
      },
      priority: 9
    },
    {
      id: 'linkedin',
      name: 'LinkedIn 平台插件',
      displayName: 'LinkedIn',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'linkedin-platform',
      urlPatterns: [
        'https://www.linkedin.com/*'
      ],
      editorUrl: 'https://www.linkedin.com/feed/',
      selectors: {
        content: [
          // 发帖弹窗优先（避免误选消息输入框）
          'div[role="dialog"] div[role="textbox"][contenteditable="true"]',
          // 兼容不同语言/版本的占位属性
          'div[role="textbox"][contenteditable="true"][data-placeholder*="What"]',
          'div[role="textbox"][contenteditable="true"][data-placeholder*="分享"]',
          'div[role="textbox"][contenteditable="true"][data-placeholder*="想要"]',
          // 兜底
          'div[role="textbox"][contenteditable="true"][aria-label*="Text"]'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充动态',
            tooltip: '填充内容到 LinkedIn 发帖编辑器（建议先点“开始发帖”打开弹窗）'
          },
          copyButton: {
            text: '复制动态',
            tooltip: '复制适合 LinkedIn 的内容'
          }
        },
        contentLimit: { max: 3000 }
      },
      priority: 9
    },
    {
      id: 'instagram',
      name: 'Instagram 平台插件',
      displayName: 'Instagram',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'instagram-platform',
      urlPatterns: [
        'https://www.instagram.com/*'
      ],
      editorUrl: 'https://www.instagram.com/',
      selectors: {
        content: [
          // 发布弹窗/编辑页的文案输入框（不同语言/版本）
          'div[role="dialog"] textarea',
          'textarea[aria-label*="Write a caption"]',
          'textarea[aria-label*="Write a caption…"]',
          'textarea[placeholder*="Write a caption"]',
          'textarea[aria-label*="写说明"]',
          'textarea',
          // 兜底：少数场景用 contenteditable
          'div[role="textbox"][contenteditable="true"]'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充文案',
            tooltip: '填充内容到 Instagram 发布文案输入框（建议先打开“创建帖子”弹窗）'
          },
          copyButton: {
            text: '复制文案',
            tooltip: '复制适合 Instagram 的文案'
          }
        },
        contentLimit: { max: 2200 }
      },
      priority: 9
    },
    {
      id: 'facebook',
      name: 'Facebook 平台插件',
      displayName: 'Facebook',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'facebook-platform',
      urlPatterns: [
        'https://www.facebook.com/*'
      ],
      editorUrl: 'https://www.facebook.com/',
      selectors: {
        content: [
          // 发帖弹窗优先
          'div[role="dialog"] div[role="textbox"][contenteditable="true"]',
          // 兼容英文/中文 aria-label
          'div[role="textbox"][contenteditable="true"][aria-label*="What"]',
          'div[role="textbox"][contenteditable="true"][aria-label*="有什么新鲜事"]',
          'div[role="textbox"][contenteditable="true"][aria-label*="在想些"]',
          // 兜底
          'div[role="textbox"][contenteditable="true"]'
        ]
      },
      features: ['content'],
      contentType: 'text',
      specialHandling: {
        initDelay: 1500,
        waitForEditor: true,
        maxWaitTime: 10000,
        buttonConfig: {
          fillButton: {
            text: '填充动态',
            tooltip: '填充内容到 Facebook 发帖框（建议先打开“发帖”弹窗）'
          },
          copyButton: {
            text: '复制动态',
            tooltip: '复制适合 Facebook 的动态内容'
          }
        }
      },
      priority: 9
    },
    // =========================
    // 🌍 海外 / 出海平台（视频）
    // =========================
    {
      id: 'youtube',
      name: 'YouTube 平台插件',
      displayName: 'YouTube',
      enabled: true,
      requiredPlan: 'pro',
      featureId: 'youtube-platform',
      urlPatterns: [
        'https://studio.youtube.com/*'
      ],
      editorUrl: 'https://studio.youtube.com/',
      // YouTube Studio 使用 Web Components + Shadow DOM：由专用插件完成元素查找
      selectors: {},
      features: ['videoTitle', 'videoDescription', 'tags'],
      contentType: 'video',
      specialHandling: {
        initDelay: 2000,
        waitForEditor: true,
        maxWaitTime: 15000,
        buttonConfig: {
          fillButton: {
            text: '🎬 填充 YouTube',
            tooltip: '填充标题、简介到 YouTube Studio（需在上传详情页）'
          },
          copyButton: {
            text: '📋 复制文案',
            tooltip: '复制适合 YouTube 的标题/简介'
          }
        },
        titleLimit: { min: 1, max: 100 },
        contentLimit: { max: 5000 },
        supportTags: true
      },
      priority: 10
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
window.ZiliuPluginConfig.getPluginsForUrl = function (url) {
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
