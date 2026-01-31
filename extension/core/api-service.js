/**
 * 新架构 - API服务
 * 替代旧的ZiliuAPI，提供统一的API调用服务
 */
class ApiService {
  constructor() {
    this.config = {
      baseURL: '',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true,
      cacheExpiration: 5 * 60 * 1000 // 5分钟
    };
    this.cache = new Map();
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * 清理缓存（用于处理“预设/文章更新但仍读取到旧数据”的场景）
   */
  clearCache(prefix = null) {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  /**
   * 初始化API服务
   */
  async init() {
    try {
      console.log('🔧 API服务开始初始化');
      console.log('🔧 ZiliuConstants.DEFAULT_API_BASE_URL:', window.ZiliuConstants?.DEFAULT_API_BASE_URL);
      const result = await chrome.storage.sync.get(['apiBaseUrl']);
      console.log('🔧 存储中的apiBaseUrl:', result.apiBaseUrl);
      // 优先使用存储中的值，其次默认常量，最后兜底线上
      this.config.baseURL = result.apiBaseUrl || window.ZiliuConstants?.DEFAULT_API_BASE_URL || 'https://www.ziliu.online';
      console.log('✅ API服务初始化完成，最终基础URL:', this.config.baseURL);
    } catch (error) {
      console.error('❌ API服务初始化失败:', error);
      this.config.baseURL = window.ZiliuConstants?.DEFAULT_API_BASE_URL || 'https://www.ziliu.online';
      console.log('🔧 使用fallback URL:', this.config.baseURL);
    }
  }

  /**
   * 通用API请求方法
   */
  async makeRequest(endpoint, options = {}) {
    const timeout = options.timeout || this.config.timeout;

    return Promise.race([
      new Promise((resolve, reject) => {
        // 检查extension context是否有效
        if (!chrome.runtime?.id) {
          reject(new Error('Extension context invalidated. Please refresh the page.'));
          return;
        }

        console.log(`🔗 发起API请求: ${endpoint}`, options);
        console.log(`🔗 当前API服务baseURL:`, this.config.baseURL);
        console.log(`📨 发送消息给background script`);

        chrome.runtime.sendMessage({
          action: 'apiRequest',
          data: {
            endpoint,
            ...options
          }
        }, (response) => {
          console.log(`📨 收到background script响应:`, response);
          if (chrome.runtime.lastError) {
            console.error(`❌ API请求失败 ${endpoint}:`, chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.success) {
            console.log(`✅ API请求成功 ${endpoint}`);
            resolve(response);
          } else {
            const error = response?.error || '请求失败';
            console.error(`❌ API响应错误 ${endpoint}:`, error);
            reject(new Error(error));
          }
        });
      }),

      // 超时处理
      new Promise((_, reject) =>
        setTimeout(() => {
          console.error(`⏰ API请求超时 ${endpoint} (${timeout}ms)`);
          reject(new Error(`API请求超时: ${endpoint}`));
        }, timeout)
      )
    ]);
  }

  /**
   * 带缓存的请求
   */
  async cachedRequest(endpoint, options = {}) {
    if (!this.config.enableCache) {
      return this.makeRequest(endpoint, options);
    }

    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiration) {
      return cached.data;
    }

    const response = await this.makeRequest(endpoint, options);

    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * 文章相关API
   */
  get articles() {
    return {
      list: async (options = {}) => {
        const params = new URLSearchParams(options).toString();
        return this.cachedRequest(`/api/articles?${params}`);
      },

      get: async (id, format = 'inline', style) => {
        let finalStyle = style;
        try {
          if (!finalStyle && format === 'inline') {
            const result = await chrome.storage.local.get(['ziliu_content']);
            const stored = result?.ziliu_content;
            if (stored?.style) {
              finalStyle = stored.style;
            }
          }
        } catch (e) {
          console.warn('读取存储的发布样式失败，使用默认样式', e);
        }

        const styleQuery = format === 'inline' && finalStyle ? `&style=${encodeURIComponent(finalStyle)}` : '';
        return this.cachedRequest(`/api/articles/${id}?format=${format}${styleQuery}`);
      },

      create: async (articleData) => {
        return this.makeRequest('/api/articles', {
          method: 'POST',
          body: articleData
        });
      },

      update: async (id, articleData) => {
        return this.makeRequest(`/api/articles/${id}`, {
          method: 'PUT',
          body: articleData
        });
      },

      delete: async (id) => {
        return this.makeRequest(`/api/articles/${id}`, {
          method: 'DELETE'
        });
      },

      search: async (query, options = {}) => {
        return this.search(query, { type: 'articles', ...options });
      }
    };
  }

  /**
   * 预设相关API
   */
  get presets() {
    return {
      list: async () => {
        return this.cachedRequest('/api/presets');
      },

      get: async (id) => {
        return this.cachedRequest(`/api/presets/${id}`);
      },

      create: async (presetData) => {
        return this.makeRequest('/api/presets', {
          method: 'POST',
          body: presetData
        });
      },

      update: async (id, presetData) => {
        return this.makeRequest(`/api/presets/${id}`, {
          method: 'PUT',
          body: presetData
        });
      },

      delete: async (id) => {
        return this.makeRequest(`/api/presets/${id}`, {
          method: 'DELETE'
        });
      }
    };
  }

  /**
   * 用户相关API
   */
  get user() {
    return {
      profile: async () => {
        return this.cachedRequest('/api/user/profile');
      },

      stats: async () => {
        return this.cachedRequest('/api/user/stats');
      },

      updateSettings: async (settings) => {
        return this.makeRequest('/api/user/settings', {
          method: 'PUT',
          body: settings
        });
      },

      plan: async () => {
        return this.cachedRequest('/api/auth/user-plan');
      }
    };
  }

  /**
   * 订阅相关API
   */
  get subscription() {
    return {
      getUserPlan: async () => {
        return this.cachedRequest('/api/auth/user-plan');
      },

      getUsage: async () => {
        return this.cachedRequest('/api/usage/images');
      },

      checkFeatureAccess: async (featureId) => {
        return this.makeRequest('/api/subscription/check-feature', {
          method: 'POST',
          body: { featureId }
        });
      }
    };
  }

  /**
   * 内容处理API
   */
  get content() {
    return {
      convert: async (content, platform, style = 'default', mode = 'day') => {
        return this.makeRequest('/api/convert', {
          method: 'POST',
          body: { content, platform, style, mode }
        });
      },

      optimize: async (content, options = {}) => {
        return this.makeRequest('/api/content/optimize', {
          method: 'POST',
          body: { content, ...options }
        });
      },

      analyze: async (content) => {
        return this.makeRequest('/api/content/analyze', {
          method: 'POST',
          body: { content }
        });
      }
    };
  }

  /**
   * 搜索功能
   */
  async search(query, options = {}) {
    return this.makeRequest('/api/search', {
      method: 'POST',
      body: { query, ...options }
    });
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      const response = await this.makeRequest('/api/auth/check');
      return response.success && response.data?.isLoggedIn;
    } catch (error) {
      console.warn('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 API缓存已清理');
  }

  /**
   * 设置基础URL
   */
  async setBaseURL(url) {
    this.config.baseURL = url;
    try {
      await chrome.storage.sync.set({ apiBaseUrl: url });
      console.log('✅ API基础URL已更新:', url);
    } catch (error) {
      console.error('❌ 保存API基础URL失败:', error);
    }
  }
}

// 创建全局实例
window.ZiliuApiService = new ApiService();

console.log('✅ 字流API服务已加载');
