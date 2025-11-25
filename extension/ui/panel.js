/**
 * 字流助手 - UI面板组件
 * 新架构简化版UI界面
 */
class ZiliuPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
    this.stylesLoaded = false;
  }

  /**
   * 初始化面板
   */
  init() {
    console.log('🎨 初始化字流面板...');
    this.loadStyles();
    this.createPanel();
    this.bindEvents();
    console.log('✅ 字流面板初始化完成');
  }

  /**
   * 加载样式
   */
  loadStyles() {
    if (this.stylesLoaded || document.getElementById('ziliu-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'ziliu-panel-styles';
    style.textContent = `
      :root {
        --ziliu-primary: #667eea;
        --ziliu-success: #52c41a;
        --ziliu-error: #ff4d4f;
        --ziliu-text-primary: #2d3436;
        --ziliu-text-light: #636e72;
        --ziliu-bg-primary: #ffffff;
        --ziliu-border: #e1e8ed;
        --ziliu-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      #ziliu-panel {
        position: fixed;
        top: 20px;
        right: -350px;
        width: 320px;
        background: var(--ziliu-bg-primary);
        border-radius: 12px;
        box-shadow: var(--ziliu-shadow);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        border: 1px solid var(--ziliu-border);
      }
      
      #ziliu-panel.visible {
        right: 20px;
      }
      
      .ziliu-panel-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 12px 16px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .ziliu-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .ziliu-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .ziliu-platform-info {
        font-size: 11px;
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.15);
        padding: 2px 8px;
        border-radius: 12px;
      }
      
      .ziliu-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .ziliu-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .ziliu-panel-content {
        padding: 16px;
        max-height: 500px;
        overflow-y: auto;
      }
      
      .ziliu-preset-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e1e8ed;
      }
      
      .ziliu-preset-label {
        font-size: 13px;
        color: #666;
        white-space: nowrap;
        margin: 0;
      }
      
      .ziliu-preset-selector {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: white;
        font-size: 13px;
        outline: none;
      }
      
      .ziliu-preset-selector:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
      }
      
      .ziliu-status {
        text-align: center;
        padding: 20px;
        color: var(--ziliu-text-light);
      }
      
      .ziliu-status-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .ziliu-toggle-btn {
        position: fixed;
        top: 50%;
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: var(--ziliu-shadow);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-50%);
      }
      
      .ziliu-toggle-btn:hover {
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }
    `;
    document.head.appendChild(style);
    this.stylesLoaded = true;
  }

  /**
   * 创建面板
   */
  createPanel() {
    // 创建切换按钮
    this.createToggleButton();
    
    // 创建主面板
    this.panel = document.createElement('div');
    this.panel.id = 'ziliu-panel';
    this.panel.innerHTML = `
      <div class="ziliu-panel-header">
        <div class="ziliu-header-left">
          <h3 class="ziliu-panel-title">字流助手</h3>
          <span class="ziliu-platform-info">${this.getCurrentPlatformName()}</span>
        </div>
        <button class="ziliu-close-btn" id="ziliu-close-btn">×</button>
      </div>
      <div class="ziliu-panel-content">
        <!-- 预设选择器 -->
        <div class="ziliu-preset-section">
          <label class="ziliu-preset-label">预设:</label>
          <select id="ziliu-preset-selector" class="ziliu-preset-selector">
            <option value="none">不使用预设</option>
          </select>
        </div>
        
        <div id="ziliu-content">
          <!-- 动态内容区域 -->
        </div>
      </div>
    `;
    
    document.body.appendChild(this.panel);
  }

  /**
   * 创建切换按钮
   */
  createToggleButton() {
    const existingBtn = document.getElementById('ziliu-toggle-btn');
    if (existingBtn) existingBtn.remove();

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ziliu-toggle-btn';
    toggleBtn.className = 'ziliu-toggle-btn';
    toggleBtn.innerHTML = '字';
    toggleBtn.title = '打开字流助手';
    
    document.body.appendChild(toggleBtn);
    this.toggleBtn = toggleBtn;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 切换按钮点击
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }

    // 关闭按钮点击
    const closeBtn = this.panel?.querySelector('#ziliu-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 预设选择器变化
    const presetSelector = this.panel?.querySelector('#ziliu-preset-selector');
    if (presetSelector) {
      presetSelector.addEventListener('change', (e) => {
        if (window.ZiliuFeatures && typeof window.ZiliuFeatures.onPresetSelectorChange === 'function') {
          window.ZiliuFeatures.onPresetSelectorChange(e);
        }
      });
    }

    // 点击面板外部关闭
    document.addEventListener('click', (e) => {
      if (this.isVisible && 
          this.panel && 
          !this.panel.contains(e.target) && 
          !this.toggleBtn?.contains(e.target)) {
        this.hide();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * 显示面板
   */
  show() {
    if (!this.panel) return;
    
    this.panel.classList.add('visible');
    this.isVisible = true;
    
    // 发送事件通知
    ZiliuEventBus.emit('panel:show');
  }

  /**
   * 隐藏面板
   */
  hide() {
    if (!this.panel) return;
    
    this.panel.classList.remove('visible');
    this.isVisible = false;
    
    // 发送事件通知
    ZiliuEventBus.emit('panel:hide');
  }

  /**
   * 切换面板显示状态
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 获取当前平台名称
   */
  getCurrentPlatformName() {
    const app = window.ZiliuApp;
    if (app?.currentPlatform) {
      return app.currentPlatform.displayName || '未知平台';
    }
    return '未检测到支持的平台';
  }

  /**
   * 更新面板内容（只更新动态内容区域，保留预设选择器等固定UI）
   */
  updateContent(content) {
    const contentEl = this.panel?.querySelector('#ziliu-content');
    if (contentEl) {
      contentEl.innerHTML = content;
    }
  }

  /**
   * 显示加载状态
   */
  showLoading(message = '加载中...') {
    this.updateContent(`
      <div class="ziliu-status">
        <div class="ziliu-status-icon">⏳</div>
        <div>${message}</div>
      </div>
    `);
  }

  /**
   * 显示错误状态
   */
  showError(error = '发生了错误') {
    this.updateContent(`
      <div class="ziliu-status">
        <div class="ziliu-status-icon">❌</div>
        <div>${error}</div>
      </div>
    `);
  }

  /**
   * 销毁面板
   */
  destroy() {
    this.panel?.remove();
    this.toggleBtn?.remove();
    const styles = document.getElementById('ziliu-panel-styles');
    styles?.remove();
  }
}

// 全局实例
window.ZiliuPanel = new ZiliuPanel();