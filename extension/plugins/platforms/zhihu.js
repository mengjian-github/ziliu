/**
 * 知乎平台插件
 * 支持智能等待和编辑器检测
 */
class ZhihuPlatformPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.waitAttempts = 0;
    this.maxWaitAttempts = 20;
  }

  static get metadata() {
    return {
      version: '1.0.0',
      description: '知乎平台专用插件，支持智能编辑器检测和标题填充'
    };
  }

  /**
   * 知乎特有的元素查找逻辑（参考legacy版本的智能查找）
   */
  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 检查是否是知乎编辑器页面
    const isZhihuEditor = this.urlPatterns.some(pattern => this.matchUrl(window.location.href, pattern));
    
    if (isZhihuEditor) {
      // 智能查找标题输入框：查找所有可编辑元素，按位置排序选择最上方的
      const allEditableElements = document.querySelectorAll('div[contenteditable="true"], input[type="text"], textarea');
      
      // 按照在页面中的垂直位置排序
      const sortedElements = Array.from(allEditableElements).sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });

      // 查找标题输入框：排除插件自己的输入框，选择第一个（最上方的）
      elements.elements.title = sortedElements.find(element =>
        !element.id.includes('ziliu') &&
        !element.className.includes('ziliu') &&
        element.offsetParent !== null && // 确保可见
        element.getBoundingClientRect().height < 200 // 标题框高度通常较小
      );

      // 如果智能查找失败，降级到固定选择器
      if (!elements.elements.title) {
        elements.elements.title = this.findElementFromSelectors([
          '.WriteIndex-titleInput input',
          'input[placeholder*="请输入标题"]',
          '.Input-wrapper input[placeholder*="标题"]'
        ]);
      }

      // 查找内容编辑器
      elements.elements.content = this.findElementFromSelectors([
        '.public-DraftEditor-content[contenteditable="true"]',
        '.DraftEditor-editorContainer [contenteditable="true"]',
        '.notranslate[contenteditable="true"]',
        'div[role="textbox"]',
        '.DraftEditor-root .public-DraftEditor-content'
      ]);
    }

    // 验证是否是知乎编辑器
    elements.isEditor = isZhihuEditor && !!(elements.elements.title || elements.elements.content);

    console.log('🔍 知乎编辑器检测结果:', {
      url: window.location.href,
      isZhihuEditor,
      title: !!elements.elements.title,
      content: !!elements.elements.content,
      isEditor: elements.isEditor,
      attempt: this.waitAttempts
    });

    return elements;
  }

  /**
   * 智能等待编辑器加载
   * 知乎编辑器经常需要等待动态加载
   */
  async waitForEditor(maxWaitTime = 10000) {
    console.log('⏳ 知乎编辑器智能等待开始...');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkEditor = () => {
        this.waitAttempts++;
        const elements = this._findElements();
        
        // 检查是否找到了可用的编辑器
        if (elements.isEditor && this.isEditorReady(elements.elements)) {
          console.log(`✅ 知乎编辑器就绪 (尝试 ${this.waitAttempts} 次)`);
          resolve(elements);
          return;
        }

        // 检查超时
        if (Date.now() - startTime >= maxWaitTime || this.waitAttempts >= this.maxWaitAttempts) {
          console.warn(`⏰ 知乎编辑器等待超时 (尝试 ${this.waitAttempts} 次)`);
          resolve(elements); // 即使超时也返回当前结果
          return;
        }

        // 继续等待
        setTimeout(checkEditor, 500);
      };

      checkEditor();
    });
  }

  /**
   * 检查编辑器是否真正准备就绪
   */
  isEditorReady(elements) {
    // 标题输入框存在且可见
    const titleReady = elements.title && 
                      elements.title.offsetParent !== null &&
                      !elements.title.disabled;

    // 内容编辑器存在且可编辑
    const contentReady = elements.content && 
                        elements.content.contentEditable === 'true' &&
                        elements.content.offsetParent !== null;

    return titleReady && contentReady;
  }

  /**
   * 知乎特殊的填充逻辑：只填充标题，不填充正文
   */
  async fillContent(data) {
    const elements = await this.findEditorElements(false);
    
    if (!elements.isEditor) {
      throw new Error(`当前页面不是${this.displayName}编辑器`);
    }

    console.log(`🚀 开始知乎特殊填充：仅填充标题`);
    const results = {};

    // 知乎特殊逻辑：只填充标题
    if (data.title && elements.elements.title) {
      console.log('📝 知乎平台：填充标题');
      results.title = await this.fillTitle(elements.elements.title, data.title);
    } else {
      console.warn('⚠️ 知乎平台：未找到标题输入框或标题数据');
      results.title = { success: false, error: '未找到标题输入框' };
    }

    // 不填充内容，提示用户使用复制功能
    if (data.content) {
      console.log('💡 知乎平台：内容请使用复制按钮获取');
      results.content = { 
        success: false, 
        reason: 'zhihu_copy_only', 
        message: '知乎平台内容请使用"复制正文"按钮获取' 
      };
    }

    // 执行后处理
    await this.postFillProcess(elements.elements, data, results);

    console.log(`✅ 知乎特殊填充完成（仅标题）`);
    ZiliuEventBus.emit('platform:fillComplete', { 
      platform: this.id, 
      results,
      data,
      mode: 'title_only'
    });

    return results;
  }

  /**
   * 知乎特有的内容填充逻辑（备用，当前不使用）
   */
  async fillContentEditor(contentElement, content, data) {
    console.log('📝 填充知乎编辑器内容（备用方法）');

    try {
      // 知乎编辑器使用Draft.js，需要特殊处理
      await this.fillDraftJsEditor(contentElement, content);
      
      return { success: true, value: content, type: 'DraftJS' };
    } catch (error) {
      console.error('知乎内容填充失败:', error);
      
      // 回退到基础方法
      return await super.fillContentEditor(contentElement, content, data);
    }
  }

  /**
   * 填充Draft.js编辑器
   */
  async fillDraftJsEditor(element, content) {
    // 首先尝试获取焦点
    element.focus();
    await this.delay(200);

    // 清空现有内容
    await this.clearDraftEditor(element);
    
    // 设置新内容
    if (typeof content === 'string') {
      // 如果是HTML内容，先转换为纯文本
      const textContent = this.htmlToText(content);
      await this.insertTextToDraftEditor(element, textContent);
    } else {
      await this.insertTextToDraftEditor(element, content);
    }

    await this.delay(500);
  }

  /**
   * 清空Draft.js编辑器
   */
  async clearDraftEditor(element) {
    try {
      // 选择所有内容
      element.focus();
      
      // 使用快捷键选择全部
      const selectAllEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        metaKey: true, // Mac支持
        bubbles: true
      });
      element.dispatchEvent(selectAllEvent);
      
      await this.delay(100);

      // 删除选中内容
      const deleteEvent = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      element.dispatchEvent(deleteEvent);
      
      await this.delay(100);
    } catch (error) {
      console.warn('清空Draft编辑器失败:', error);
    }
  }

  /**
   * 向Draft.js编辑器插入文本
   */
  async insertTextToDraftEditor(element, text) {
    try {
      // 模拟粘贴事件
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', text);
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: clipboardData,
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(pasteEvent);
      await this.delay(300);
      
      // 如果粘贴失败，尝试逐字符输入
      if (element.textContent.trim() === '') {
        await this.typeTextSlowly(element, text);
      }
      
    } catch (error) {
      console.warn('Draft编辑器插入文本失败，尝试备用方案:', error);
      await this.typeTextSlowly(element, text);
    }
  }

  /**
   * 逐字符缓慢输入文本（最后的备用方案）
   */
  async typeTextSlowly(element, text, delay = 50) {
    element.focus();
    
    for (const char of text) {
      const inputEvent = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: char,
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(inputEvent);
      
      // 如果beforeinput被阻止，直接修改内容
      if (inputEvent.defaultPrevented) {
        element.textContent += char;
      }
      
      const afterInputEvent = new InputEvent('input', {
        inputType: 'insertText',
        data: char,
        bubbles: true
      });
      element.dispatchEvent(afterInputEvent);
      
      await this.delay(delay);
    }
  }

  /**
   * HTML转纯文本
   */
  htmlToText(html) {
    if (typeof html !== 'string') return html;
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * 知乎平台的特殊标题填充
   */
  async fillTitle(titleElement, title) {
    console.log('📝 填充知乎标题:', title);

    try {
      // 确保元素可见和可编辑
      titleElement.focus();
      titleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      await this.delay(200);

      // 清空并设置新标题
      titleElement.value = '';
      titleElement.value = title;

      // 触发必要的事件
      const events = ['input', 'change', 'blur'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        titleElement.dispatchEvent(event);
        await this.delay(100);
      }

      // 验证标题是否设置成功
      if (titleElement.value !== title) {
        console.warn('知乎标题设置可能失败，尝试重新设置');
        
        // 重试一次
        await this.delay(500);
        titleElement.value = title;
        titleElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { success: true, value: title };
    } catch (error) {
      console.error('知乎标题填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 知乎平台的后处理
   */
  async postFillProcess(elements, data, results) {
    console.log('🔧 知乎平台后处理...');
    
    // 如果标题填充成功，确保光标移到内容区域
    if (results.title?.success && elements.content) {
      try {
        await this.delay(500);
        elements.content.focus();
        console.log('✅ 光标已移至内容编辑器');
      } catch (e) {
        console.warn('移动光标失败:', e);
      }
    }

    // 发送知乎特有的事件
    ZiliuEventBus.emit('zhihu:fillComplete', {
      results,
      waitAttempts: this.waitAttempts
    });

    // 重置等待计数
    this.waitAttempts = 0;
  }

  /**
   * 重写findEditorElements以支持智能等待
   */
  async findEditorElements(useCache = true) {
    // 知乎编辑器经常需要等待，即使不使用缓存也可能需要智能等待
    // 但要避免无限等待，设置合理的条件
    const needsWait = this.specialHandling?.waitForEditor && 
                     (!this.lastSuccessfulCheck || Date.now() - this.lastSuccessfulCheck > 10000);
    
    if (needsWait) {
      const result = await this.waitForEditor();
      
      // 如果智能等待成功找到编辑器，记录成功时间并返回
      if (result.isEditor) {
        this.lastSuccessfulCheck = Date.now();
        return result;
      }
    }
    
    // 调用父类方法
    const result = super.findEditorElements(useCache);
    
    // 如果父类方法成功，也记录成功时间
    if (result.isEditor) {
      this.lastSuccessfulCheck = Date.now();
    }
    
    return result;
  }
}

// 配置驱动的自动注册
if (window.ZiliuPlatformRegistry && window.ZiliuPluginConfig) {
  const zhihuConfig = window.ZiliuPluginConfig.platforms.find(p => p.id === 'zhihu');
  
  if (zhihuConfig && zhihuConfig.enabled) {
    const shouldRegister = zhihuConfig.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(window.location.href);
      } catch (e) {
        return false;
      }
    });

    if (shouldRegister) {
      console.log('🔧 注册知乎专用插件（配置驱动）');
      // 用config创建插件实例并注册
      const zhihuPlugin = new ZhihuPlatformPlugin(zhihuConfig);
      ZiliuPlatformRegistry.register(zhihuPlugin);
    }
  }
}

window.ZhihuPlatformPlugin = ZhihuPlatformPlugin;