/**
 * 订阅服务 - 管理用户订阅状态和功能权限
 */
class SubscriptionService {
  constructor() {
    this.userPlan = {
      plan: 'free',
      planExpiredAt: null,
      isPro: false,
      isExpired: false,
      isLoading: true
    };

    this.usageStats = {
      totalArticles: 0,
      monthlyImagesUsed: 0,
      usageLoading: true
    };

    this.features = this.initFeatures();
    this.upgradePrompts = this.initUpgradePrompts();
    
    // 缓存设置
    this.cacheExpiration = 5 * 60 * 1000; // 5分钟
    this.lastSync = 0;
  }

  /**
   * 初始化功能配置
   */
  initFeatures() {
    return {
      'unlimited-articles': {
        id: 'unlimited-articles',
        name: '无限文章存储',
        description: '保存无限数量的文章',
        plans: ['free', 'pro'],
        limits: {
          free: 5,
          pro: -1
        }
      },
      'multi-platform': {
        id: 'multi-platform', 
        name: '多平台发布',
        description: '支持知乎、掘金、知识星球平台',
        plans: ['pro']
      },
      'zhihu-platform': {
        id: 'zhihu-platform',
        name: '知乎平台',
        description: '发布到知乎专栏',
        plans: ['pro']
      },
      'juejin-platform': {
        id: 'juejin-platform',
        name: '掘金平台', 
        description: '发布到掘金社区',
        plans: ['pro']
      },
      'zsxq-platform': {
        id: 'zsxq-platform',
        name: '知识星球',
        description: '发布到知识星球',
        plans: ['pro']
      },
      'advanced-styles': {
        id: 'advanced-styles',
        name: '专业样式',
        description: '使用技术风格和简约风格模板',
        plans: ['pro']
      },
      'publish-presets': {
        id: 'publish-presets',
        name: '发布预设',
        description: '创建和管理发布模板',
        plans: ['pro']
      },
      'cloud-images': {
        id: 'cloud-images',
        name: '云端图片存储',
        description: '图片云端存储和管理',
        plans: ['free', 'pro'],
        limits: {
          free: 20,
          pro: 100
        }
      },
      // 视频平台支持
      'video_wechat-platform': {
        id: 'video_wechat-platform',
        name: '微信视频号',
        description: '发布到微信视频号',
        plans: ['pro']
      },
      'douyin-platform': {
        id: 'douyin-platform',
        name: '抖音平台',
        description: '发布到抖音短视频',
        plans: ['pro']
      },
      'bilibili-platform': {
        id: 'bilibili-platform',
        name:'B站平台',
        description: '发布到B站视频',
        plans: ['pro']
      },
      'xiaohongshu-platform': {
        id: 'xiaohongshu-platform',
        name: '小红书平台',
        description: '发布到小红书视频',
        plans: ['pro']
      }
    };
  }

  /**
   * 初始化升级提示配置
   */
  initUpgradePrompts() {
    return {
      'article-limit': {
        title: '文章存储已达上限',
        description: '免费版最多保存5篇文章，升级专业版获得无限存储空间',
        features: ['unlimited-articles', 'multi-platform', 'advanced-styles'],
        cta: '立即升级专业版',
        style: 'card'
      },
      'platform-locked': {
        title: '解锁更多平台',
        description: '升级专业版，一键发布到知乎、掘金、知识星球',
        features: ['zhihu-platform', 'juejin-platform', 'zsxq-platform'],
        cta: '解锁全平台发布',
        style: 'modal'
      },
      'style-locked': {
        title: '使用专业样式',
        description: '技术风格和简约风格让你的文章更出彩',
        features: ['advanced-styles'],
        cta: '解锁专业样式',
        style: 'inline'
      },
      'preset-locked': {
        title: '创建发布预设',
        description: '保存常用的发布配置，让发布更高效',
        features: ['publish-presets'],
        cta: '解锁预设功能', 
        style: 'tooltip'
      },
      'cloud-images-limit': {
        title: '图片存储已达上限',
        description: '免费版每月可使用20张图片，升级专业版获得500张/月额度',
        features: ['cloud-images'],
        cta: '升级获得更多图片额度',
        style: 'inline'
      }
    };
  }

