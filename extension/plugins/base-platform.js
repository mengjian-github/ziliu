/**
 * 基础平台插件类 - 所有平台插件的基类
 * 提供统一的接口和通用功能
 */
class BasePlatformPlugin {
  constructor(config = {}) {
    // 从config.js中的平台配置初始化
    this.config = config;
    this.id = config.id;
    this.name = config.name || config.id;
    this.displayName = config.displayName || this.name;
    this.urlPatterns = config.urlPatterns || [];
    this.editorUrl = config.editorUrl || '';
    this.selectors = config.selectors || {};
    this.features = config.features || [];
    this.contentType = config.contentType || 'html';
    this.priority = config.priority || 0;
    this.specialHandling = config.specialHandling || {};
    this.buttonConfig = config.specialHandling?.buttonConfig || this.getDefaultButtonConfig();
    
    // 缓存的DOM元素
    this.cachedElements = null;
    this.cacheTime = 0;
    this.cacheTimeout = 5000; // 5秒缓存
  }

  /**
   * 获取默认按钮配置
   */
  getDefaultButtonConfig() {
    return {
      fillButton: {
        text: '填充',
        tooltip: '填充文章内容',
        style: { background: '#667eea', color: 'white' }
      },
      copyButton: {
        text: '复制', 
        tooltip: '复制文章内容',
        style: { background: '#52c41a', color: 'white' }
      }
    };
  }

  /**
   * 插件初始化
   */
  async init() {
    console.log(`🚀 平台插件初始化: ${this.displayName}`);
    ZiliuEventBus.emit('platform:init', { id: this.id });
  }

  /**
   * 插件销毁
   */
  async destroy() {
    this.cachedElements = null;
    console.log(`🗑️ 平台插件销毁: ${this.displayName}`);
    ZiliuEventBus.emit('platform:destroy', { id: this.id });
  }

  /**
   * 检查当前页面是否是该平台的编辑器
   */
  isEditorPage(url = window.location.href) {
    return this.urlPatterns.some(pattern => this.matchUrl(url, pattern));
  }

  /**
   * URL模式匹配
   */
  matchUrl(url, pattern) {
    try {
      const escapedPattern = pattern
        .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp('^' + escapedPattern + '$', 'i');
      return regex.test(url);
    } catch (error) {
      console.error('URL匹配失败:', { pattern, error });
      return false;
    }
  }

  /**
   * 查找编辑器元素
   * 支持缓存以提高性能
   */
  findEditorElements(useCache = true) {
    const now = Date.now();
    
    // 检查缓存
    if (useCache && this.cachedElements && (now - this.cacheTime) < this.cacheTimeout) {
      return this.cachedElements;
    }

    const elements = this._findElements();
    
    // 更新缓存
    if (useCache && elements.isEditor) {
      this.cachedElements = elements;
      this.cacheTime = now;
    }

    return elements;
  }

  /**
   * 实际查找元素的方法（子类可重写）
   */
  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 根据配置查找元素
    for (const [key, selector] of Object.entries(this.selectors)) {
      if (typeof selector === 'string') {
        elements.elements[key] = this.findElement(selector);
      } else if (Array.isArray(selector)) {
        // 支持多个选择器，取第一个找到的
        elements.elements[key] = this.findElementFromSelectors(selector);
      }
    }

    // 检查是否是编辑器页面
    elements.isEditor = this.validateEditorElements(elements.elements);

