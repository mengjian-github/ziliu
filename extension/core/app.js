/**
 * 字流助手核心应用
 * 负责整个应用的生命周期管理
 */
class ZiliuApp {
  constructor() {
    this.isInitialized = false;
    this.currentPlatform = null;
    this.state = new Map();
    this.config = null;

    // 预设相关状态
    this.presets = [];
    this.selectedPreset = null;
  }

  /**
   * 应用初始化
   */
  async init() {
    if (this.isInitialized) {
      console.log('⚠️ 字流助手已初始化');
      return;
    }

    console.log('🚀 字流助手开始初始化...');

    try {
      // 1. 加载配置
      await this.loadConfig();

      // 2. 初始化核心服务
      await this.initCoreServices();

      // 2.1. 初始化订阅服务
      await this.initSubscriptionService();

      // 3. 检测并加载当前平台插件
      await this.detectAndLoadPlatform();

      // 4. 初始化UI组件
      await this.initUI();

      // 5. 检查登录状态
      await this.checkAuth();

      // 6. 加载预设列表
      await this.loadPresets();

      this.isInitialized = true;
      console.log('✅ 字流助手初始化完成');

      ZiliuEventBus.emit('app:ready', {
        platform: this.currentPlatform?.id,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ 字流助手初始化失败:', error);
      ZiliuEventBus.emit('app:error', { error });
      throw error;
    }
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    console.log('📄 加载插件配置...');

    if (!window.ZiliuPluginConfig) {
      throw new Error('插件配置未找到');
    }

    this.config = window.ZiliuPluginConfig;
    console.log('✅ 插件配置加载完成');
  }

  /**
   * 初始化核心服务
   */
  async initCoreServices() {
    console.log('🔧 初始化核心服务...');

    // 确保所有核心服务都已加载
    const requiredServices = [
      'ZiliuEventBus',
      'ZiliuPlatformRegistry',
      'ZiliuPluginManager'
    ];

    for (const service of requiredServices) {
      if (!window[service]) {
        throw new Error(`核心服务未找到: ${service}`);
      }
    }

    console.log('✅ 核心服务初始化完成');
  }

  /**
   * 初始化订阅服务
   */
  async initSubscriptionService() {
    try {
      console.log('💎 初始化订阅服务...');

      // 确保订阅服务已加载
      if (!window.ZiliuSubscriptionService) {
        console.warn('⚠️ 订阅服务未找到，跳过初始化');
        return;
      }

      // 使用超时机制初始化订阅服务，防止阻塞应用启动
      await Promise.race([
        window.ZiliuSubscriptionService.init(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('订阅服务初始化超时')), 15000)
        )
      ]);

      console.log('✅ 订阅服务初始化完成');
    } catch (error) {
      console.error('❌ 订阅服务初始化失败:', error.message);
      console.log('🔄 订阅服务将在后台继续尝试初始化');

      // 后台异步重试，不阻塞应用启动
      setTimeout(async () => {
        try {
          if (window.ZiliuSubscriptionService) {
            console.log('🔄 后台重试订阅服务初始化...');
            await window.ZiliuSubscriptionService.init();
            console.log('✅ 后台订阅服务初始化成功');
          }
        } catch (retryError) {
          console.warn('⚠️ 后台订阅服务初始化也失败了，将使用默认配置');
        }
      }, 5000);
    }
  }

