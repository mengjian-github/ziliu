/**
 * 字流助手 - 功能管理器
 * 处理面板的各种功能逻辑
 */
class ZiliuFeatures {
  constructor() {
    this.isLoggedIn = false;
    this.articles = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.loading = false;
    
    // 预设相关状态
    this.presets = [];
    this.selectedPreset = null;
  }

  /**
   * 初始化功能管理器
   */
  init() {
    console.log('🔧 初始化功能管理器...');
    this.bindEvents();
    this.checkLoginStatus();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 监听面板显示事件
    ZiliuEventBus.on('panel:show', () => {
      this.onPanelShow();
    });

    // 监听预设加载完成事件
    ZiliuEventBus.on('presets:loaded', (data) => {
      this.onPresetsLoaded(data);
    });

    // 监听预设切换事件
    ZiliuEventBus.on('presets:changed', (data) => {
      this.onPresetChanged(data);
    });

    // 监听应用就绪事件
    ZiliuEventBus.on('app:ready', () => {
      this.onAppReady();
    });

  }

  /**
   * 面板显示时的处理
   */
  async onPanelShow() {
    console.log('👀 面板显示，开始处理...');
    
    // 面板显示时，如果有预设数据就更新选择器
    if (this.presets.length > 0) {
      console.log('🎯 面板显示时更新预设选择器');
      this.updatePresetSelector();
    }
    
    if (!this.isLoggedIn) {
      await this.checkLoginStatus();
    }
    
    if (this.isLoggedIn && this.articles.length === 0) {
      await this.loadArticles();
    }
  }

  /**
   * 应用就绪时的处理
   */
  onAppReady() {
    console.log('📱 应用就绪，更新面板内容');
    this.updatePanelContent();
  }


  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      this.showLoading('检查登录状态...');
      
      // 使用原版的登录检查逻辑：尝试获取文章列表来验证登录状态
      const response = await this.makeApiRequest('/api/articles?limit=1', 'GET');
      this.isLoggedIn = response && response.success === true;
      
      console.log('登录状态检查结果:', { response, isLoggedIn: this.isLoggedIn });
      
