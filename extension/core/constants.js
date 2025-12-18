/**
 * 字流插件统一配置常量
 */
class ZiliuConstants {
  // 构建环境（由构建脚本替换；未替换时走默认生产配置）
  static get BUILD_ENV() {
    const value = '__ZILIU_BUILD_ENV__';
    return value.startsWith('__ZILIU_') ? 'production' : value;
  }

  // 环境配置 - 生产环境（由构建脚本替换）
  static get DEFAULT_API_BASE_URL() {
    const value = '__ZILIU_API_BASE_URL__';
    return value.startsWith('__ZILIU_') ? 'https://ziliu.online' : value;
  }
  
  static get DEFAULT_SITE_URL() {
    const value = '__ZILIU_SITE_URL__';
    return value.startsWith('__ZILIU_') ? 'https://ziliu.online' : value;
  }
  
  // API端点
  static get ENDPOINTS() {
    return {
      LOGIN: '/login',
      PRICING: '/pricing',
      API_AUTH_CHECK: '/api/auth/check',
      API_USER_PLAN: '/api/auth/user-plan'
    };
  }
  
  // 完整URL生成器
  static getFullUrl(endpoint, baseUrl = null) {
    const base = baseUrl || this.DEFAULT_API_BASE_URL;
    return `${base}${endpoint}`;
  }
  
  // 常用完整URL
  static get URLS() {
    return {
      LOGIN: this.getFullUrl(this.ENDPOINTS.LOGIN),
      PRICING: this.getFullUrl(this.ENDPOINTS.PRICING)
    };
  }
  
  // 插件配置
  static get PLUGIN() {
    return {
      VERSION: '1.2.0',
      PANEL_ID: 'ziliu-assistant-panel'
    };
  }
  
  // 获取当前插件版本（统一版本管理）
  static get VERSION() {
    try {
      const v = chrome?.runtime?.getManifest?.().version;
      return v || this.PLUGIN.VERSION;
    } catch (_) {
      return this.PLUGIN.VERSION;
    }
  }
  
  // 允许的域名列表
  static get ALLOWED_ORIGINS() {
    const origins = ['www.ziliu.online', 'ziliu.online'];
    if (this.BUILD_ENV !== 'production') {
      origins.push('localhost', '127.0.0.1');
    }
    return origins;
  }
  
  // 检查域名是否允许
  static isAllowedOrigin(origin) {
    return this.ALLOWED_ORIGINS.some(allowed => origin.includes(allowed));
  }
}

// 导出为全局变量（兼容service worker和content script）
if (typeof window !== 'undefined') {
  window.ZiliuConstants = ZiliuConstants;
} else if (typeof self !== 'undefined') {
  self.ZiliuConstants = ZiliuConstants;
} else if (typeof global !== 'undefined') {
  global.ZiliuConstants = ZiliuConstants;
}

console.log('✅ 字流配置常量已加载');
console.log('🔧 当前DEFAULT_API_BASE_URL:', ZiliuConstants.DEFAULT_API_BASE_URL);
console.log('🏷️ 当前BUILD_ENV:', ZiliuConstants.BUILD_ENV);
