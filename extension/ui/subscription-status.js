/**
 * 订阅状态页面 - 显示用户订阅信息和升级引导
 */
class SubscriptionStatus {
  constructor() {
    this.init();
  }

  /**
   * 初始化订阅状态组件
   */
  init() {
    this.injectStyles();

    // 监听面板显示事件，检查是否需要显示订阅状态
    if (window.ZiliuEventBus) {
      window.ZiliuEventBus.on('panel:show', () => {
        this.checkAndShowStatus();
      });
    }
  }

  /**
   * 注入样式
   */
  injectStyles() {
    if (document.getElementById('ziliu-subscription-styles')) return;

    const style = document.createElement('style');
    style.id = 'ziliu-subscription-styles';
    style.textContent = `
      .ziliu-subscription-banner {
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
        color: white;
        padding: 12px;
        border-radius: var(--ziliu-radius-md);
        margin-bottom: 16px;
        text-align: center;
        font-size: 12px;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }

      .ziliu-subscription-banner.free {
        background: var(--ziliu-accent);
        color: var(--ziliu-muted-foreground);
        border: 1px solid var(--ziliu-border);
      }

      .ziliu-subscription-banner.expired {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        color: white;
        border-color: rgba(255, 255, 255, 0.18);
      }

      .ziliu-subscription-title {
        font-weight: bold;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .ziliu-subscription-desc {
        opacity: 0.9;
        line-height: 1.3;
        margin-bottom: 8px;
      }

      .ziliu-upgrade-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: inherit;
        padding: 0 12px;
        height: 30px;
        border-radius: var(--ziliu-radius-sm);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .ziliu-upgrade-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .ziliu-subscription-banner.free .ziliu-upgrade-btn {
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
        border-color: rgba(0, 0, 0, 0.0);
        color: var(--ziliu-primary-foreground);
        box-shadow: 0 18px 45px -36px rgba(0, 102, 255, 0.75);
      }

      .ziliu-subscription-banner.free .ziliu-upgrade-btn:hover {
        transform: translateY(-1px);
      }

      .ziliu-platform-lock {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--ziliu-border);
        color: var(--ziliu-foreground);
        padding: 10px;
        border-radius: var(--ziliu-radius-md);
        margin: 12px 0;
        font-size: 11px;
        text-align: center;
      }

      .ziliu-platform-lock-icon {
        font-size: 16px;
        margin-bottom: 4px;
      }

      .ziliu-platform-lock-text {
        line-height: 1.3;
        margin-bottom: 6px;
      }

      .ziliu-pro-badge {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        margin-left: 8px;
      }

      .ziliu-pro-badge::before {
        content: "💎";
        margin-right: 4px;
      }

      .ziliu-upgrade-page {
        text-align: center;
        padding: 20px 16px;
        color: var(--ziliu-foreground);
      }

      .ziliu-upgrade-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.8;
      }

      .ziliu-upgrade-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 12px;
        color: var(--ziliu-foreground);
      }

      .ziliu-upgrade-description {
        font-size: 13px;
        color: var(--ziliu-muted-foreground);
        line-height: 1.4;
        margin-bottom: 20px;
      }

      .ziliu-upgrade-features {
        text-align: left;
        margin-bottom: 24px;
      }

      .ziliu-upgrade-features .ziliu-feature-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        font-size: 12px;
        color: var(--ziliu-foreground);
      }

      .ziliu-upgrade-features .ziliu-feature-icon {
        width: 16px;
        height: 16px;
        background: var(--ziliu-success);
        color: white;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        margin-right: 10px;
        flex-shrink: 0;
      }

      .ziliu-upgrade-actions {
        margin-top: 20px;
      }

      .ziliu-upgrade-primary-btn {
        display: inline-block;
        background: linear-gradient(135deg, var(--ziliu-primary) 0%, var(--ziliu-secondary) 100%);
        color: white;
        padding: 12px 24px;
        border-radius: var(--ziliu-radius-md);
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 20px 50px -35px rgba(0, 102, 255, 0.75);
      }

      .ziliu-upgrade-primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 26px 60px -40px rgba(0, 102, 255, 0.8);
      }

      .ziliu-upgrade-hint {
        margin-top: 12px;
        font-size: 11px;
        color: var(--ziliu-muted-foreground);
        line-height: 1.3;
      }

      .ziliu-upgrade-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(2, 6, 23, 0.85);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ziliu-radius-lg);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 检查并显示订阅状态
   */
  async checkAndShowStatus() {
    try {
      // 确保订阅服务已初始化
      if (!window.ZiliuSubscriptionService) {
        return;
      }

      const userPlan = await window.ZiliuSubscriptionService.syncUserPlan();
      const currentPlatform = window.ZiliuApp?.currentPlatform;

      // 在面板顶部插入状态横幅
      this.insertStatusBanner(userPlan, currentPlatform);

    } catch (error) {
      console.warn('检查订阅状态失败:', error);
    }
  }

  /**
   * 插入状态横幅
   */
  insertStatusBanner(userPlan, currentPlatform) {
    // 移除已存在的横幅
    const existingBanner = document.querySelector('.ziliu-subscription-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = this.createStatusBanner(userPlan, currentPlatform);
    if (!banner) return;

    // 找到面板内容区域
    const panelContent = document.querySelector('.ziliu-panel-content');
    if (panelContent) {
      panelContent.insertAdjacentHTML('afterbegin', banner);
    }
  }

  /**
   * 创建状态横幅HTML
   */
  createStatusBanner(userPlan, currentPlatform) {
    if (!userPlan) return null;

    // 专业版用户
    if (userPlan.isPro) {
      const daysRemaining = window.ZiliuSubscriptionService?.getDaysRemaining() || 0;
      return `
        <div class="ziliu-subscription-banner">
          <div class="ziliu-subscription-title">
            专业版用户 💎
          </div>
          <div class="ziliu-subscription-desc">
            ${daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '享受全部功能'}
          </div>
        </div>
      `;
    }

    // 已过期用户  
    if (userPlan.isExpired) {
      return `
        <div class="ziliu-subscription-banner expired">
          <div class="ziliu-subscription-title">
            专业版已过期
          </div>
          <div class="ziliu-subscription-desc">
            续费后继续享受全部功能
          </div>
          <a href="${this.getUpgradeUrl()}" target="_blank" class="ziliu-upgrade-btn">
            立即续费
          </a>
        </div>
      `;
    }

    // 免费版用户 - 显示当前平台的限制情况
    return this.createFreeUserBanner(currentPlatform);
  }

  /**
   * 创建免费版用户横幅
   */
  createFreeUserBanner(currentPlatform) {
    if (!currentPlatform) return null;

    // 检查当前平台是否需要专业版
    const needsPro = currentPlatform.requiredPlan === 'pro';

    if (needsPro) {
      return `
        <div class="ziliu-platform-lock">
          <div class="ziliu-platform-lock-icon">🔒</div>
          <div class="ziliu-platform-lock-text">
            ${currentPlatform.displayName}平台需要专业版权限
          </div>
          <a href="${this.getUpgradeUrl()}" target="_blank" class="ziliu-upgrade-btn">
            升级专业版
          </a>
        </div>
      `;
    }

    // 微信公众号用户显示升级引导
    if (currentPlatform.id === 'wechat') {
      return `
        <div class="ziliu-subscription-banner free">
          <div class="ziliu-subscription-title">
            免费版用户
          </div>
          <div class="ziliu-subscription-desc">
            升级专业版解锁知乎、掘金、知识星球等平台
          </div>
          <a href="${this.getUpgradeUrl()}" target="_blank" class="ziliu-upgrade-btn">
            了解专业版
          </a>
        </div>
      `;
    }

    return null;
  }

  /**
   * 获取升级URL
   */
  getUpgradeUrl() {
    // 优先使用API服务的配置，然后使用统一常量配置
    const baseUrl = window.ZiliuApiService?.config?.baseURL || window.ZiliuConstants?.DEFAULT_API_BASE_URL || 'https://www.ziliu.online';
    return window.ZiliuConstants?.URLS?.PRICING || `${baseUrl}/pricing`;
  }

  /**
   * 显示平台锁定状态 - 用遮罩层覆盖整个面板
   */
  showPlatformLocked(platformName) {
    console.log('🔒 开始显示平台锁定遮罩:', platformName);

    // 延迟执行，确保面板已经创建
    setTimeout(() => {
      const panel = document.querySelector('#ziliu-panel');
      if (!panel) {
        console.error('❌ 找不到面板元素 #ziliu-panel，重试中...');
        // 再次延迟重试
        setTimeout(() => this.showPlatformLocked(platformName), 1000);
        return;
      }

      console.log('✅ 找到面板元素:', panel);
      this.createOverlay(panel, platformName);
    }, 500);
  }

  /**
   * 创建遮罩层
   */
  createOverlay(panel, platformName) {
    // 移除已存在的遮罩
    const existingOverlay = document.querySelector('.ziliu-upgrade-overlay');
    if (existingOverlay) {
      console.log('🗑️ 移除已存在的遮罩');
      existingOverlay.remove();
    }


    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'ziliu-upgrade-overlay';
    overlay.innerHTML = `
      <div class="ziliu-upgrade-page">
        <div class="ziliu-upgrade-icon">🔒</div>
        <div class="ziliu-upgrade-title">${platformName} 需要专业版</div>
        <div class="ziliu-upgrade-description">
          升级专业版后即可在 ${platformName} 平台使用字流助手的全部功能
        </div>
        
        <div class="ziliu-upgrade-features">
          <div class="ziliu-feature-item">
            <span class="ziliu-feature-icon">✓</span>
            <span>支持知乎、掘金、知识星球等平台</span>
          </div>
          <div class="ziliu-feature-item">
            <span class="ziliu-feature-icon">✓</span>
            <span>无限文章存储空间</span>
          </div>
          <div class="ziliu-feature-item">
            <span class="ziliu-feature-icon">✓</span>
            <span>更多云端图片存储额度</span>
          </div>
          <div class="ziliu-feature-item">
            <span class="ziliu-feature-icon">✓</span>
            <span>专业样式模板</span>
          </div>
          <div class="ziliu-feature-item">
            <span class="ziliu-feature-icon">✓</span>
            <span>发布预设功能</span>
          </div>
        </div>

        <div class="ziliu-upgrade-actions">
          <a href="${this.getUpgradeUrl()}" target="_blank" class="ziliu-upgrade-primary-btn">
            立即升级专业版
          </a>
          <div class="ziliu-upgrade-hint">
            在微信公众号平台可免费使用基础功能
          </div>
        </div>
      </div>
    `;

    // 将遮罩层添加到面板中
    panel.appendChild(overlay);
    console.log('🎭 遮罩层已添加到面板:', overlay);

    // 强制样式更新
    overlay.style.display = 'flex';
    console.log('✅ 平台锁定遮罩显示完成');
  }

  /**
   * 为面板标题添加专业版徽章
   */
  addProBadge() {
    const panelTitle = document.querySelector('.ziliu-panel-title');
    if (panelTitle && !panelTitle.querySelector('.ziliu-pro-badge')) {
      panelTitle.insertAdjacentHTML('afterend', '<span class="ziliu-pro-badge">PRO</span>');
    }
  }

  /**
   * 移除专业版徽章
   */
  removeProBadge() {
    const proBadge = document.querySelector('.ziliu-pro-badge');
    if (proBadge) {
      proBadge.remove();
    }
  }
}

// 创建全局实例
window.ZiliuSubscriptionStatus = new SubscriptionStatus();

console.log('✅ 字流订阅状态组件已加载');
