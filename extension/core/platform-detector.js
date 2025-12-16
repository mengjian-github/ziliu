/**
 * 平台检测工具 - 统一的平台检测和配置获取
 * 替换所有硬编码的平台URL检查
 */
class ZiliuPlatformDetector {
  constructor() {
    this.init();
  }

  /**
   * 初始化检测器
   */
  init() {
    console.log('🔧 平台检测工具初始化');
  }

  /**
   * 检测当前URL对应的平台
   */
  detectCurrentPlatform() {
    const url = window.location.href;
    return this.detectPlatformFromUrl(url);
  }

  /**
   * 根据URL检测平台
   */
  detectPlatformFromUrl(url) {
    if (!window.ZiliuPluginConfig) {
      console.warn('⚠️ 插件配置未加载，无法检测平台');
      return null;
    }

    const matchedPlatforms = window.ZiliuPluginConfig.getPluginsForUrl(url);
    if (matchedPlatforms.length === 0) {
      return null;
    }

    // 返回优先级最高的平台
    return matchedPlatforms.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * 检查URL是否属于指定平台
   */
  isPlatformUrl(url, platformId) {
    const platform = this.detectPlatformFromUrl(url);
    return platform?.id === platformId;
  }

  /**
   * 检查当前页面是否属于指定平台
   */
  isCurrentPlatform(platformId) {
    return this.isPlatformUrl(window.location.href, platformId);
  }

  /**
   * 检查是否为微信公众号页面
   */
  isWeChatPage(url = window.location.href) {
    return this.isPlatformUrl(url, 'wechat');
  }

  /**
   * 检查是否为知乎页面
   */
  isZhihuPage(url = window.location.href) {
    return this.isPlatformUrl(url, 'zhihu');
  }

  /**
   * 检查是否为掘金页面
   */
  isJuejinPage(url = window.location.href) {
    return this.isPlatformUrl(url, 'juejin');
  }

  /**
   * 检查是否为知识星球页面
   */
  isZsxqPage(url = window.location.href) {
    return this.isPlatformUrl(url, 'zsxq');
  }

  /**
   * 检查是否为支持的平台页面
   */
  isSupportedPlatform(url = window.location.href) {
    return this.detectPlatformFromUrl(url) !== null;
  }

  /**
   * 获取平台的编辑器URL
   */
  getPlatformEditorUrl(platformId) {
    if (!window.ZiliuPluginConfig?.platforms) {
      return null;
    }

    const platform = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    return platform?.editorUrl || null;
  }

  /**
   * 获取平台的URL模式
   */
  getPlatformUrlPatterns(platformId) {
    if (!window.ZiliuPluginConfig?.platforms) {
      return [];
    }

    const platform = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    return platform?.urlPatterns || [];
  }

  /**
   * 获取所有支持的平台列表
   */
  getSupportedPlatforms() {
    if (!window.ZiliuPluginConfig?.platforms) {
      return [];
    }

    return window.ZiliuPluginConfig.platforms
      .filter(p => p.enabled)
      .map(p => ({
        id: p.id,
        name: p.displayName,
        urlPatterns: p.urlPatterns
      }));
  }

  /**
   * 检查平台是否启用
   */
  isPlatformEnabled(platformId) {
    if (!window.ZiliuPluginConfig?.platforms) {
      return false;
    }

    const platform = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    return platform?.enabled === true;
  }

  /**
   * 检查平台是否禁用填充功能
   */
  isPlatformFillDisabled(platformId) {
    if (!window.ZiliuPluginConfig?.platforms) {
      return false;
    }

    const platform = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    return platform?.specialHandling?.disabled === true;
  }

  /**
   * 检查平台是否仅支持复制模式
   */
  isPlatformCopyOnly(platformId) {
    if (!window.ZiliuPluginConfig?.platforms) {
      return false;
    }

    const platform = window.ZiliuPluginConfig.platforms.find(p => p.id === platformId);
    return platform?.specialHandling?.copyOnly === true;
  }

  /**
   * 为兼容性提供的方法 - 检查URL是否包含特定域名
   * @deprecated 建议使用更精确的平台检测方法
   */
  urlContains(url, domain) {
    console.warn('⚠️ urlContains 方法已废弃，建议使用 isPlatformUrl');
    return url.includes(domain);
  }
}

// 创建全局实例
window.ZiliuPlatformDetector = new ZiliuPlatformDetector();

console.log('✅ 平台检测工具已加载');