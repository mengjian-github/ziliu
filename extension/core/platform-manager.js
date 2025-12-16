/**
 * 平台管理服务 - 统一管理平台相关的业务逻辑
 * 从 background.js 中移出的平台业务逻辑
 */
class ZiliuPlatformManager {
  constructor() {
    this.supportedPlatforms = new Map();
    this.init();
  }

  /**
   * 初始化平台管理器
   */
  init() {
    console.log('🚀 平台管理服务初始化');
    this.loadPlatformConfigs();
  }

  /**
   * 从插件配置加载平台配置
   */
  loadPlatformConfigs() {
    if (!window.ZiliuPluginConfig) {
      console.warn('⚠️ 插件配置未找到，延迟加载平台配置');
      // 延迟重试加载配置
      setTimeout(() => {
        if (window.ZiliuPluginConfig) {
          this.loadPlatformConfigs();
        }
      }, 1000);
      return;
    }

    const platforms = window.ZiliuPluginConfig.platforms || [];
    platforms.forEach(platform => {
      if (platform.enabled) {
        this.supportedPlatforms.set(platform.id, {
          ...platform,
          // 添加发布相关配置
          publishConfig: this.createPublishConfig(platform)
        });
        console.log(`✅ 已加载平台配置: ${platform.displayName}`);
      }
    });
  }

  /**
   * 根据平台配置创建发布配置
   */
  createPublishConfig(platform) {
    return {
      urlPattern: this.buildUrlPattern(platform.urlPatterns),
      newTabUrl: platform.editorUrl,
      platformName: platform.displayName,
      loadDelay: platform.specialHandling?.initDelay || 2000
    };
  }

  /**
   * 构建URL模式（取第一个作为发布检查模式）
   */
  buildUrlPattern(urlPatterns) {
    if (!urlPatterns || urlPatterns.length === 0) {
      return '*';
    }
    return urlPatterns[0].replace('https://', '*://').replace('http://', '*://');
  }

  /**
   * 获取平台发布配置
   */
  getPlatformPublishConfig(platformId) {
    const platform = this.supportedPlatforms.get(platformId);
    return platform?.publishConfig || null;
  }

  /**
   * 根据URL查找匹配的平台
   */
  findPlatformByUrl(url) {
    for (const [id, platform] of this.supportedPlatforms) {
      if (this.urlMatches(url, platform.publishConfig.urlPattern)) {
        return { id, ...platform };
      }
    }
    return null;
  }

  /**
   * 检查URL是否匹配模式
   */
  urlMatches(url, pattern) {
    try {
      const escapedPattern = pattern
        .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp('^' + escapedPattern + '$', 'i');
      return regex.test(url);
    } catch (error) {
      console.warn('URL匹配失败:', { pattern, error });
      return false;
    }
  }

  /**
   * 获取所有支持的平台ID列表
   */
  getSupportedPlatforms() {
    return Array.from(this.supportedPlatforms.keys());
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo(platformId) {
    return this.supportedPlatforms.get(platformId) || null;
  }

  /**
   * 检查平台是否支持特定功能
   */
  supportsFeature(platformId, feature) {
    const platform = this.supportedPlatforms.get(platformId);
    return platform ? platform.features.includes(feature) : false;
  }

  /**
   * 获取平台的特殊处理配置
   */
  getSpecialHandling(platformId) {
    const platform = this.supportedPlatforms.get(platformId);
    return platform?.specialHandling || {};
  }

  /**
   * 规范化平台ID（处理中文名称映射）
   */
  normalizePlatformId(platform) {
    const mappings = {
      '微信': 'wechat',
      '微信公众号': 'wechat',
      '知乎': 'zhihu',
      '掘金': 'juejin',
      '知识星球': 'zsxq'
    };

    const normalized = platform?.toLowerCase() || 'wechat';
    return mappings[platform] || mappings[normalized] || normalized;
  }

  /**
   * 检查平台是否被禁用
   */
  isPlatformDisabled(platformId) {
    const platform = this.supportedPlatforms.get(platformId);
    return platform?.specialHandling?.disabled === true;
  }

  /**
   * 检查平台是否仅支持复制模式
   */
  isCopyOnlyPlatform(platformId) {
    const platform = this.supportedPlatforms.get(platformId);
    return platform?.specialHandling?.copyOnly === true;
  }

  /**
   * 检查平台是否可用（权限控制）
   */
  async isPlatformAvailable(platformId) {
    const platform = this.supportedPlatforms.get(platformId);
    if (!platform) {
      return { available: false, reason: '平台不存在' };
    }

    // 如果平台不需要订阅验证（如微信公众号），直接返回可用
    if (!platform.requiredPlan || !platform.featureId) {
      return { available: true };
    }

    // 检查订阅权限
    if (window.ZiliuSubscriptionService) {
      try {
        // 确保订阅服务已初始化
        if (window.ZiliuSubscriptionService.userPlan.isLoading) {
          await window.ZiliuSubscriptionService.syncUserPlan();
        }
        
        return window.ZiliuSubscriptionService.isPlatformAvailable(platformId);
      } catch (error) {
        console.warn('检查平台权限失败:', error);
        return { available: false, reason: '权限检查失败' };
      }
    }

    // 如果订阅服务不可用，对需要专业版的平台返回不可用
    if (platform.requiredPlan === 'pro') {
      return { 
        available: false, 
        reason: '此平台需要专业版权限'
      };
    }

    return { available: true };
  }

  /**
   * 显示平台权限状态（供应用调用）
   */
  async showPlatformStatus(platformId) {
    const availability = await this.isPlatformAvailable(platformId);
    const platform = this.supportedPlatforms.get(platformId);
    
    if (!availability.available && platform) {
      // 显示平台锁定状态
      if (window.ZiliuSubscriptionStatus) {
        window.ZiliuSubscriptionStatus.showPlatformLocked(platform.displayName);
      }
      return false;
    }
    
    return true;
  }

  /**
   * 获取可用的平台列表（已过滤权限）
   */
  async getAvailablePlatforms() {
    const availablePlatforms = [];
    
    for (const [id, platform] of this.supportedPlatforms) {
      const availability = await this.isPlatformAvailable(id);
      if (availability.available) {
        availablePlatforms.push({ id, ...platform });
      }
    }
    
    return availablePlatforms;
  }

  /**
   * 获取被权限限制的平台列表
   */
  async getRestrictedPlatforms() {
    const restrictedPlatforms = [];
    
    for (const [id, platform] of this.supportedPlatforms) {
      const availability = await this.isPlatformAvailable(id);
      if (!availability.available) {
        restrictedPlatforms.push({ 
          id, 
          ...platform, 
          restriction: availability 
        });
      }
    }
    
    return restrictedPlatforms;
  }
}

// 全局平台管理器实例
window.ZiliuPlatformManager = new ZiliuPlatformManager();