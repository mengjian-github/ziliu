/**
 * 网站端插件检测脚本
 * 专门用于在www.ziliu.online网站上响应插件检测请求
 */
(function() {
  'use strict';

  console.log('🌐 字流网站端检测脚本加载');

  // 监听来自网页的插件检测消息
  window.addEventListener('message', (event) => {
    // 处理来自同源的消息，或者localhost的消息
    const isAllowedOrigin = event.origin === window.location.origin ||
                          event.origin.includes('localhost') ||
                          event.origin.includes('127.0.0.1') ||
                          event.origin.includes('ziliu.online');
    
    if (!isAllowedOrigin) {
      return;
    }

    const { type, data } = event.data;

    if (type === 'ZILIU_EXTENSION_DETECT') {
      console.log('📡 网站端收到插件检测请求:', event.data);
      
      // 响应插件检测
      const response = {
        type: 'ZILIU_EXTENSION_RESPONSE',
        version: window.ZiliuConstants.VERSION,
        installed: true,
        source: 'ziliu-extension',
        timestamp: Date.now()
      };
      
      console.log('📤 网站端发送插件检测响应:', response);
      window.postMessage(response, event.origin);
    }
  });

  // 主动告知网站插件已就绪
  setTimeout(() => {
    window.postMessage({
      type: 'ZILIU_EXTENSION_READY',
      version: window.ZiliuConstants.VERSION,
      installed: true,
      source: 'ziliu-extension'
    }, window.location.origin);
    console.log('📢 网站端主动发送插件就绪信号');
  }, 100);

})();