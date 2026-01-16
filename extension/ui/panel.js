/**
 * 字流助手 - UI面板组件
 * 新架构简化版UI界面
 */
class ZiliuPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
    this.stylesLoaded = false;
    this.brandIconUrl = null;
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
      #ziliu-panel,
      #ziliu-toggle-btn,
      .ziliu-toast {
        --ziliu-primary: #3b82f6;
        --ziliu-primary-foreground: #ffffff;
        --ziliu-secondary: #0ea5e9;
        --ziliu-accent: rgba(59, 130, 246, 0.1);
        --ziliu-background: #020617;
        --ziliu-foreground: #e2e8f0;
        --ziliu-muted: rgba(255, 255, 255, 0.05);
        --ziliu-muted-foreground: #94a3b8;
        --ziliu-success: #10b981;
        --ziliu-error: #ef4444;
        --ziliu-border: rgba(255, 255, 255, 0.1);
        --ziliu-border-strong: rgba(255, 255, 255, 0.2);
        --ziliu-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 60px -10px rgba(0, 0, 0, 0.8);
        --ziliu-shadow-hover: 0 0 0 1px rgba(255, 255, 255, 0.2), 0 24px 70px -10px rgba(0, 0, 0, 0.9);
        --ziliu-radius-lg: 16px;
        --ziliu-radius-md: 12px;
        --ziliu-radius-sm: 8px;
        --ziliu-font-sans: "Inter", "Segoe UI", "HarmonyOS Sans SC", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif;
      }

      #ziliu-panel,
      #ziliu-panel *,
      #ziliu-toggle-btn,
      #ziliu-toggle-btn * {
        box-sizing: border-box;
      }
      
      #ziliu-panel {
        position: fixed;
        top: 16px;
        right: -380px;
        width: 320px;
        background: rgba(2, 6, 23, 0.85);
        border-radius: var(--ziliu-radius-lg);
        box-shadow: var(--ziliu-shadow);
        z-index: 10000;
        font-family: var(--ziliu-font-sans);
        font-size: 14px;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        border: 1px solid var(--ziliu-border);
        color: var(--ziliu-foreground);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      @supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
        #ziliu-panel {
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }
      }
      
      #ziliu-panel.visible {
        right: 16px;
      }
      
      .ziliu-panel-header {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%);
        padding: 12px 14px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--ziliu-border);
      }
      
      .ziliu-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .ziliu-brand-icon {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        flex-shrink: 0;
        box-shadow: 0 10px 24px -18px rgba(0, 26, 77, 0.65);
      }
      
      .ziliu-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .ziliu-platform-info {
        font-size: 11px;
        opacity: 0.92;
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        white-space: nowrap;
        color: var(--ziliu-muted-foreground);
      }
      
      .ziliu-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      
      .ziliu-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .ziliu-panel-content {
        padding: 14px;
        max-height: 500px;
        overflow-y: auto;
      }
      
      .ziliu-preset-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ziliu-border);
      }
      
      .ziliu-preset-label {
        font-size: 13px;
        color: var(--ziliu-muted-foreground);
        white-space: nowrap;
        margin: 0;
      }
      
      .ziliu-preset-selector {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--ziliu-border);
        border-radius: var(--ziliu-radius-sm);
        background: rgba(255, 255, 255, 0.05);
        font-size: 13px;
        outline: none;
        color: var(--ziliu-foreground);
        transition: all 0.2s;
      }
      
      .ziliu-preset-selector:focus {
        border-color: var(--ziliu-primary);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      
      .ziliu-preset-selector option {
        background: #020617;
        color: var(--ziliu-foreground);
      }
      
      .ziliu-status {
        text-align: center;
        padding: 20px;
        color: var(--ziliu-muted-foreground);
      }
      
      .ziliu-status-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .ziliu-toggle-btn {
        position: fixed;
        top: 50%;
        right: 16px;
        width: 48px;
        height: 48px;
        background: transparent;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: var(--ziliu-shadow);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transform: translateY(-50%);
      }

      .ziliu-toggle-btn img {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 14px;
      }
      
      .ziliu-toggle-btn:hover {
        transform: translateY(-50%) scale(1.05);
        box-shadow: var(--ziliu-shadow-hover);
      }

      .ziliu-toggle-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.22), var(--ziliu-shadow);
      }

      /* Base UI primitives (scoped to the panel) */
      #ziliu-panel .ziliu-view {
        text-align: center;
        padding: 20px 12px;
      }

      #ziliu-panel .ziliu-emoji {
        font-size: 48px;
        margin-bottom: 16px;
        line-height: 1;
        opacity: 0.9;
      }

      #ziliu-panel .ziliu-h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--ziliu-foreground);
      }

      #ziliu-panel .ziliu-h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: var(--ziliu-foreground);
      }

      #ziliu-panel .ziliu-p {
        margin: 0 0 16px 0;
        font-size: 13px;
        line-height: 1.45;
        color: var(--ziliu-muted-foreground);
      }

      #ziliu-panel .ziliu-text-muted {
        font-size: 13px;
        line-height: 1.45;
        color: var(--ziliu-muted-foreground);
      }

      #ziliu-panel .ziliu-error-text {
        font-size: 13px;
        line-height: 1.45;
        color: var(--ziliu-error);
      }

      #ziliu-panel .ziliu-section {
        margin-bottom: 16px;
      }

      #ziliu-panel .ziliu-list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      #ziliu-panel .ziliu-pill {
        font-size: 12px;
        color: var(--ziliu-muted-foreground);
        background: var(--ziliu-muted);
        border: 1px solid var(--ziliu-border);
        padding: 3px 8px;
        border-radius: 999px;
        white-space: nowrap;
      }

      #ziliu-panel .ziliu-subtle {
        font-size: 12px;
        color: var(--ziliu-muted-foreground);
      }

      #ziliu-panel .ziliu-articles-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      #ziliu-panel .ziliu-article-item {
        border: 1px solid var(--ziliu-border);
        border-radius: var(--ziliu-radius-md);
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      #ziliu-panel .ziliu-article-item:hover {
        border-color: var(--ziliu-primary);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: none;
        transform: translateY(-1px);
      }

      #ziliu-panel .ziliu-article-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
      }

      #ziliu-panel .ziliu-article-title {
        font-weight: 500;
        font-size: 13px;
        color: var(--ziliu-foreground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #ziliu-panel .ziliu-meta {
        font-size: 11px;
        color: var(--ziliu-muted-foreground);
        margin-bottom: 10px;
      }

      #ziliu-panel .ziliu-actions {
        display: flex;
        gap: 8px;
      }

      #ziliu-panel .ziliu-actions .ziliu-btn {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #ziliu-panel .ziliu-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 34px;
        padding: 0 12px;
        border-radius: var(--ziliu-radius-md);
        border: 1px solid transparent;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }

      #ziliu-panel .ziliu-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.18);
      }

      #ziliu-panel .ziliu-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      #ziliu-panel .ziliu-btn-sm {
        height: 30px;
        padding: 0 10px;
        border-radius: var(--ziliu-radius-sm);
      }

      #ziliu-panel .ziliu-btn-primary {
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
        color: var(--ziliu-primary-foreground);
        box-shadow: 0 20px 50px -35px rgba(0, 102, 255, 0.75);
      }

      #ziliu-panel .ziliu-btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 26px 60px -40px rgba(0, 102, 255, 0.8);
      }

      #ziliu-panel .ziliu-btn-outline {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: var(--ziliu-foreground);
      }

      #ziliu-panel .ziliu-btn-outline:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      #ziliu-panel .ziliu-btn-success {
        background: linear-gradient(135deg, var(--ziliu-success) 0%, var(--ziliu-secondary) 100%);
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 18px 45px -36px rgba(0, 229, 177, 0.7);
      }

      #ziliu-panel .ziliu-btn-danger {
        background: linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%);
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 18px 45px -36px rgba(255, 77, 79, 0.7);
      }

      #ziliu-panel .ziliu-icon-btn {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: var(--ziliu-muted-foreground);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, color 0.15s ease;
        flex-shrink: 0;
      }

      #ziliu-panel .ziliu-icon-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--ziliu-foreground);
        transform: translateY(-1px);
      }

      #ziliu-panel .ziliu-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--ziliu-border);
      }

      #ziliu-panel .ziliu-pagination-text {
        font-size: 12px;
        color: var(--ziliu-muted-foreground);
      }

      #ziliu-panel .ziliu-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0, 102, 255, 0.14);
        border-top: 3px solid var(--ziliu-primary);
        border-radius: 50%;
        animation: ziliu-spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes ziliu-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Toast (appended to body) */
      .ziliu-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: #ffffff;
        padding: 10px 14px;
        border-radius: var(--ziliu-radius-md);
        font-size: 13px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 20px 60px -36px rgba(0, 26, 77, 0.55);
        font-family: var(--ziliu-font-sans);
        max-width: min(520px, calc(100vw - 32px));
        text-align: center;
      }

      .ziliu-toast--info {
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
      }

      .ziliu-toast--success {
        background: linear-gradient(135deg, var(--ziliu-success) 0%, var(--ziliu-secondary) 100%);
      }

      .ziliu-toast--error {
        background: linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%);
      }

      @media (prefers-reduced-motion: reduce) {
        #ziliu-panel {
          transition: none;
        }
        .ziliu-toggle-btn {
          transition: none;
        }
      }
    `;
    document.head.appendChild(style);
    this.stylesLoaded = true;
  }

  /**
   * 创建面板
   */
  createPanel() {
    this.brandIconUrl = this.getBrandIconUrl(32);

    // 创建切换按钮
    this.createToggleButton();

    // 创建主面板
    this.panel = document.createElement('div');
    this.panel.id = 'ziliu-panel';
    this.panel.innerHTML = `
      <div class="ziliu-panel-header">
        <div class="ziliu-header-left">
          ${this.brandIconUrl ? `<img class="ziliu-brand-icon" src="${this.brandIconUrl}" alt="字流" />` : ''}
          <h3 class="ziliu-panel-title">字流助手</h3>
          <span class="ziliu-platform-info">${this.getCurrentPlatformName()}</span>
        </div>
        <button class="ziliu-close-btn" id="ziliu-close-btn" aria-label="关闭面板">×</button>
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
    const toggleIconUrl = this.getBrandIconUrl(48);
    toggleBtn.innerHTML = toggleIconUrl
      ? `<img src="${toggleIconUrl}" alt="字流助手" />`
      : '字';
    toggleBtn.title = '打开字流助手';
    toggleBtn.setAttribute('aria-label', '打开字流助手');

    document.body.appendChild(toggleBtn);
    this.toggleBtn = toggleBtn;
  }

  /**
   * 获取品牌 icon（扩展资源）
   */
  getBrandIconUrl(size = 32) {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return null;
      const filename = size >= 48 ? 'icons/icon48.png' : 'icons/icon32.png';
      return chrome.runtime.getURL(filename);
    } catch (_) {
      return null;
    }
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