  /**
   * 检测并加载当前平台插件
   */
  async detectAndLoadPlatform() {
    try {
      const currentUrl = window.location.href;
      console.log('🔍 检测当前页面平台:', currentUrl);

      // 获取匹配的平台配置
      const matchedPlatforms = this.config.getPluginsForUrl(currentUrl);

      if (matchedPlatforms.length === 0) {
        console.log('⚠️ 当前页面不匹配任何平台，跳过平台初始化');
        return;
      }

      // 选择平台：默认按优先级；如存在“同 URL 多平台”的场景（例如：小红书图文/视频共用 URL），
      // 则优先尊重网站端传入并存储的 platform 选择（ziliu_content.platform）。
      let platformConfig = null;

      if (matchedPlatforms.length > 1) {
        try {
          const storedPlatformId = await new Promise((resolve) => {
            try {
              if (!chrome?.storage?.local?.get) return resolve(null);
              chrome.storage.local.get(['ziliu_content'], (result) => {
                resolve(result?.ziliu_content?.platform || null);
              });
            } catch (_e) {
              resolve(null);
            }
          });

          if (storedPlatformId) {
            const storedMatch = matchedPlatforms.find(p => p.id === storedPlatformId);
            const sharedGroup = storedMatch?.specialHandling?.sharedUrlGroup;

            if (storedMatch && sharedGroup) {
              const groupMatches = matchedPlatforms.filter(p => p.specialHandling?.sharedUrlGroup === sharedGroup);
              if (groupMatches.length > 1) {
                platformConfig = storedMatch;
                console.log('🎯 同URL多平台：使用网站端选择的平台匹配:', {
                  storedPlatformId,
                  sharedGroup,
                  matched: groupMatches.map(p => p.id)
                });
              }
            }
          }
        } catch (e) {
          console.warn('同URL多平台匹配失败，将回退到优先级规则:', e);
        }
      }

      // 回退：按优先级最高的平台
      if (!platformConfig) {
        console.log('🔍 所有匹配的平台:', matchedPlatforms.map(p => `${p.id}(${p.priority})`));
        platformConfig = matchedPlatforms.slice().sort((a, b) => b.priority - a.priority)[0];
      }
      console.log('🎯 匹配到平台:', platformConfig.displayName, `(ID: ${platformConfig.id})`);

      // 动态加载平台插件
      console.log('📦 开始加载平台插件...');
      await this.loadPlatformPlugin(platformConfig);
      this.currentPlatform = platformConfig;

      console.log('✅ 平台插件加载完成:', platformConfig.displayName);

      // 检查平台权限状态
      console.log('🔐 检查平台权限...');
      const hasAccess = await this.checkPlatformPermissions(platformConfig);

      // 如果没有权限，不加载预设和其他功能
      if (!hasAccess) {
        console.log('🔒 平台权限不足，跳过功能初始化');
        return;
      }

      // 重新加载对应平台的预设
      console.log('📋 重新加载平台预设...');
      await this.reloadPresetsForPlatform();
      console.log('✅ 平台预设加载完成');

    } catch (error) {
      console.error('❌ 平台插件加载失败:', error.message);
      // 平台加载失败不应该阻止应用启动，但要确保继续后续流程
      console.log('🔄 平台初始化失败，应用将以通用模式继续运行');
    }
  }

  /**
   * 动态加载平台插件
   */
  async loadPlatformPlugin(config) {
    const { id } = config;

    // 首先检查是否已经有专用插件注册
    const existingPlatform = ZiliuPlatformRegistry.get(id);
    if (existingPlatform) {
      console.log(`✅ 使用已注册的专用插件: ${config.displayName}`);
      const instance = ZiliuPlatformRegistry.getInstance(id);
      if (instance) {
        await instance.init();
      }
      return instance;
    }

    // 如果没有专用插件，创建通用的动态插件
    console.log(`📝 为 ${config.displayName} 创建通用插件`);
    const PlatformClass = this.createPlatformClass(config);

    // 创建实例并注册到平台注册中心
    const instance = new PlatformClass();
    ZiliuPlatformRegistry.register(instance);

    // 初始化实例
    if (instance && typeof instance.init === 'function') {
      await instance.init();
    }

    return instance;
  }

