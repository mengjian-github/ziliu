/**
 * 字流插件统一配置常量
 */
class ZiliuConstants {
  // 环境配置 - 生产环境
  static get DEFAULT_API_BASE_URL() {
    return 'https://ziliu.online';
  }
  
  static get DEFAULT_SITE_URL() {
    return 'https://ziliu.online';
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
    return this.PLUGIN.VERSION;
  }
  
  // 允许的域名列表
  static get ALLOWED_ORIGINS() {
    return [
      'www.ziliu.online',
      'ziliu.online'      // 生产环境
    ];
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