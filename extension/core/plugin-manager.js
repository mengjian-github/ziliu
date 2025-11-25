/**
 * 插件管理器 - 负责插件的生命周期管理
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.loadQueue = [];
    this.isLoading = false;
  }

  /**
   * 注册插件
   */
  register(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('插件必须有唯一ID');
    }

    if (this.plugins.has(plugin.id)) {
      console.warn(`插件 ${plugin.id} 已存在，将被覆盖`);
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      status: 'registered',
      instance: null
    });

    console.log(`📦 插件已注册: ${plugin.name || plugin.id}`);
    ZiliuEventBus.emit('plugin:registered', plugin);
  }

  /**
   * 批量加载插件
   */
  async loadPlugins(pluginConfigs) {
    if (this.isLoading) {
      console.warn('插件正在加载中...');
      return;
    }

    this.isLoading = true;
    console.log('🔄 开始加载插件...');

    try {
      const loadPromises = pluginConfigs.map(config => this.loadPlugin(config));
      const results = await Promise.allSettled(loadPromises);
      
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          console.error(`插件加载失败 [${pluginConfigs[index].id}]:`, result.reason);
        }
      });

      console.log(`✅ 插件加载完成: 成功 ${successCount}, 失败 ${failureCount}`);
      ZiliuEventBus.emit('plugins:loaded', { successCount, failureCount });

    } catch (error) {
      console.error('批量加载插件失败:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 加载单个插件
   */
  async loadPlugin(config) {
    const { id, type, enabled = true } = config;

    if (!enabled) {
      console.log(`⏭️ 插件已禁用: ${id}`);
      return;
    }

    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`未找到插件: ${id}`);
    }

    if (plugin.status === 'loaded') {
      console.log(`⚠️ 插件已加载: ${id}`);
      return plugin.instance;
    }

    console.log(`🔄 正在加载插件: ${plugin.name || id}`);

    try {
      // 创建插件实例
      if (typeof plugin.factory === 'function') {
        plugin.instance = plugin.factory(config);
      } else if (typeof plugin.class === 'function') {
        plugin.instance = new plugin.class(config);
      } else {
        plugin.instance = plugin;
      }

      // 执行插件初始化
      if (plugin.instance && typeof plugin.instance.init === 'function') {
        await plugin.instance.init();
      }

      plugin.status = 'loaded';
      console.log(`✅ 插件加载成功: ${plugin.name || id}`);
      ZiliuEventBus.emit('plugin:loaded', { id, instance: plugin.instance });

      return plugin.instance;

    } catch (error) {
      plugin.status = 'error';
      console.error(`❌ 插件加载失败 [${id}]:`, error);
      ZiliuEventBus.emit('plugin:error', { id, error });
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.warn(`插件不存在: ${id}`);
      return false;
    }

    try {
      // 执行插件清理
      if (plugin.instance && typeof plugin.instance.destroy === 'function') {
        await plugin.instance.destroy();
      }

      plugin.status = 'unloaded';
      plugin.instance = null;

      console.log(`🗑️ 插件已卸载: ${plugin.name || id}`);
      ZiliuEventBus.emit('plugin:unloaded', { id });

      return true;
    } catch (error) {
      console.error(`卸载插件失败 [${id}]:`, error);
      return false;
    }
  }

  /**
   * 获取插件实例
   */
  getPlugin(id) {
    const plugin = this.plugins.get(id);
    return plugin?.instance || null;
  }

  /**
   * 获取已加载的插件列表
   */
  getLoadedPlugins() {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.status === 'loaded')
      .map(plugin => ({ id: plugin.id, name: plugin.name, instance: plugin.instance }));
  }

  /**
   * 检查插件是否已加载
   */
  isLoaded(id) {
    const plugin = this.plugins.get(id);
    return plugin?.status === 'loaded';
  }

  /**
   * 重载插件
   */
  async reloadPlugin(id, config) {
    await this.unloadPlugin(id);
    return this.loadPlugin(config);
  }

  /**
   * 清空所有插件
   */
  async clear() {
    const loadedPlugins = Array.from(this.plugins.keys());
    
    for (const id of loadedPlugins) {
      await this.unloadPlugin(id);
    }
    
    this.plugins.clear();
    console.log('🧹 所有插件已清理');
  }
}

// 全局插件管理器实例
window.ZiliuPluginManager = new PluginManager();