  /**
   * 根据配置创建平台插件类
   */
  createPlatformClass(config) {
    class DynamicPlatformPlugin extends BasePlatformPlugin {
      constructor() {
        super(config);
      }

      static get metadata() {
        return {
          id: config.id,
          displayName: config.displayName,
          urlPatterns: config.urlPatterns,
          version: '1.0.0'
        };
      }

      // 如果有特殊处理，可以在这里重写方法
      async fillContentEditor(contentElement, content, data) {
        if (config.specialHandling?.disabled) {
          throw new Error(`${config.displayName}平台填充功能已禁用`);
        }

        if (config.specialHandling?.copyOnly) {
          console.log(`${config.displayName}平台仅支持复制模式`);
          return { success: false, reason: 'copyOnly' };
        }

        return super.fillContentEditor(contentElement, content, data);
      }

      validateEditorElements(elements) {
        // 根据配置的features验证
        if (config.features.includes('title') && !elements.title) {
          return false;
        }
        if (config.features.includes('content') && !elements.content) {
          return false;
        }
        return true;
      }

      async _waitForEditor() {
        if (!config.specialHandling?.waitForEditor) {
          return this.findEditorElements();
        }

        const maxWaitTime = config.specialHandling.maxWaitTime || 10000;
        const startTime = Date.now();

        return new Promise((resolve) => {
          const checkEditor = () => {
            const elements = this.findEditorElements(false); // 不使用缓存

            if (elements.isEditor) {
              console.log(`✅ ${config.displayName}编辑器就绪`);
              resolve(elements);
              return;
            }

            if (Date.now() - startTime >= maxWaitTime) {
              console.warn(`⏰ ${config.displayName}编辑器等待超时`);
              resolve(elements); // 即使失败也返回结果
              return;
            }

            setTimeout(checkEditor, 500);
          };

          checkEditor();
        });
      }
    }

    return DynamicPlatformPlugin;
  }

  /**
   * 检查平台权限状态
   */
  async checkPlatformPermissions(platformConfig) {
    try {
      console.log('🔐 检查平台权限状态...');

      // 检查平台是否需要权限验证
      if (!platformConfig.requiredPlan) {
        console.log('✅ 当前平台无权限限制');
        return true;
      }

      // 使用平台管理器检查权限
      if (window.ZiliuPlatformManager) {
        const hasAccess = await window.ZiliuPlatformManager.showPlatformStatus(platformConfig.id);
        if (hasAccess) {
          console.log('✅ 平台权限验证通过');
        } else {
          console.log('🔒 平台权限验证失败，已显示升级提示');
        }
        return hasAccess;
      }

      return true;
    } catch (error) {
      console.error('❌ 检查平台权限失败:', error);
      return true; // 出错时不阻止功能使用
    }
  }

  /**
   * 初始化UI组件
   */
  async initUI() {
    console.log('🎨 初始化UI组件...');

    try {
      // 确保UI面板类存在
      if (window.ZiliuPanel) {
        window.ZiliuPanel.init();
        console.log('✅ UI面板已创建');
      } else {
        console.warn('⚠️ ZiliuPanel 未找到，跳过UI初始化');
      }

      // 初始化功能管理器
      if (window.ZiliuFeatures) {
        window.ZiliuFeatures.init();
        console.log('✅ 功能管理器已初始化');
      } else {
        console.warn('⚠️ ZiliuFeatures 未找到，跳过功能初始化');
      }

      ZiliuEventBus.emit('app:uiReady');
      console.log('✅ UI组件初始化完成');
    } catch (error) {
      console.error('❌ UI初始化失败:', error);
      ZiliuEventBus.emit('app:uiReady'); // 即使失败也发送事件
    }
  }

  /**
   * 检查认证状态
   */
  async checkAuth() {
    console.log('🔐 检查登录状态...');

    // 新架构暂时简化认证流程
    // 如果需要认证功能，可以通过事件系统集成
    console.log('✅ 认证检查完成（简化版）');

    ZiliuEventBus.emit('app:authReady');
  }

  /**
   * 加载预设列表 - 根据当前平台加载
   */
  async loadPresets() {
    console.log('📋 加载预设列表...');

    // 如果还没有检测到平台，先加载通用预设
    const platformId = this.currentPlatform?.id || 'all';

    try {
      // 使用新的ApiService获取预设
      const response = await ZiliuApiService.presets.list();

      if (response.success && Array.isArray(response.data)) {
        // 过滤出适用于当前平台的预设
        const platformPresets = response.data.filter(preset => {
          // 如果预设没有指定平台，或者指定为'all'，则适用于所有平台
          if (!preset.platform || preset.platform === 'all') return true;

          // 如果预设指定了具体平台，检查是否匹配当前平台
          if (Array.isArray(preset.platform)) {
            return preset.platform.includes(platformId);
          }

          return preset.platform === platformId;
        });

        this.presets = platformPresets;

        // 选择默认预设：优先选择当前平台的默认预设，然后是通用默认预设，最后是第一个
        this.selectedPreset = this.presets.find(p => p.isDefault && (p.platform === platformId || !p.platform)) ||
          this.presets.find(p => p.isDefault) ||
          this.presets[0] ||
          null;

        console.log(`✅ 预设加载完成: ${this.presets.length}个预设 (平台: ${platformId})`);
        console.log('🎯 选中默认预设:', this.selectedPreset?.name || '无');

        // 通知UI更新
        ZiliuEventBus.emit('presets:loaded', {
          presets: this.presets,
          selectedPreset: this.selectedPreset,
          platform: platformId
        });

      } else {
        console.warn('⚠️ 预设数据格式异常:', response);
        this.presets = [];
        this.selectedPreset = null;
      }

    } catch (error) {
      console.error('❌ 预设加载失败:', error);
      this.presets = [];
      this.selectedPreset = null;

      ZiliuEventBus.emit('presets:loaded', {
        presets: this.presets,
        selectedPreset: this.selectedPreset,
        platform: platformId
      });
    }
  }

