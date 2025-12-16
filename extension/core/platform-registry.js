/**
 * 平台注册中心 - 管理所有平台插件的注册和发现
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
    this.urlPatterns = new Map(); // URL模式映射
  }

  /**
   * 注册平台插件（配置驱动）
   */
  register(platformInstance) {
    if (!platformInstance || typeof platformInstance !== 'object' || !platformInstance.id) {
      throw new Error('必须提供配置驱动的平台实例');
    }

    const id = platformInstance.id;
    const urlPatterns = platformInstance.urlPatterns || [];

    if (this.platforms.has(id)) {
      console.warn(`平台 ${id} 已存在，将被覆盖`);
    }

    // 注册平台实例
    this.platforms.set(id, platformInstance);

    // 注册URL模式
    urlPatterns.forEach(pattern => {
      if (!this.urlPatterns.has(pattern)) {
        this.urlPatterns.set(pattern, []);
      }
      this.urlPatterns.get(pattern).push(id);
    });

    console.log(`✅ 平台插件已注册: ${platformInstance.displayName || id}`);
    ZiliuEventBus.emit('platform:registered', { id, instance: platformInstance });
  }

  /**
   * 根据URL检测匹配的平台
   */
  detectPlatforms(url) {
    const matches = [];
    
    for (const [pattern, platformIds] of this.urlPatterns) {
      if (this.matchUrl(url, pattern)) {
        platformIds.forEach(id => {
          if (!matches.includes(id)) {
            matches.push(id);
          }
        });
      }
    }

    return matches.map(id => this.get(id)).filter(Boolean);
  }

  /**
   * URL模式匹配
   */
  matchUrl(url, pattern) {
    try {
      // 转换通配符为正则表达式
      const escapedPattern = pattern
        .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
        .replace(/\*/g, '.*');
      
      const regex = new RegExp('^' + escapedPattern + '$', 'i');
      return regex.test(url);
    } catch (error) {
      console.warn('URL模式匹配失败:', { pattern, error });
      return false;
    }
  }

  /**
   * 获取平台信息
   */
  get(id) {
    return this.platforms.get(id);
  }

  /**
   * 获取平台实例
   */
  getInstance(id) {
    return this.get(id); // 直接返回实例，因为注册时就是实例
  }

  /**
   * 获取所有已注册的平台
   */
  getAll() {
    return Array.from(this.platforms.values());
  }

  /**
   * 卸载平台
   */
  unregister(id) {
    const platform = this.platforms.get(id);
    if (!platform) return false;

    // 清理URL模式映射
    for (const [pattern, platformIds] of this.urlPatterns) {
      const index = platformIds.indexOf(id);
      if (index > -1) {
        platformIds.splice(index, 1);
        if (platformIds.length === 0) {
          this.urlPatterns.delete(pattern);
        }
      }
    }

    // 销毁实例
    if (platform.instance && typeof platform.instance.destroy === 'function') {
      try {
        platform.instance.destroy();
      } catch (error) {
        console.warn(`销毁平台实例失败 [${id}]:`, error);
      }
    }

    this.platforms.delete(id);
    ZiliuEventBus.emit('platform:unregistered', { id });
    
    console.log(`🗑️ 平台插件已卸载: ${id}`);
    return true;
  }

  /**
   * 清空所有平台
   */
  clear() {
    const ids = Array.from(this.platforms.keys());
    ids.forEach(id => this.unregister(id));
  }
}

// 全局平台注册中心实例
window.ZiliuPlatformRegistry = new PlatformRegistry();