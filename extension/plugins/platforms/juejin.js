/**
 * 掘金平台插件
 * 当前禁用填充功能，仅支持复制模式
 */
class JuejinPlatformPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
  }

  static get metadata() {
    return {
      version: '1.0.0',
      description: '掘金平台专用插件，当前禁用填充功能，仅支持复制'
    };
  }

  /**
   * 掘金特有的元素查找逻辑
   */
  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 查找标题输入框
    elements.elements.title = this.findElementFromSelectors([
      'input[placeholder*="请输入标题"]',
      '.title-input input',
      'input[class*="title"]'
    ]);

    // 查找内容编辑器 - 掘金使用bytemd编辑器
    elements.elements.content = this.findElementFromSelectors([
      '.bytemd-editor .CodeMirror',
      '.bytemd .CodeMirror',
      '.CodeMirror-code',
      '.editor-content textarea'
    ]);

    // 验证是否是掘金编辑器
    elements.isEditor = !!(elements.elements.title && elements.elements.content);

    console.log('🔍 掘金编辑器检测结果:', {
      title: !!elements.elements.title,
      content: !!elements.elements.content,
      contentType: this.getEditorType(elements.elements.content),
      isEditor: elements.isEditor,
      url: window.location.href
    });

    return elements;
  }

  /**
   * 获取编辑器类型
   */
  getEditorType(contentElement) {
    if (!contentElement) return 'unknown';
    
    if (contentElement.classList.contains('CodeMirror')) {
      return 'CodeMirror';
    } else if (contentElement.tagName === 'TEXTAREA') {
      return 'textarea';
    } else if (contentElement.contentEditable === 'true') {
      return 'contentEditable';
    }
    
    return 'unknown';
  }

  /**
   * 掘金平台特殊填充逻辑：只填充标题，不填充正文
   */
  async fillContent(data) {
    const elements = await this.findEditorElements(false);
    
    if (!elements.isEditor) {
      throw new Error(`当前页面不是${this.displayName}编辑器`);
    }

    console.log(`🚀 开始掘金特殊填充：仅填充标题`);
    const results = {};

    // 掘金特殊逻辑：只填充标题
    if (data.title && elements.elements.title) {
      console.log('📝 掘金平台：填充标题');
      results.title = await this.fillTitle(elements.elements.title, data.title);
    } else {
      console.warn('⚠️ 掘金平台：未找到标题输入框或标题数据');
      results.title = { success: false, error: '未找到标题输入框' };
    }

    // 不填充内容，提示用户使用复制功能
    if (data.content) {
      console.log('💡 掘金平台：内容请使用复制按钮获取');
      results.content = { 
        success: false, 
        reason: 'juejin_copy_only', 
        message: '掘金平台内容请使用"复制正文"按钮获取' 
      };
    }

    // 执行后处理
    await this.postFillProcess(elements.elements, data, results);

    console.log(`✅ 掘金特殊填充完成（仅标题）`);
    ZiliuEventBus.emit('platform:fillComplete', { 
      platform: this.id, 
      results,
      data,
      mode: 'title_only'
    });

    return results;
  }

  /**
   * 掘金内容填充（备用，当前禁用）
   */
  async fillContentEditor(contentElement, content, data) {
    console.log('📝 尝试填充掘金编辑器内容（当前禁用）');

    // 如果设置为仅复制模式
    if (this.specialHandling?.copyOnly) {
      console.log('ℹ️ 掘金平台仅支持复制模式');
      return { success: false, reason: 'copyOnly', message: '掘金平台请使用复制功能' };
    }

    const editorType = this.getEditorType(contentElement);
    
    try {
      switch (editorType) {
        case 'CodeMirror':
          return await this.fillCodeMirrorEditor(contentElement, content);
        
        case 'textarea':
          return await this.fillTextareaEditor(contentElement, content);
        
        default:
          return await super.fillContentEditor(contentElement, content, data);
      }
    } catch (error) {
      console.error(`掘金内容填充失败 [${editorType}]:`, error);
      throw error;
    }
  }

  /**
   * 填充CodeMirror编辑器（备用实现）
   */
  async fillCodeMirrorEditor(element, content) {
    console.log('📝 填充CodeMirror编辑器');

    try {
      // 尝试获取CodeMirror实例
      const cmInstance = element.CodeMirror;
      
      if (cmInstance) {
        // 使用CodeMirror API
        cmInstance.setValue(content);
        cmInstance.focus();
      } else {
        // 回退到DOM操作
        const textarea = element.querySelector('textarea');
        if (textarea) {
          await this.setInputValue(textarea, content);
        } else {
          throw new Error('无法找到CodeMirror的textarea');
        }
      }

      await this.delay(500);
      return { success: true, value: content, type: 'CodeMirror' };
    } catch (error) {
      console.error('CodeMirror填充失败:', error);
      throw error;
    }
  }

  /**
   * 填充Textarea编辑器
   */
  async fillTextareaEditor(element, content) {
    console.log('📝 填充Textarea编辑器');
    
    await this.setInputValue(element, content);
    await this.delay(300);
    
    return { success: true, value: content, type: 'textarea' };
  }

  /**
   * 掘金特有的标题填充
   */
  async fillTitle(titleElement, title) {
    console.log('📝 填充掘金标题:', title);

    try {
      // 确保元素获得焦点
      titleElement.focus();
      titleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      await this.delay(200);

      // 清空并设置新标题
      titleElement.value = '';
      await this.delay(100);
      
      titleElement.value = title;

      // 触发掘金需要的事件
      const events = ['input', 'change', 'blur', 'keyup'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        titleElement.dispatchEvent(event);
        await this.delay(50);
      }

      return { success: true, value: title };
    } catch (error) {
      console.error('掘金标题填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 掘金平台的后处理
   */
  async postFillProcess(elements, data, results) {
    console.log('🔧 掘金平台后处理...');
    
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

    // 发送掘金特有的事件
    ZiliuEventBus.emit('juejin:fillComplete', {
      results,
      mode: 'title_only'
    });

    await this.delay(300);
  }

  /**
   * 掘金平台的复制内容处理
   */
  async prepareContentForCopy(content, options = {}) {
    console.log('📋 准备掘金平台复制内容');
    
    // 掘金支持Markdown，确保内容格式正确
    if (typeof content === 'string' && options.format === 'markdown') {
      return content;
    }
    
    // 如果是HTML，可以转换为Markdown
    if (typeof content === 'string' && content.includes('<')) {
      return this.htmlToMarkdown(content);
    }
    
    return content;
  }

  /**
   * 简单的HTML到Markdown转换
   */
  htmlToMarkdown(html) {
    if (typeof html !== 'string') return html;
    
    return html
      // 标题
      .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, text) => {
        return '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
      })
      // 段落
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // 换行
      .replace(/<br[^>]*>/gi, '\n')
      // 强调
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      // 斜体
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // 链接
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // 列表
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      // 代码
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n')
      // 清理HTML标签
      .replace(/<[^>]+>/g, '')
      // 清理多余空行
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 验证编辑器元素
   */
  validateEditorElements(elements) {
    // 掘金编辑器需要标题输入框
    // 内容编辑器可能动态加载，所以稍微宽松一些
    return !!(elements.title);
  }
}

// 配置驱动的自动注册
if (window.ZiliuPlatformRegistry && window.ZiliuPluginConfig) {
  const juejinConfig = window.ZiliuPluginConfig.platforms.find(p => p.id === 'juejin');
  
  if (juejinConfig && juejinConfig.enabled) {
    const shouldRegister = juejinConfig.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(window.location.href);
      } catch (e) {
        return false;
      }
    });

    if (shouldRegister) {
      console.log('🔧 注册掘金专用插件（配置驱动）');
      const juejinPlugin = new JuejinPlatformPlugin(juejinConfig);
      ZiliuPlatformRegistry.register(juejinPlugin);
    }
  }
}

window.JuejinPlatformPlugin = JuejinPlatformPlugin;