  /**
   * 初始化订阅服务
   */
  async init() {
    try {
      console.log('🚀 初始化订阅服务...');
      
      // 添加超时机制，防止API调用hang住整个初始化流程
      const initTimeout = 10000; // 10秒超时
      
      await Promise.race([
        Promise.all([
          this.syncUserPlan(),
          this.syncUsageStats()
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('订阅服务初始化超时')), initTimeout)
        )
      ]);
      
      console.log('✅ 订阅服务初始化完成');
    } catch (error) {
      console.error('❌ 订阅服务初始化失败:', error);
      this.userPlan.isLoading = false;
      this.usageStats.usageLoading = false;
      
      // 设置默认值确保应用可以继续运行
      this.userPlan = {
        plan: 'free',
        planExpiredAt: null,
        isPro: false,
        isExpired: false,
        isLoading: false
      };
      
      this.usageStats = {
        totalArticles: 0,
        monthlyImagesUsed: 0,
        usageLoading: false
      };
      
      console.log('🔄 订阅服务使用默认配置继续运行');
    }
  }

  /**
   * 同步用户订阅信息
   */
  async syncUserPlan() {
    // 检查缓存
    if (Date.now() - this.lastSync < this.cacheExpiration && !this.userPlan.isLoading) {
      return this.userPlan;
    }

    try {
      console.log('📡 开始同步用户订阅信息...');
      
      // 添加超时机制
      const response = await Promise.race([
        window.ZiliuApiService.makeRequest('/api/auth/user-plan'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('用户订阅信息请求超时')), 8000)
        )
      ]);
      
      if (response.success) {
        this.userPlan = {
          ...response.data,
          isLoading: false
        };
      } else {
        this.userPlan = {
          plan: 'free',
          planExpiredAt: null,
          isPro: false,
          isExpired: false,
          isLoading: false
        };
      }
      
      this.lastSync = Date.now();
      console.log('✅ 用户订阅信息同步完成:', this.userPlan);
    } catch (error) {
      console.error('❌ 同步用户订阅信息失败:', error.message);
      this.userPlan = {
        plan: 'free',
        planExpiredAt: null,
        isPro: false,
        isExpired: false,
        isLoading: false
      };
    }

    return this.userPlan;
  }

  /**
   * 同步使用统计信息
   */
  async syncUsageStats() {
    try {
      console.log('📊 开始同步使用统计信息...');
      
      // 添加超时机制并行获取文章数量和图片使用量
      const [articlesResponse, imagesResponse] = await Promise.race([
        Promise.all([
          window.ZiliuApiService.makeRequest('/api/articles?page=1&limit=1').catch(() => ({ success: false })),
          window.ZiliuApiService.makeRequest('/api/usage/images').catch(() => ({ success: false }))
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('使用统计信息请求超时')), 8000)
        )
      ]);

      this.usageStats = {
        totalArticles: articlesResponse.success ? articlesResponse.data.total : 0,
        monthlyImagesUsed: imagesResponse.success ? imagesResponse.data.monthlyUsed : 0,
        usageLoading: false
      };

      console.log('✅ 使用统计信息同步完成:', this.usageStats);
    } catch (error) {
      console.error('❌ 同步使用统计信息失败:', error.message);
      this.usageStats = {
        totalArticles: 0,
        monthlyImagesUsed: 0,
        usageLoading: false
      };
    }

    return this.usageStats;
  }

  /**
   * 检查用户是否有某个功能权限
   */
  hasFeature(featureId) {
    const feature = this.features[featureId];
    if (!feature) return false;
    
    // 如果是专业版功能且用户不是专业版，返回false
    if (feature.plans.includes('pro') && !feature.plans.includes('free')) {
      return this.userPlan.isPro;
    }
    
    return feature.plans.includes(this.userPlan.plan);
  }

  /**
   * 获取功能限制数量
   */
  getFeatureLimit(featureId) {
    const feature = this.features[featureId];
    if (!feature || !feature.limits) return 0;
    
    return feature.limits[this.userPlan.plan] || 0;
  }

  /**
   * 统一的功能权限检查
   */
  checkFeatureAccess(featureId) {
    const feature = this.features[featureId];
    
    if (!feature) {
      return { hasAccess: false, reason: '功能不存在' };
    }

    // 如果已经是专业版，检查是否过期
    if (this.userPlan.isPro) {
      return { hasAccess: true };
    }

    // 免费版用户检查权限
    if (feature.plans.includes('free')) {
      // 如果有使用限制，检查是否超限
      if (feature.limits && feature.limits.free) {
        const limit = feature.limits.free;
        if (limit > 0) {
          // 根据不同功能类型检查不同的使用量
          if (featureId === 'unlimited-articles') {
            if (this.usageStats.totalArticles >= limit) {
              return {
                hasAccess: false,
                reason: `免费版最多只能创建 ${limit} 篇文章`,
                upgradePrompt: 'article-limit'
              };
            }
          }
          
          if (featureId === 'cloud-images') {
            if (this.usageStats.monthlyImagesUsed >= limit) {
              return {
                hasAccess: false,
                reason: `当月图片使用量已达上限（${this.usageStats.monthlyImagesUsed}/${limit}张）`,
                upgradePrompt: 'cloud-images-limit'
              };
            }
          }
        }
      }
      return { hasAccess: true };
    }

    // 专业版功能，免费版用户无权限
    const upgradePrompt = Object.keys(this.upgradePrompts).find(key => 
      this.upgradePrompts[key].features.includes(featureId)
    ) || 'platform-locked';

    return {
      hasAccess: false,
      reason: `此功能需要专业版权限`,
      upgradePrompt
    };
  }

  /**
   * 检查平台是否可用
   */
  isPlatformAvailable(platformId) {
    console.log('🔐 检查平台可用性:', platformId);
    
    // 从插件配置中获取平台信息
    let platformConfig = null;
    if (window.ZiliuPluginConfig && window.ZiliuPluginConfig.platforms) {
      platformConfig = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    }

    console.log('🔐 找到平台配置:', platformConfig?.name, '需要权限:', platformConfig?.requiredPlan, 'featureId:', platformConfig?.featureId);

    // 如果没有找到配置，返回不可用
    if (!platformConfig) {
      console.log('🔐 平台配置未找到');
      return { available: false, reason: '未知平台' };
    }

    // 如果平台不需要权限验证，直接返回可用
    if (!platformConfig.requiredPlan || !platformConfig.featureId) {
      console.log('🔐 平台无权限限制，允许访问');
      return { available: true };
    }

    // 微信公众号特殊处理 - 单独发布免费版可用
    if (platformId === 'wechat') {
      console.log('🔐 微信公众号特殊处理，允许访问');
      return { available: true };
    }

    // 其他平台需要检查专业版权限
    console.log('🔐 检查专业版权限，featureId:', platformConfig.featureId);
    const accessResult = this.checkFeatureAccess(platformConfig.featureId);
    console.log('🔐 权限检查结果:', accessResult);
    return {
      available: accessResult.hasAccess,
      reason: accessResult.reason,
      upgradePrompt: accessResult.upgradePrompt
    };
  }

  /**
   * 检查是否可以创建文章
   */
  canCreateArticle() {
    const accessResult = this.checkFeatureAccess('unlimited-articles');
    return {
      canCreate: accessResult.hasAccess,
      reason: accessResult.reason,
      upgradePrompt: accessResult.upgradePrompt
    };
  }

  /**
   * 获取升级提示信息
   */
  getUpgradePrompt(promptId) {
    return this.upgradePrompts[promptId] || this.upgradePrompts['platform-locked'];
  }

  /**
   * 刷新订阅状态
   */
  async refresh() {
    this.lastSync = 0; // 清除缓存
    await this.syncUserPlan();
    await this.syncUsageStats();
  }

  /**
   * 计算剩余天数
   */
  getDaysRemaining() {
    if (!this.userPlan.planExpiredAt) return 0;
    
    return Math.max(0, Math.ceil(
      (new Date(this.userPlan.planExpiredAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));
  }

  /**
   * 获取当前用户计划信息
   */
  getUserPlan() {
    return {
      ...this.userPlan,
      ...this.usageStats,
      daysRemaining: this.getDaysRemaining()
    };
  }

  /**
   * 显示升级提示
   */
  showUpgradePrompt(promptId = 'platform-locked') {
    const prompt = this.getUpgradePrompt(promptId);
    
    // 触发升级提示事件
    window.ZiliuEventBus?.emit('upgrade-prompt', {
      prompt,
      userPlan: this.getUserPlan()
    });
  }
}

// 创建全局实例
window.ZiliuSubscriptionService = new SubscriptionService();

console.log('✅ 字流订阅服务已加载');