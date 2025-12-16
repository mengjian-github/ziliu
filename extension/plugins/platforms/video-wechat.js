/**
 * 微信视频号平台插件
 * 专注于数据库中的视频字段填充
 */
class VideoWechatPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'video';
  }

  /**
   * 查找编辑器元素 - 基于实际DOM结构
   */
  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 视频描述编辑区域 - 点击"添加描述"后出现的编辑器
    elements.elements.description = this.findDescriptionEditor();
    
    // 短标题输入框 - 尝试多种选择器
    console.log('🔍 开始查找短标题输入框...');
    
    const titleSelectors = [
      'input[placeholder*="概括视频主要内容"]',
      'textbox[placeholder*="概括视频主要内容"]',
      'input[placeholder*="字数建议6-16个字符"]',
      '[placeholder*="概括视频主要内容"]'
    ];
    
    for (const selector of titleSelectors) {
      const foundElements = this.querySelectorAllWithShadow(selector);
      console.log(`🔍 标题选择器 "${selector}" 找到 ${foundElements.length} 个元素`);
      if (foundElements.length > 0) {
        elements.elements.title = foundElements[0];
        console.log('🎯 找到短标题输入框:', {
          tagName: foundElements[0].tagName,
          placeholder: foundElements[0].placeholder,
          type: foundElements[0].type
        });
        break;
      }
    }
    
    if (!elements.elements.title) {
      console.warn('⚠️ 未找到短标题输入框');
    }
    
    
    // 操作按钮
    elements.elements.saveButton = this.findButtonByText('保存草稿');
    elements.elements.publishButton = this.findButtonByText('发表');

    // 检查是否是编辑器页面
    elements.isEditor = this.validateVideoEditorElements(elements.elements);

    return elements;
  }

  /**
   * 查找视频描述编辑器
   */
  findDescriptionEditor() {
    console.log('🔍 开始查找视频描述编辑器...');
    
    // 可能的选择器组合
    const selectors = [
      '.input-editor',
      '[contenteditable="true"]',
      '.editor-content',
      'div[role="textbox"]',
      'textarea',
      // 兜底：通过文本查找描述区域附近的编辑器
      '.video-desc-editor'
    ];

    console.log('🔍 尝试查找选择器:', selectors);
    
    for (const selector of selectors) {
      const elements = this.querySelectorAllWithShadow(selector);
      console.log(`🔍 选择器 "${selector}" 找到 ${elements.length} 个元素`);
      
      if (elements.length > 0) {
        const element = elements[0]; // 取第一个
        console.log('🎯 找到视频描述编辑器:', {
          selector,
          tagName: element.tagName,
          className: element.className,
          visible: element.offsetParent !== null,
          contentEditable: element.contentEditable
        });
        return element;
      }
    }

    console.log('🔍 通过选择器未找到编辑器，尝试通过"添加描述"查找...');
    
    // 如果没找到，尝试通过"添加描述"区域查找
    const allElements = this.querySelectorAllWithShadow('*');
    const addDescCandidates = Array.from(allElements).filter(el => 
      el.textContent && (el.textContent.includes('添加描述') || el.textContent.trim() === '添加描述')
    );
    
    console.log('🔍 "添加描述"候选元素数量:', addDescCandidates.length);
    addDescCandidates.forEach((el, index) => {
      console.log(`🔍 候选元素${index}:`, {
        tagName: el.tagName,
        textContent: el.textContent.trim(),
        className: el.className
      });
    });
    
    const addDescArea = addDescCandidates[0];
    console.log('🔍 "添加描述"区域查找结果:', !!addDescArea);
    
    if (addDescArea) {
      // 查找附近的可编辑元素
      const parent = addDescArea.closest('div');
      if (parent) {
        const editableChild = parent.querySelector('[contenteditable="true"], textarea, input');
        if (editableChild) {
          console.log('🎯 通过"添加描述"找到编辑器:', {
            tagName: editableChild.tagName,
            className: editableChild.className
          });
          return editableChild;
        }
      }
    }

    console.warn('⚠️ 未找到视频描述编辑器');
    
    // 页面分析：显示页面上的一些关键元素
    this.analyzePageElements();
    
    return null;
  }

  /**
   * 分析页面元素 - 调试用（支持Shadow DOM）
   */
  analyzePageElements() {
    console.log('🔍 页面元素分析:');
    console.log('🔍 页面URL:', window.location.href);
    console.log('🔍 页面标题:', document.title);
    
    // 首先检查是否有shadow root
    const shadowHosts = this.findShadowHosts();
    console.log(`🔍 找到 ${shadowHosts.length} 个Shadow Host:`);
    shadowHosts.forEach((host, index) => {
      console.log(`  Shadow Host ${index}:`, {
        tagName: host.tagName,
        className: host.className,
        id: host.id
      });
    });
    
    // 查找所有可能的表单元素（包括shadow DOM）
    const allInputs = this.querySelectorAllWithShadow('input, textbox, textarea, [contenteditable]');
    console.log(`📋 找到 ${allInputs.length} 个可编辑元素（包括Shadow DOM）:`);
    allInputs.forEach((el, index) => {
      if (index < 10) { // 只显示前10个
        console.log(`  Element ${index}:`, {
          tagName: el.tagName,
          type: el.type || 'N/A',
          placeholder: el.placeholder || 'N/A',
          className: el.className,
          visible: el.offsetParent !== null,
          contentEditable: el.contentEditable || 'N/A'
        });
      }
    });
    
    // 查找所有button元素
    const buttons = document.querySelectorAll('button');
    console.log(`📋 找到 ${buttons.length} 个按钮:`);
    buttons.forEach((btn, index) => {
      console.log(`  Button ${index}:`, {
        text: btn.textContent?.trim().substring(0, 20) || '',
        className: btn.className
      });
    });
    
    // 查找包含关键词的文本（包括Shadow DOM）
    const allElements = this.querySelectorAllWithShadow('*');
    const keywordElements = Array.from(allElements).filter(el => {
      const text = el.textContent;
      return text && (
        text.includes('概括视频主要内容') ||
        text.includes('添加描述') ||
        text.includes('视频描述') ||
        text.includes('短标题') ||
        text.includes('字数建议') ||
        text.includes('发表') ||
        text.includes('保存草稿')
      );
    });
    
    console.log(`📋 找到 ${keywordElements.length} 个包含关键词的元素:`);
    keywordElements.forEach((el, index) => {
      if (index < 10) { // 只显示前10个，避免日志过多
        console.log(`  关键词元素 ${index}:`, {
          tagName: el.tagName,
          textContent: el.textContent.trim().substring(0, 50),
          className: el.className
        });
      }
    });
    
    // 分析DOM结构深度
    const depth = this.getMaxDOMDepth();
    console.log('📋 DOM最大深度:', depth);
  }
  
  /**
   * 获取DOM最大深度 - 帮助判断页面是否完全加载
   */
  getMaxDOMDepth() {
    function getDepth(element, currentDepth = 0) {
      if (!element.children || element.children.length === 0) {
        return currentDepth;
      }
      let maxDepth = currentDepth;
      for (let child of element.children) {
        const childDepth = getDepth(child, currentDepth + 1);
        if (childDepth > maxDepth) {
          maxDepth = childDepth;
        }
      }
      return maxDepth;
    }
    return getDepth(document.body);
  }

  /**
   * 查找所有Shadow Host
   */
  findShadowHosts() {
    const shadowHosts = [];
    
    function findShadowsRecursively(root) {
      const elements = root.querySelectorAll('*');
      elements.forEach(el => {
        if (el.shadowRoot) {
          shadowHosts.push(el);
          // 递归查找嵌套的shadow DOM
          findShadowsRecursively(el.shadowRoot);
        }
      });
    }
    
    findShadowsRecursively(document);
    return shadowHosts;
  }

  /**
   * 在包括Shadow DOM的整个页面中查找元素
   */
  querySelectorAllWithShadow(selector) {
    const results = [];
    
    function searchInRoot(root) {
      // 在当前root中查找
      const elements = root.querySelectorAll(selector);
      results.push(...elements);
      
      // 查找所有有shadowRoot的元素
      const shadowHosts = root.querySelectorAll('*');
      shadowHosts.forEach(host => {
        if (host.shadowRoot) {
          searchInRoot(host.shadowRoot);
        }
      });
    }
    
    searchInRoot(document);
    return results;
  }

  /**
   * 在包括Shadow DOM的整个页面中查找单个元素
   */
  querySelectorWithShadow(selector) {
    const results = this.querySelectorAllWithShadow(selector);
    return results[0] || null;
  }

  /**
   * 通过文本查找按钮
   */
  findButtonByText(text) {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent && btn.textContent.includes(text));
  }

  /**
   * 验证视频编辑器元素
   */
  validateVideoEditorElements(elements) {
    // 至少要有标题输入框或描述编辑器
    return !!(elements.title || elements.description);
  }

  /**
   * 填充视频内容 - 基于数据库字段
   */
  async fillContent(data) {
    console.log('🎬 开始填充微信视频号内容', data);
    
    // 等待页面完全加载 - 添加重试机制
    let elements = this.findEditorElements(false);
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!elements.isEditor && retryCount < maxRetries) {
      retryCount++;
      console.log(`🔄 第 ${retryCount} 次重试查找编辑器元素，等待 2 秒...`);
      await this.delay(2000);
      elements = this.findEditorElements(false);
    }
    console.log('🔍 找到的编辑器元素:', {
      isEditor: elements.isEditor,
      hasTitle: !!elements.elements.title,
      hasDescription: !!elements.elements.description,
      titleElement: elements.elements.title ? {
        tagName: elements.elements.title.tagName,
        placeholder: elements.elements.title.placeholder,
        visible: elements.elements.title.offsetParent !== null
      } : null,
      descriptionElement: elements.elements.description ? {
        tagName: elements.elements.description.tagName,
        className: elements.elements.description.className,
        contentEditable: elements.elements.description.contentEditable,
        visible: elements.elements.description.offsetParent !== null
      } : null
    });
    
    if (!elements.isEditor) {
      throw new Error('当前页面不是微信视频号编辑器');
    }

    const results = {};
    // 直接使用AI转换后的视频数据，不做额外转换
    const videoData = {
      videoTitle: data.videoTitle || data.title,
      videoDescription: data.videoDescription || data.content,
      tags: data.tags || []
    };
    
    console.log('📊 数据分析:', {
      原始数据: {
        hasTitle: !!data.title,
        hasContent: !!data.content,
        hasVideoTitle: !!data.videoTitle,
        hasVideoDescription: !!data.videoDescription,
        hasTags: !!data.tags
      },
      使用的视频数据: {
        hasVideoTitle: !!videoData.videoTitle,
        hasVideoDescription: !!videoData.videoDescription,
        hasTags: !!videoData.tags,
        videoTitleLength: videoData.videoTitle?.length || 0,
        videoDescriptionLength: videoData.videoDescription?.length || 0
      }
    });

    try {
      // 1. 填充视频标题 (videoTitle -> 短标题)
      if (videoData.videoTitle && elements.elements.title) {
        console.log('🏷️ 填充短标题:', videoData.videoTitle);
        results.title = await this.fillVideoTitle(elements.elements.title, videoData.videoTitle);
        await this.delay(300);
      }

      // 2. 填充视频描述 (videoDescription -> 视频描述)
      if (videoData.videoDescription && elements.elements.description) {
        console.log('📝 填充视频描述:', videoData.videoDescription);
        results.description = await this.fillVideoDescription(elements.elements.description, videoData.videoDescription);
        await this.delay(500);
      } else if (videoData.videoDescription) {
        // 如果没有找到描述编辑器，尝试点击激活
        console.log('🔄 尝试激活描述编辑器，因为数据中有videoDescription但未找到编辑器元素');
        const activateResult = await this.activateDescriptionEditor();
        console.log('🔄 激活结果:', activateResult);
        await this.delay(1000);
        
        // 重新查找
        console.log('🔍 重新查找描述编辑器元素...');
        const newElements = this.findEditorElements(false);
        console.log('🔍 重新查找结果:', {
          hasDescription: !!newElements.elements.description,
          descriptionElement: newElements.elements.description ? {
            tagName: newElements.elements.description.tagName,
            className: newElements.elements.description.className,
            visible: newElements.elements.description.offsetParent !== null
          } : null
        });
        
        if (newElements.elements.description) {
          console.log('✅ 找到描述编辑器，开始填充');
          results.description = await this.fillVideoDescription(newElements.elements.description, videoData.videoDescription);
        } else {
          console.warn('⚠️ 激活后仍未找到描述编辑器');
        }
      }

      // 3. 处理标签 (tags -> #话题)
      if (videoData.tags) {
        console.log('🏷️ 处理标签:', videoData.tags);
        results.tags = await this.handleTags(videoData.tags);
      }

      console.log('✅ 微信视频号内容填充完成', results);
      
      return results;

    } catch (error) {
      console.error('❌ 微信视频号内容填充失败:', error);
      throw error;
    }
  }


  /**
   * 激活描述编辑器
   */
  async activateDescriptionEditor() {
    console.log('🔍 开始查找"添加描述"区域...');
    
    // 查找"添加描述"区域并点击
    const addDescArea = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent && el.textContent.includes('添加描述')
    );
    
    console.log('🔍 查找"添加描述"结果:', {
      found: !!addDescArea,
      element: addDescArea ? {
        tagName: addDescArea.tagName,
        className: addDescArea.className,
        textContent: addDescArea.textContent,
        hasClickMethod: typeof addDescArea.click === 'function'
      } : null
    });
    
    if (addDescArea && addDescArea.click) {
      console.log('🖱️ 点击激活描述编辑器');
      addDescArea.click();
      await this.delay(500);
      return { success: true, message: '已点击激活' };
    } else {
      console.warn('⚠️ 未找到"添加描述"区域或无法点击');
      return { success: false, message: '未找到可点击的"添加描述"区域' };
    }
  }

  /**
   * 填充视频标题 (短标题)
   */
  async fillVideoTitle(element, title) {
    try {
      // 直接使用AI转换后的标题，不再做额外处理
      console.log(`📝 填充AI生成的视频标题: ${title}`);
      
      await this.setInputValue(element, title);
      return { success: true, value: title };
    } catch (error) {
      console.error('短标题填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 填充视频描述
   */
  async fillVideoDescription(element, description) {
    try {
      console.log('📝 开始填充描述到元素:', element.tagName, element.className);
      
      // 确保元素获得焦点
      element.focus();
      await this.delay(200);

      if (element.contentEditable === 'true' || element.isContentEditable) {
        // 可编辑div
        console.log('📝 使用contentEditable填充');
        element.innerHTML = '';
        element.textContent = description;
        
        // 触发输入事件
        const events = ['input', 'change', 'blur'];
        for (const eventType of events) {
          const event = new Event(eventType, { bubbles: true });
          element.dispatchEvent(event);
          await this.delay(50);
        }
      } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        // 输入框
        console.log('📝 使用input/textarea填充');
        await this.setInputValue(element, description);
      } else {
        // 尝试直接设置文本
        console.log('📝 使用通用方法填充');
        element.textContent = description;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { success: true, value: description };
    } catch (error) {
      console.error('视频描述填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理标签 - 将标签添加到描述中
   */
  async handleTags(tags) {
    try {
      if (!Array.isArray(tags)) {
        tags = typeof tags === 'string' ? JSON.parse(tags) : [];
      }

      const hashTags = tags.map(tag => `#${tag}`).join(' ');
      console.log('🏷️ 生成标签:', hashTags);

      // 如果描述框存在，在描述末尾添加标签
      const elements = this.findEditorElements(false);
      if (elements.elements.description) {
        const currentContent = elements.elements.description.textContent || 
                              elements.elements.description.innerHTML || 
                              elements.elements.description.value || '';
        
        const newContent = currentContent + (currentContent ? '\n\n' : '') + hashTags;
        await this.fillVideoDescription(elements.elements.description, newContent);
      }

      return { success: true, value: hashTags };
    } catch (error) {
      console.error('标签处理失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 复制视频内容 - 重写基类方法
   */
  async copyArticleContent(articleId) {
    try {
      console.log('📋 微信视频号平台复制内容，文章ID:', articleId);
      
      // 获取文章内容
      const response = await window.ZiliuApiService.articles.get(articleId, 'raw');
      if (!response.success) {
        throw new Error(response.error || '获取文章内容失败');
      }
      
      const articleData = response.data;
      
      // 尝试获取已生成的视频内容
      const videoResponse = await window.ZiliuApiService.get(`/api/video/${articleId}/video_wechat`);
      let contentToCopy = '';

      if (videoResponse?.success && videoResponse.data) {
        // 使用已生成的视频内容
        const videoData = videoResponse.data;
        contentToCopy = this.formatVideoContentForCopy(videoData);
      } else {
        // 简单处理文章内容
        contentToCopy = this.generateSimpleVideoContent(articleData);
      }

      // 应用预设内容
      const currentPreset = window.ZiliuApp?.getSelectedPreset?.();
      if (currentPreset) {
        if (currentPreset.headerContent) {
          contentToCopy = currentPreset.headerContent + '\n\n' + contentToCopy;
        }
        if (currentPreset.footerContent) {
          contentToCopy += '\n\n' + currentPreset.footerContent;
        }
      }

      console.log('📋 微信视频号复制：最终内容长度:', contentToCopy.length);
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(contentToCopy);
      
      return {
        success: true,
        content: contentToCopy,
        format: 'text',
        message: '视频内容已复制到剪贴板！'
      };
    } catch (error) {
      console.error('微信视频号复制失败:', error);
      return {
        success: false,
        error: error.message,
        message: '复制失败: ' + error.message
      };
    }
  }

  /**
   * 格式化视频内容用于复制
   */
  formatVideoContentForCopy(videoData) {
    let content = '';
    
    if (videoData.videoDescription) {
      content += videoData.videoDescription;
    }
    
    if (videoData.tags) {
      const tags = Array.isArray(videoData.tags) ? videoData.tags : JSON.parse(videoData.tags || '[]');
      if (tags.length > 0) {
        const hashTags = tags.map(tag => `#${tag}`).join(' ');
        content += '\n\n' + hashTags;
      }
    }
    
    return content;
  }

  /**
   * 生成简单的视频内容
   */
  generateSimpleVideoContent(articleData) {
    // 移除HTML标签
    const plainText = articleData.content.replace(/<[^>]*>/g, '');
    
    // 提取前200个字符作为描述
    let description = plainText.substring(0, 200);
    
    // 在句号处截断，保证完整性
    const lastPeriod = description.lastIndexOf('。');
    if (lastPeriod > 100) {
      description = description.substring(0, lastPeriod + 1);
    }
    
    return description;
  }

  /**
   * 获取平台元数据
   */
  static get metadata() {
    return {
      version: '1.0.0',
      description: '微信视频号平台插件',
      supportedFields: ['videoTitle', 'videoDescription', 'tags'],
      supportedFeatures: ['shortTitle', 'description', 'hashtags']
    };
  }
}

// 自动注册插件（如果平台配置存在）
if (typeof ZiliuPlatformRegistry !== 'undefined' && window.ZiliuPluginConfig) {
  const videoWechatConfig = window.ZiliuPluginConfig.platforms?.find(p => p.id === 'video_wechat');
  if (videoWechatConfig) {
    // 检查是否应该在当前页面注册
    const currentUrl = window.location.href;
    const shouldRegister = videoWechatConfig.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern
          .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
          .replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(currentUrl);
      } catch (error) {
        console.warn('URL模式匹配失败:', { pattern, error });
        return false;
      }
    });

    if (shouldRegister) {
      console.log('🔧 注册微信视频号专用插件（配置驱动）');
      const videoWechatPlugin = new VideoWechatPlugin(videoWechatConfig);
      ZiliuPlatformRegistry.register(videoWechatPlugin);
    }
  }
}

window.VideoWechatPlugin = VideoWechatPlugin;