  /**
   * 重新加载当前平台的预设
   */
  async reloadPresetsForPlatform() {
    if (this.currentPlatform) {
      console.log('🔄 为平台重新加载预设:', this.currentPlatform.id);
      await this.loadPresets();
    }
  }


  /**
   * 设置选中的预设
   */
  setSelectedPreset(presetId) {
    if (presetId === null || presetId === 'none') {
      // 不使用预设
      this.selectedPreset = null;
      console.log('🎯 切换为不使用预设');
      ZiliuEventBus.emit('presets:changed', { selectedPreset: null });
      return;
    }

    const preset = this.presets.find(p => p.id === presetId);
    if (preset) {
      this.selectedPreset = preset;
      console.log('🎯 切换预设:', preset.name);
      ZiliuEventBus.emit('presets:changed', { selectedPreset: preset });
    } else {
      console.warn('⚠️ 预设不存在:', presetId);
    }
  }

  /**
   * 获取当前选中的预设
   */
  getSelectedPreset() {
    return this.selectedPreset;
  }

  /**
   * 获取所有预设
   */
  getPresets() {
    return this.presets;
  }

  /**
   * 加载用户数据
   */
  async loadUserData() {
    console.log('📊 用户数据加载（新架构暂不实现）');
    ZiliuEventBus.emit('app:dataReady');
  }

  /**
   * 获取当前平台实例
   */
  getCurrentPlatform() {
    if (!this.currentPlatform) return null;
    return ZiliuPlatformRegistry.getInstance(this.currentPlatform.id);
  }

  /**
   * 状态管理
   */
  setState(key, value) {
    this.state.set(key, value);
    ZiliuEventBus.emit('state:change', { key, value });
  }

  getState(key) {
    return this.state.get(key);
  }

  /**
   * 应用销毁
   */
  async destroy() {
    console.log('🗑️ 销毁字流助手...');

    try {
      // 清理平台插件
      ZiliuPlatformRegistry.clear();

      // 清理状态
      this.state.clear();

      // 清理事件
      ZiliuEventBus.clear();

      this.isInitialized = false;
      console.log('✅ 字流助手已销毁');

    } catch (error) {
      console.error('销毁过程中出错:', error);
    }
  }

  /**
   * 处理外部消息
   */
  async handleMessage(message) {
    const { action, data } = message;

    switch (action) {
      case 'fillContent':
        return this.handleFillContent(data);
      case 'ping':
        return { success: true, message: 'pong' };
      default:
        console.warn('未知消息类型:', action);
        return { success: false, error: '未知消息类型' };
    }
  }

  /**
   * 处理填充内容请求
   */
  async handleFillContent(data) {
    try {
      const platform = this.getCurrentPlatform();
      if (!platform) {
        throw new Error('当前页面不支持内容填充');
      }

      // 使用内容处理服务处理数据
      const contentService = window.ZiliuContentService;
      const fillData = contentService
        ? await contentService.processContentData(data, this.currentPlatform, this.getSelectedPreset())
        : data;

      console.log('📝 开始填充内容到编辑器');
      console.log('🔍 当前平台:', this.currentPlatform?.displayName);

      const result = await platform.fillContent(fillData);

      console.log('✅ 内容填充成功');
      return { success: true, result };

    } catch (error) {
      console.error('❌ 内容填充失败:', error);
      return { success: false, error: error.message };
    }
  }

}

// 全局应用实例
window.ZiliuApp = new ZiliuApp();
