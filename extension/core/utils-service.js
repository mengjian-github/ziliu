/**
 * 新架构 - 工具服务
 * 替代旧的ZiliuUtils，提供统一的工具函数服务
 */
class UtilsService {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化工具服务
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('✅ 工具服务初始化完成');
  }

  /**
   * 延迟执行
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 安全的元素查找
   */
  findElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * 防抖函数
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  /**
   * 节流函数
   */
  throttle(func, wait) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `ziliu-notification ziliu-notification--${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease-out;
    `;

    // 根据类型设置背景色
    const colors = {
      success: '#52c41a',
      error: '#ff4d4f',
      warning: '#faad14',
      info: '#1890ff'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    notification.textContent = message;
    document.body.appendChild(notification);

    // 添加动画样式
    if (!document.querySelector('#ziliu-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'ziliu-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // 自动移除
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * 显示加载遮罩
   */
  showLoadingOverlay(element) {
    const overlay = document.createElement('div');
    overlay.className = 'ziliu-loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1890ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // 添加旋转动画
    if (!document.querySelector('#ziliu-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'ziliu-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    overlay.appendChild(spinner);
    
    // 确保父元素有相对定位
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }
    
    element.appendChild(overlay);
    return overlay;
  }

  /**
   * 隐藏加载遮罩
   */
  hideLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  /**
   * 模拟用户输入
   */
  simulateInput(element, value) {
    if (!element) return false;

    // 聚焦元素
    element.focus();

    // 清空现有内容
    element.value = '';

    // 创建并触发input事件
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });

    // 设置值并触发事件
    element.value = value;
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);

    return true;
  }

  /**
   * 设置富文本内容
   */
  async setRichTextContent(editor, content) {
    if (!editor) throw new Error('编辑器元素不存在');

    try {
      // 清空现有内容
      editor.innerHTML = '';
      
      // 设置新内容
      editor.innerHTML = content;
      
      // 触发变化事件
      const event = new Event('input', { bubbles: true });
      editor.dispatchEvent(event);
      
      // 等待内容渲染
      await this.delay(100);
      
      return true;
    } catch (error) {
      console.error('设置富文本内容失败:', error);
      throw error;
    }
  }

  /**
   * 预处理图片（转换外部图片链接）
   */
  async preProcessImages(htmlContent) {
    if (!htmlContent) return htmlContent;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const images = tempDiv.querySelectorAll('img');
    
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && this.isExternalImage(src)) {
        try {
          // 这里可以调用图片转换服务
          console.log('处理外部图片:', src);
          // 实际实现中可以调用CDN上传服务
        } catch (error) {
          console.warn('处理图片失败:', src, error);
        }
      }
    }
    
    return tempDiv.innerHTML;
  }

  /**
   * 检查是否为外部图片
   */
  isExternalImage(src) {
    if (!src) return false;
    return src.startsWith('http') && 
           !this.isPlatformCdnUrl(src);
  }

  /**
   * 检查是否为平台CDN URL
   */
  isPlatformCdnUrl(src) {
    if (!src) return false;
    
    // 微信公众号相关CDN
    if (src.includes('mp.weixin.qq.com') || src.includes('mmbiz.qpic.cn')) {
      return true;
    }
    
    // 其他平台的CDN可以在这里添加
    return false;
  }

  /**
   * 清理HTML内容
   */
  cleanHtmlContent(content) {
    if (!content) return '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // 移除危险脚本
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // 清理样式属性中的危险内容
    const elementsWithStyle = tempDiv.querySelectorAll('[style]');
    elementsWithStyle.forEach(el => {
      const style = el.getAttribute('style');
      if (style && (style.includes('javascript:') || style.includes('expression('))) {
        el.removeAttribute('style');
      }
    });

    return tempDiv.innerHTML;
  }

  /**
   * 触发微信编辑器自动保存
   */
  triggerWeChatAutoSave(element) {
    if (!element) return;

    try {
      // 触发微信编辑器的自动保存机制
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      
      // 模拟键盘事件
      const keyEvent = new KeyboardEvent('keyup', { bubbles: true });
      element.dispatchEvent(keyEvent);
    } catch (error) {
      console.warn('触发自动保存失败:', error);
    }
  }

  /**
   * 格式化日期
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 生成唯一ID
   */
  generateId(prefix = 'ziliu') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查是否为微信编辑器页面
   */
  isWeChatEditorPage() {
    // 使用平台管理器检查
    if (window.ZiliuPlatformManager) {
      const platform = window.ZiliuPlatformManager.findPlatformByUrl(window.location.href);
      return platform?.id === 'wechat' && document.querySelector('#js_editor');
    }
    
    // 兜底检查
    return window.location.href.includes('mp.weixin.qq.com') && 
           document.querySelector('#js_editor');
  }

  /**
   * 检查页面是否准备就绪
   */
  isPageReady() {
    return document.readyState === 'complete';
  }

  /**
   * 等待页面准备就绪
   */
  waitForPageReady() {
    return new Promise(resolve => {
      if (this.isPageReady()) {
        resolve();
      } else {
        document.addEventListener('readystatechange', () => {
          if (this.isPageReady()) {
            resolve();
          }
        });
      }
    });
  }
}

// 创建全局实例
window.ZiliuUtilsService = new UtilsService();

console.log('✅ 字流工具服务已加载');