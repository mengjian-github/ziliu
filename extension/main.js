/**
 * 字流助手 - 新架构主入口文件
 * 基于插件化的可扩展架构
 */
(function() {
  'use strict';

  console.log('🚀 字流助手启动 - 新架构版本');

  // 尝试从当前站点发现运行时配置（优先本地/当前域），用于覆盖 API Base URL
  (async function bootstrapRuntimeConfig() {
    try {
      // 插件在第三方站点运行，无法从当前 origin 获取配置
      // 采用候选地址探测：优先本地，再回退线上
      const candidates = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://www.ziliu.online'
      ];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);

      for (const base of candidates) {
        try {
          const res = await fetch(base + '/api/config', { signal: controller.signal, credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            const baseUrl = data?.data?.apiBaseUrl || data?.data?.appUrl || base;
            if (baseUrl && chrome.runtime?.id) {
              chrome.runtime.sendMessage({ action: 'setBaseURL', data: { baseUrl } }, () => {});
              console.log('🔧 已设置 API Base URL:', baseUrl);
              clearTimeout(timeout);
              break;
            }
          }
        } catch (_) {
          // 尝试下一个候选
          continue;
        }
      }
    } catch (e) {
      console.warn('⚠️ 运行时配置发现失败，使用默认配置', e);
    }
  })();

  // 监听来自网页的消息
  window.addEventListener('message', (event) => {
    // 调试：记录所有收到的消息
    if (event.data?.type?.startsWith('ZILIU_')) {
      console.log('📡 收到字流消息:', event.data.type, 'from:', event.origin);
    }
    
    // 只处理来自同源或字流网站的消息
    // 使用统一配置检查允许的域名
    const isAllowedOrigin = event.origin === window.location.origin || 
                          window.ZiliuConstants?.isAllowedOrigin?.(event.origin) ||
                          event.origin.includes('ziliu.online') ||
                          event.origin.includes('www.ziliu.online') ||
                          event.origin.includes('www.ziliu.online') ||
                          event.origin.includes('127.0.0.1:3000') ||
                          event.origin.includes('localhost');
    
    if (!isAllowedOrigin) {
      console.log('🚫 拒绝来自未授权域名的消息:', event.origin);
      return;
    }

    const { type, data, requestId, source } = event.data;

    switch (type) {
      case 'ZILIU_EXTENSION_DETECT':
        console.log('📡 收到网页插件检测请求:', event.data);
        // 响应插件检测
        const response = {
          type: 'ZILIU_EXTENSION_RESPONSE',
          version: window.ZiliuConstants.VERSION,
          installed: true,
          source: 'ziliu-extension'
        };
        console.log('📤 发送插件检测响应:', response);
        window.postMessage(response, '*');
        break;

      case 'ZILIU_PUBLISH_REQUEST':
        console.log('🚀 收到发布请求:', data);
        handlePublishRequest(data, requestId);
        break;
    }
  });

  // 处理发布请求
  function handlePublishRequest(data, requestId) {
    try {
      const { title, content, platform } = data;
      
      // 调用现有的发布逻辑
      if (window.ZiliuApp && window.ZiliuApp.handleOneClickPublish) {
        window.ZiliuApp.handleOneClickPublish({
          title,
          content,
          platform
        }).then(result => {
          // 发送成功响应
          window.postMessage({
            type: 'ZILIU_PUBLISH_RESPONSE',
            requestId,
            success: true,
            result
          }, '*');
        }).catch(error => {
          // 发送失败响应
          window.postMessage({
            type: 'ZILIU_PUBLISH_RESPONSE',
            requestId,
            success: false,
            error: error.message
          }, '*');
        });
      } else {
        throw new Error('字流应用尚未初始化完成');
      }
    } catch (error) {
      console.error('❌ 处理发布请求失败:', error);
      window.postMessage({
        type: 'ZILIU_PUBLISH_RESPONSE',
        requestId,
        success: false,
        error: error.message
      }, '*');
    }
  }

  /**
   * 模块加载器 - 负责按正确顺序加载所有必需模块
   */
  const ModuleLoader = {
    // 核心模块列表（按依赖顺序）
    coreModules: [
      'ZiliuEventBus',           // 事件总线
      'ZiliuConfigService',      // 配置服务
      'ZiliuApiService',         // API服务
      'ZiliuUtilsService',       // 工具服务
      'ZiliuContentService',     // 内容处理服务
      'ZiliuPluginConfig',       // 插件配置
      'ZiliuPlatformDetector',   // 平台检测工具
      'ZiliuPlatformManager',    // 平台管理服务
      'ZiliuPlatformRegistry',   // 平台注册中心
      'ZiliuPluginManager',      // 插件管理器
      'BasePlatformPlugin',      // 基础平台插件类
      'ZiliuApp'                 // 核心应用
    ],

    // 已移除旧系统模块，新架构不再需要

    loadedModules: new Set(),

    /**
     * 检查模块是否已加载
     */
    isModuleLoaded(moduleName) {
      const isLoaded = typeof window[moduleName] !== 'undefined';
      if (isLoaded) {
        this.loadedModules.add(moduleName);
      }
      return isLoaded;
    },

    /**
     * 等待核心模块加载完成
     */
    async waitForCoreModules(maxWaitTime = 10000) {
      console.log('⏳ 等待核心模块加载...');
      const startTime = Date.now();
      
      return new Promise((resolve, reject) => {
        const checkModules = () => {
          const missingModules = this.coreModules.filter(module => 
            !this.isModuleLoaded(module)
          );

          if (missingModules.length === 0) {
            console.log('✅ 核心模块加载完成');
            resolve();
            return;
          }

          if (Date.now() - startTime >= maxWaitTime) {
            console.warn('⏰ 核心模块加载超时，缺失:', missingModules);
            // 不完全拒绝，尝试继续运行
            resolve();
            return;
          }

          setTimeout(checkModules, 100);
        };

        checkModules();
      });
    },


    /**
     * 初始化核心服务
     */
    async initServices() {
      console.log('🔧 初始化核心服务...');
      
      // 初始化配置服务
      if (window.ZiliuConfigService) {
        await window.ZiliuConfigService.init();
      }
      
      // 初始化API服务
      if (window.ZiliuApiService) {
        await window.ZiliuApiService.init();
      }
      
      // 初始化工具服务
      if (window.ZiliuUtilsService) {
        window.ZiliuUtilsService.init();
      }
      
      console.log('✅ 核心服务初始化完成');
    }
  };

  /**
   * 应用初始化管理器
   */
  const AppInitializer = {
    initialized: false,

    /**
     * 主初始化流程
     */
    async initialize() {
      if (this.initialized) {
        console.log('⚠️ 应用已初始化');
        return;
      }

      try {
        console.log('🎯 开始初始化字流助手...');

        // 1. 等待核心模块
        await ModuleLoader.waitForCoreModules();

        // 2. 初始化核心服务
        await ModuleLoader.initServices();

        // 3. 初始化应用
        if (window.ZiliuApp) {
          await window.ZiliuApp.init();
          this.initialized = true;
          console.log('✅ 新架构初始化完成');
        } else {
          throw new Error('ZiliuApp核心模块未找到');
        }

        // 4. 设置消息监听器
        this.setupMessageHandlers();

        console.log('🎉 字流助手初始化完成');

      } catch (error) {
        console.error('❌ 初始化失败:', error);
        throw error;
      }
    },


    /**
     * 设置消息处理器
     */
    setupMessageHandlers() {
      // Chrome消息监听器
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
          console.log('📨 收到外部消息:', request.action);
          
          try {
            let result;
            
            if (window.ZiliuApp && window.ZiliuApp.isInitialized) {
              // 使用新系统处理
              result = await window.ZiliuApp.handleMessage(request);
            } else {
              result = { success: false, error: '系统未就绪' };
            }
            
            sendResponse(result);
          } catch (error) {
            console.error('消息处理失败:', error);
            sendResponse({ success: false, error: error.message });
          }
        });
      }

      // 配置更新监听器
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.action === 'configUpdated') {
            console.log('字流助手: 配置已更新', message.config);
            if (window.ZiliuConfigService && message.config.apiBaseUrl) {
              window.ZiliuConfigService.setApiBaseUrl(message.config.apiBaseUrl);
            }
          }
        });
      }
    },

  };

  /**
   * 页面准备检查器
   */
  const PageReadyChecker = {
    /**
     * 等待页面准备就绪
     */
    waitForPageReady() {
      return new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
    },

    /**
     * 延迟初始化（给页面时间加载动态内容）
     */
    async delayedInitialize() {
      await this.waitForPageReady();
      
      // 额外延迟以确保动态内容加载
      const delay = this.getInitDelay();
      if (delay > 0) {
        console.log(`⏱️ 延迟 ${delay}ms 等待页面完全加载`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return AppInitializer.initialize();
    },

    /**
     * 获取初始化延迟时间（基于平台配置）
     */
    getInitDelay() {
      const url = window.location.href;
      
      // 使用平台配置中的延迟设置
      if (window.ZiliuPluginConfig) {
        const matchedPlatforms = window.ZiliuPluginConfig.getPluginsForUrl(url);
        if (matchedPlatforms.length > 0) {
          const platform = matchedPlatforms[0];
          return platform.specialHandling?.initDelay || platform.loadDelay || 1000;
        }
      }
      
      return 1000; // 默认延迟
    }
  };

  // 新架构通过服务模块自动初始化，无需手动调用

  // 启动应用
  PageReadyChecker.delayedInitialize().then(() => {
    // 检查是否有需要延迟重试的平台
    const url = window.location.href;
    if (window.ZiliuPluginConfig) {
      const matchedPlatforms = window.ZiliuPluginConfig.getPluginsForUrl(url);
      const platform = matchedPlatforms.find(p => p.specialHandling?.retryOnFail);
      
      if (platform) {
        const retryDelay = platform.specialHandling.retryDelay || 3000;
        setTimeout(async () => {
          console.log(`🔄 ${platform.displayName}平台延迟重试...`);
          
          // 检查是否需要重新初始化
          if (window.ZiliuApp && window.ZiliuApp.currentPlatform === null) {
            try {
              await window.ZiliuApp.detectAndLoadPlatform();
              console.log(`✅ ${platform.displayName}平台延迟初始化成功`);
            } catch (error) {
              console.warn(`${platform.displayName}平台延迟初始化失败:`, error);
            }
          }
        }, retryDelay);
      }
    }
  }).catch(error => {
    console.error('❌ 应用启动失败:', error);
  });

  // 导出到全局作用域（用于调试）
  if (typeof window !== 'undefined') {
    window.ZiliuModuleLoader = ModuleLoader;
    window.ZiliuAppInitializer = AppInitializer;
    window.ZiliuPageReadyChecker = PageReadyChecker;
  }

  console.log('✅ 字流助手主控制器已加载 - 新架构版本');
})();