      if (this.isLoggedIn) {
        await this.loadArticles();
      } else {
        this.showLoginForm();
      }
    } catch (error) {
      console.error('登录状态检查失败:', error);
      
      // 检查是否是401未授权错误
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('用户未登录 (401)');
        this.isLoggedIn = false;
        this.showLoginForm();
      } else if (error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ 插件上下文已失效，请刷新页面');
        this.showError('插件需要刷新页面才能正常工作');
      } else {
        // 其他错误也视为未登录
        this.isLoggedIn = false;
        this.showLoginForm();
      }
    }
  }

  /**
   * 加载文章列表
   */
  async loadArticles(page = 1) {
    try {
      this.showLoading('加载文章列表...');
      
      const response = await this.makeApiRequest(`/api/articles?page=${page}&limit=3`, 'GET');
      
      if (response.success) {
        this.articles = response.data.articles || [];
        this.currentPage = response.data.pagination?.page || 1;
        this.totalPages = response.data.pagination?.totalPages || 1;
        this.totalArticles = response.data.pagination?.total || this.articles.length;
        
        console.log('文章加载完成:', this.articles.length, '篇文章，总共', this.totalArticles, '篇');
        console.log('当前页:', this.currentPage, '总页数:', this.totalPages);
        this.showArticleList();
      } else {
        throw new Error(response.message || '加载文章失败');
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      this.showError('加载文章列表失败: ' + error.message);
    }
  }

  /**
   * 显示登录表单
   */
  showLoginForm() {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        <h3 style="margin: 0 0 12px 0; color: #2d3436;">未登录</h3>
        <p style="color: #636e72; margin: 0 0 20px 0; font-size: 13px;">
          请先登录字流平台获取文章列表
        </p>
        <button id="ziliu-login-btn" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">前往登录</button>
      </div>
    `;
    
    this.updatePanelContent(content);
    
    // 绑定登录按钮事件
    const loginBtn = document.getElementById('ziliu-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        try {
          const response = await this.getZiliuUrls();
          window.open(response.data.loginUrl, '_blank');
        } catch (error) {
          console.error('获取登录URL失败:', error);
          // 兜底使用配置中的登录URL
          window.open(window.ZiliuConstants?.URLS?.LOGIN || 'https://www.ziliu.online/login', '_blank');
        }
      });
    }
  }

  /**
   * 显示文章列表
   */
  showArticleList() {
    if (this.articles.length === 0) {
      const content = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
          <h3 style="margin: 0 0 12px 0; color: #2d3436;">暂无文章</h3>
          <p style="color: #636e72; margin: 0; font-size: 13px;">
            去字流平台创建您的第一篇文章吧
          </p>
        </div>
      `;
      this.updatePanelContent(content);
      return;
    }

    const platformName = this.getCurrentPlatformName();
    const articlesHtml = this.articles.map(article => this.createArticleItem(article)).join('');
    
    const content = `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 14px; color: #2d3436;">文章列表</h4>
          <span style="font-size: 12px; color: #636e72;">${platformName}</span>
        </div>
        <div style="font-size: 12px; color: #636e72; margin-bottom: 16px;">
          共 ${this.totalArticles || this.articles.length} 篇文章
        </div>
      </div>
      <div id="ziliu-articles-list">
        ${articlesHtml}
      </div>
      ${this.createPagination()}
    `;
    
    this.updatePanelContent(content);
    this.bindArticleEvents();
  }

  /**
   * 创建文章项
   */
  createArticleItem(article) {
    const truncatedTitle = article.title.length > 20 ? 
      article.title.substring(0, 20) + '...' : article.title;
    
    // 获取当前平台信息和按钮配置
    const currentPlatform = window.ZiliuApp?.getCurrentPlatform();
    const buttonConfig = currentPlatform?.buttonConfig || currentPlatform?.getDefaultButtonConfig?.() || {
      fillButton: { text: '填充', tooltip: '填充文章内容' },
      copyButton: { text: '复制', tooltip: '复制文章内容' }
    };
    
    // 检查平台特殊设置
    const noCopyButton = currentPlatform?.specialHandling?.noCopyButton;
    const fillDisabled = currentPlatform?.specialHandling?.disabled || 
                        currentPlatform?.specialHandling?.copyOnly;
    
    // 生成填充按钮HTML
    const fillBtn = buttonConfig.fillButton || {};
    const fillButtonHtml = `
      <button class="ziliu-fill-btn" ${fillDisabled ? 'disabled' : ''} style="
        background: ${fillDisabled ? '#d9d9d9' : (fillBtn.style?.background || '#667eea')};
        border: none;
        color: ${fillBtn.style?.color || 'white'};
        padding: 6px 12px;
        border-radius: 4px;
        cursor: ${fillDisabled ? 'not-allowed' : 'pointer'};
        font-size: 11px;
        flex: 1;
      " title="${fillBtn.tooltip || '填充文章内容'}">${fillBtn.text || '填充'}</button>
    `;
    
    // 生成复制按钮HTML  
    const copyBtn = buttonConfig.copyButton || {};
    const copyButtonHtml = noCopyButton ? '' : `
      <button class="ziliu-copy-btn" style="
        background: ${copyBtn.style?.background || '#52c41a'};
        border: none;
        color: ${copyBtn.style?.color || 'white'};
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        flex: 1;
      " title="${copyBtn.tooltip || '复制文章内容'}">${copyBtn.text || '复制'}</button>
    `;
    
    return `
      <div class="ziliu-article-item" style="
        border: 1px solid #e1e8ed;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        background: #fafbfc;
        cursor: pointer;
        transition: all 0.2s;
      " data-article-id="${article.id}">
        <div style="font-weight: 500; font-size: 13px; color: #2d3436; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>${truncatedTitle}</span>
          <button class="ziliu-edit-btn" style="
            background: none;
            border: 1px solid #d9d9d9;
            color: #666;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            line-height: 1;
          " title="跳转到平台编辑">📝</button>
        </div>
        <div style="font-size: 11px; color: #636e72; margin-bottom: 10px;">
          ${this.formatDate(article.createdAt)}
        </div>
        <div style="display: flex; gap: 8px;">
          ${fillButtonHtml}
          ${copyButtonHtml}
        </div>
      </div>
    `;
  }

  /**
   * 创建分页
   */
  createPagination() {
    if (this.totalPages <= 1) return '';
    
    const prevDisabled = this.currentPage <= 1;
    const nextDisabled = this.currentPage >= this.totalPages;
    
    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e1e8ed;
      ">
        <button id="ziliu-prev-page" ${prevDisabled ? 'disabled' : ''} style="
          background: ${prevDisabled ? '#f0f0f0' : '#667eea'};
          border: none;
          color: ${prevDisabled ? '#999' : 'white'};
          padding: 6px 12px;
          border-radius: 4px;
          cursor: ${prevDisabled ? 'not-allowed' : 'pointer'};
          font-size: 12px;
        ">上一页</button>
        <span style="font-size: 12px; color: #636e72;">
          ${this.currentPage} / ${this.totalPages}
        </span>
        <button id="ziliu-next-page" ${nextDisabled ? 'disabled' : ''} style="
          background: ${nextDisabled ? '#f0f0f0' : '#667eea'};
          border: none;
          color: ${nextDisabled ? '#999' : 'white'};
          padding: 6px 12px;
          border-radius: 4px;
          cursor: ${nextDisabled ? 'not-allowed' : 'pointer'};
          font-size: 12px;
        ">下一页</button>
      </div>
    `;
  }

  /**
   * 绑定文章相关事件
   */
  bindArticleEvents() {
    // 填充按钮事件
    document.querySelectorAll('.ziliu-fill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const articleId = btn.closest('.ziliu-article-item').dataset.articleId;
        this.fillArticle(articleId, btn);
      });
    });

    // 复制按钮事件
    document.querySelectorAll('.ziliu-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const articleId = btn.closest('.ziliu-article-item').dataset.articleId;
        this.copyArticle(articleId, btn);
      });
    });

    // 编辑按钮事件
    document.querySelectorAll('.ziliu-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const articleId = btn.closest('.ziliu-article-item').dataset.articleId;
        this.editArticle(articleId);
      });
    });

    // 分页事件
    const prevBtn = document.getElementById('ziliu-prev-page');
    const nextBtn = document.getElementById('ziliu-next-page');
    
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadArticles(this.currentPage - 1);
      });
    }
    
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadArticles(this.currentPage + 1);
      });
    }
  }

  /**
   * 填充文章到编辑器
   */
  async fillArticle(articleId, buttonElement) {
    const originalText = buttonElement.textContent;
    
    try {
      buttonElement.textContent = '填充中...';
      buttonElement.disabled = true;
      
      // 使用App的完整填充功能
      const result = await window.ZiliuApp.handleFillContent({ 
        articleId: articleId,
        // author和preset都让App从当前选中的预设中获取
      });
      
      if (result.success) {
        buttonElement.textContent = '已填充';
        buttonElement.style.background = '#52c41a';
        this.showToast('文章填充成功！', 'success');
      } else {
        throw new Error(result.error || '填充失败');
      }
      
    } catch (error) {
      console.error('填充文章失败:', error);
      buttonElement.textContent = '填充失败';
      buttonElement.style.background = '#ff4d4f';
      this.showToast('填充失败: ' + error.message, 'error');
    }
    
    // 2秒后恢复按钮状态
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.style.background = '#667eea';
      buttonElement.disabled = false;
    }, 2000);
  }

  /**
   * 预设加载完成事件处理
   */
  onPresetsLoaded(data) {
    console.log('📋 UI接收到预设加载事件:', data);
    this.presets = data.presets || [];
    this.selectedPreset = data.selectedPreset;
    
    // 不在这里立即更新UI，而是等待面板显示时再更新
    console.log('📋 预设数据已保存，等待面板显示时更新UI');
  }

  /**
   * 预设切换事件处理
   */
  onPresetChanged(data) {
    console.log('🎯 UI接收到预设切换事件:', data);
    this.selectedPreset = data.selectedPreset;
    
    // 更新UI显示
    this.updatePresetSelector();
  }

  /**
   * 更新预设选择器UI
   */
  updatePresetSelector() {
    const presetSelector = document.getElementById('ziliu-preset-selector');
    if (!presetSelector) {
      console.warn('⚠️ 预设选择器元素未找到，可能面板未显示');
      return;
    }

    // 清空现有选项
    presetSelector.innerHTML = '';

    if (this.presets.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '暂无预设';
      presetSelector.appendChild(option);
      return;
    }

    // 添加"不使用预设"选项
    const noneOption = document.createElement('option');
    noneOption.value = 'none';
    noneOption.textContent = '不使用预设';
    // 如果没有选中的预设，默认选中"不使用预设"
    if (!this.selectedPreset) {
      noneOption.selected = true;
    }
    presetSelector.appendChild(noneOption);

    // 添加预设选项
    this.presets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      
      if (this.selectedPreset && preset.id === this.selectedPreset.id) {
        option.selected = true;
      }
      
      presetSelector.appendChild(option);
    });

    console.log('✅ 预设选择器已更新');
  }

  /**
   * 处理预设选择变化
   */
  onPresetSelectorChange(event) {
    const presetId = event.target.value;
    if (presetId === 'none') {
      // 选择不使用预设
      if (window.ZiliuApp) {
        window.ZiliuApp.setSelectedPreset(null);
        console.log('🎯 用户选择不使用预设');
      }
    } else if (presetId && window.ZiliuApp) {
      window.ZiliuApp.setSelectedPreset(presetId);
      console.log('🎯 用户选择预设:', presetId);
    }
  }

  /**
   * 跳转到字流编辑页面
   */
  async editArticle(articleId) {
    try {
      console.log('跳转到字流编辑页面:', articleId);
      
      // 通过background获取配置URL
      const response = await this.getZiliuUrls(articleId);
      const editorUrl = response.data.editorUrl;
      
      // 在新标签页中打开编辑页面
      window.open(editorUrl, '_blank');
      
      this.showToast('已跳转到字流编辑页面', 'success');
      
    } catch (error) {
      console.error('跳转编辑页面失败:', error);
      this.showToast('跳转失败: ' + error.message, 'error');
    }
  }

  /**
   * 复制文章内容
   */
  async copyArticle(articleId, buttonElement) {
    const originalText = buttonElement.textContent;
    
    try {
      buttonElement.textContent = '复制中...';
      buttonElement.disabled = true;
      
      // 获取当前平台实例
      const currentPlatform = window.ZiliuApp?.getCurrentPlatform();
      
      let result;
      if (currentPlatform && typeof currentPlatform.copyArticleContent === 'function') {
        // 使用当前平台的复制方法
        console.log(`📋 使用 ${currentPlatform.displayName} 平台的复制方法`);
        result = await currentPlatform.copyArticleContent(articleId);
      } else {
        // 降级到默认的Markdown复制
        console.log('📋 使用默认的Markdown复制方法');
        const response = await this.makeApiRequest(`/api/articles/${articleId}?format=raw`, 'GET');
        if (!response.success) {
          throw new Error(response.message || '获取文章内容失败');
        }
        
        const markdownContent = response.data.content;
        await navigator.clipboard.writeText(markdownContent);
        
        result = {
          success: true,
          message: 'Markdown内容已复制到剪贴板！'
        };
      }
      
      if (result.success) {
        buttonElement.textContent = '已复制';
        buttonElement.style.background = '#52c41a';
        this.showToast(result.message || '内容已复制到剪贴板！', 'success');
      } else {
        throw new Error(result.error || result.message || '复制失败');
      }
      
    } catch (error) {
      console.error('复制文章失败:', error);
      buttonElement.textContent = '复制失败';
      buttonElement.style.background = '#ff4d4f';
      this.showToast('复制失败: ' + error.message, 'error');
    }
    
    // 2秒后恢复按钮状态
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.style.background = '#52c41a';
      buttonElement.disabled = false;
    }, 2000);
  }

  /**
   * 显示加载状态
   */
  showLoading(message = '加载中...') {
    const content = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="
          width: 32px;
          height: 32px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <div style="color: #636e72; font-size: 14px;">${message}</div>
      </div>
    `;
    this.updatePanelContent(content);
    
    // 添加旋转动画
    if (!document.getElementById('ziliu-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'ziliu-spinner-styles';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 显示错误状态
   */
  showError(message) {
    const content = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <div style="color: #ff4d4f; font-size: 14px; line-height: 1.4;">${message}</div>
        <button onclick="window.ZiliuFeatures.checkLoginStatus()" style="
          background: #667eea;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 16px;
        ">重试</button>
      </div>
    `;
    this.updatePanelContent(content);
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    const colors = {
      success: '#52c41a',
      error: '#ff4d4f',
      info: '#1890ff'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 50%;
      transform: translateX(50%);
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * 更新面板内容
   */
  updatePanelContent(content) {
    if (window.ZiliuPanel) {
      window.ZiliuPanel.updateContent(content);
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
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '未知日期';
    
    console.log('格式化日期:', dateString, typeof dateString);
    
    let date;
    try {
      // 尝试直接创建Date对象
      date = new Date(dateString);
      
      // 如果日期无效，尝试其他格式
      if (isNaN(date.getTime())) {
        // 如果是数字字符串或时间戳
        if (typeof dateString === 'string' && !isNaN(dateString)) {
          date = new Date(parseInt(dateString));
        } else if (typeof dateString === 'number') {
          date = new Date(dateString);
        } else {
          console.warn('无法解析日期:', dateString);
          return '日期格式错误';
        }
      }
      
      // 再次检查日期有效性
      if (isNaN(date.getTime())) {
        return '无效日期';
      }
      
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('日期格式化错误:', error, dateString);
      return '日期错误';
    }
  }

  /**
   * 获取字流配置URL
   */
  async getZiliuUrls(articleId = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getZiliuUrls',
        data: { articleId }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || '获取配置失败'));
        }
      });
    });
  }

  /**
   * 发起API请求
   */
  async makeApiRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'apiRequest',
        data: {
          endpoint: endpoint,
          method: method,
          body: data
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        console.log('API请求响应:', { endpoint, response });
        
        if (response && response.success) {
          resolve(response);
        } else {
          const errorMsg = response?.error || '请求失败';
          console.error('API请求失败:', { endpoint, errorMsg, response });
          reject(new Error(errorMsg));
        }
      });
    });
  }
}

// 全局实例
window.ZiliuFeatures = new ZiliuFeatures();