    return elements;
  }

  /**
   * 查找单个元素
   */
  findElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn(`元素选择器错误 [${this.id}]:`, { selector, error });
      return null;
    }
  }

  /**
   * 从多个选择器中查找元素
   */
  findElementFromSelectors(selectors) {
    for (const selector of selectors) {
      const element = this.findElement(selector);
      if (element) return element;
    }
    return null;
  }

  /**
   * 验证编辑器元素是否完整（子类可重写）
   */
  validateEditorElements(elements) {
    // 默认检查是否有标题或内容编辑器
    return !!(elements.title || elements.content);
  }

  /**
   * 填充内容到编辑器
   */
  async fillContent(data) {
    const elements = this.findEditorElements(false); // 强制不使用缓存
    
    if (!elements.isEditor) {
      throw new Error(`当前页面不是${this.displayName}编辑器`);
    }

    console.log(`🚀 开始填充${this.displayName}内容`);
    const results = {};

    // 填充标题
    if (data.title && elements.elements.title) {
      results.title = await this.fillTitle(elements.elements.title, data.title);
    }

    // 填充作者
    if (data.author && elements.elements.author) {
      results.author = await this.fillAuthor(elements.elements.author, data.author);
    }

    // 填充内容
    if (data.content && elements.elements.content) {
      console.log('🔍 即将填充内容:', {
        hasContent: !!data.content,
        hasContentElement: !!elements.elements.content,
        contentElementTag: elements.elements.content?.tagName,
        contentElementClass: elements.elements.content?.className,
        contentElementId: elements.elements.content?.id
      });
      results.content = await this.fillContentEditor(elements.elements.content, data.content, data);
      console.log('📝 内容填充结果:', results.content);
    } else {
      console.warn('⚠️ 跳过内容填充:', {
        hasContent: !!data.content,
        hasContentElement: !!elements.elements.content
      });
    }

    // 填充摘要
    if (data.digest && elements.elements.digest) {
      results.digest = await this.fillDigest(elements.elements.digest, data.digest);
    }

    // 执行后处理
    await this.postFillProcess(elements.elements, data, results);

    console.log(`✅ ${this.displayName}内容填充完成`);
    ZiliuEventBus.emit('platform:fillComplete', { 
      platform: this.id, 
      results,
      data
    });

    return results;
  }

  /**
   * 填充标题
   */
  async fillTitle(titleElement, title) {
    try {
      await this.setInputValue(titleElement, title);
      await this.delay(200);
      return { success: true, value: title };
    } catch (error) {
      console.error(`标题填充失败 [${this.id}]:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 填充作者
   */
  async fillAuthor(authorElement, author) {
    try {
      await this.setInputValue(authorElement, author);
      await this.delay(200);
      return { success: true, value: author };
    } catch (error) {
      console.error(`作者填充失败 [${this.id}]:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 填充内容编辑器（子类应重写此方法）
   */
  async fillContentEditor(contentElement, content, data) {
    try {
      // 根据内容类型处理
      const processedContent = await this.processContent(content, data);
      await this.setEditorContent(contentElement, processedContent);
      await this.delay(500);
      return { success: true, value: processedContent };
    } catch (error) {
      console.error(`内容填充失败 [${this.id}]:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 填充摘要
   */
  async fillDigest(digestElement, digest) {
    try {
      await this.setInputValue(digestElement, digest);
      await this.delay(200);
      return { success: true, value: digest };
    } catch (error) {
      console.error(`摘要填充失败 [${this.id}]:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置输入框值
   */
  async setInputValue(element, value) {
    if (!element || value === undefined) return;

    // 清空当前值
    element.focus();
    element.value = '';
    
    // 设置新值
    element.value = value;

    // 触发必要的事件
    const events = ['input', 'change', 'blur'];
    for (const eventType of events) {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
      await this.delay(50);
    }
  }

  /**
   * 设置编辑器内容（子类可重写）
   */
  async setEditorContent(element, content) {
    if (!element || content === undefined) return;

    if (element.contentEditable === 'true' || element.isContentEditable) {
      // 可编辑div
      element.focus();
      element.innerHTML = content;
      
      // 触发输入事件
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
    } else if (element.tagName === 'TEXTAREA') {
      // 文本域
      await this.setInputValue(element, content);
    } else {
      console.warn(`不支持的编辑器元素类型: ${element.tagName}`);
    }
  }

  /**
   * 内容处理（子类可重写）
   */
  async processContent(content, data) {
    if (this.specialHandling.processLists) {
      return this.processListTags(content);
    }
    return content;
  }

  /**
   * 处理列表标签
   */
  processListTags(content) {
    if (typeof content !== 'string') return content;
    
    return content
      .replace(/<ol[^>]*>/gi, '<ol style="padding-left: 20px;">')
      .replace(/<ul[^>]*>/gi, '<ul style="padding-left: 20px; list-style-type: disc;">');
  }

  /**
   * 后处理（子类可重写）
   */
  async postFillProcess(elements, data, results) {
    // 子类可以重写此方法执行平台特定的后处理
  }

  /**
   * 工具方法：延迟
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 工具方法：等待元素出现
   */
  async waitForElement(selector, maxWaitTime = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime >= maxWaitTime) {
          resolve(null);
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });
  }

  /**
   * 复制文章内容（各平台可重写此方法实现不同的复制逻辑）
   * 基类默认包含预设支持
   */
  async copyArticleContent(articleId) {
    try {
      console.log(`📋 ${this.displayName} 平台复制内容，文章ID:`, articleId);
      
      // 获取文章内容
      const response = await window.ZiliuApiService.articles.get(articleId, 'raw');
      if (!response.success) {
        throw new Error(response.error || '获取文章内容失败');
      }
      
      const articleData = response.data;
      if (!articleData.content) {
        throw new Error('文章内容为空');
      }

      // 使用原始正文内容，不包含标题
      let contentToCopy = articleData.content;

      // 获取当前选中的预设并包含预设内容
      const currentPreset = window.ZiliuApp?.getSelectedPreset?.();
      console.log(`📋 ${this.displayName} 复制：获取当前预设:`, currentPreset);

      if (currentPreset) {
        // 添加开头内容
        if (currentPreset.headerContent) {
          console.log(`📋 ${this.displayName} 复制：添加预设开头内容`);
          contentToCopy = currentPreset.headerContent + '\n\n' + contentToCopy;
        }

        // 添加结尾内容
        if (currentPreset.footerContent) {
          console.log(`📋 ${this.displayName} 复制：添加预设结尾内容`);
          contentToCopy += '\n\n' + currentPreset.footerContent;
        }
      }

      console.log(`📋 ${this.displayName} 复制：最终内容长度:`, contentToCopy.length);
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(contentToCopy);
      
      return {
        success: true,
        content: contentToCopy,
        format: 'markdown',
        message: '内容已复制到剪贴板（包含预设内容）！'
      };
    } catch (error) {
      console.error(`${this.displayName} 复制失败:`, error);
      return {
        success: false,
        error: error.message,
        message: '复制失败: ' + error.message
      };
    }
  }

  /**
   * 获取平台元数据
   */
  static get metadata() {
    return {
      version: '1.0.0',
      description: '所有平台插件的基类'
    };
  }
}

window.BasePlatformPlugin = BasePlatformPlugin;