/**
 * 抖音平台插件
 * 支持抖音创作者中心的视频发布页面
 */
class DouyinPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'video';
    console.log('🎵 抖音插件初始化完成');
  }

  /**
   * 检测是否为抖音平台
   */
  isPlatformMatch() {
    const url = window.location.href;
    const isMatch = url.includes('creator.douyin.com/creator-micro/content/post/video');
    console.log('🎵 抖音平台检测:', { url, isMatch });
    return isMatch;
  }

  /**
   * 获取页面元素选择器
   */
  getSelectors() {
    return {
      title: [
        'input[placeholder*="填写作品标题"]',
        'textbox[placeholder*="填写作品标题"]',
        'input[placeholder*="标题"]'
      ],
      content: [
        '[contenteditable="true"]:not([placeholder])', // 避免选到标题输入框
        '.text-editor',
        '.content-editor',
        '[data-testid="content-editor"]'
      ],
      tags: [
        'input[placeholder*="添加话题"]',
        '.topic-input input',
        'input[placeholder*="话题"]'
      ],
      // 作品简介区域（需要点击激活）
      introductionArea: '.css-1h5o8gt', // 可能需要根据实际页面结构调整
      addTopicButton: '[data-testid="add-topic"]'
    };
  }

  /**
   * 查找所有可能的编辑器元素
   */
  findElements() {
    const selectors = this.getSelectors();
    const elements = {};

    // 查找标题输入框
    for (const selector of selectors.title) {
      const element = document.querySelector(selector);
      if (element) {
        elements.title = element;
        console.log('🎯 找到抖音标题输入框:', selector);
        break;
      }
    }

    // 查找内容编辑器（可能需要激活）
    for (const selector of selectors.content) {
      const element = document.querySelector(selector);
      if (element) {
        elements.content = element;
        console.log('🎯 找到抖音内容编辑器:', selector);
        break;
      }
    }

    // 查找话题输入框
    for (const selector of selectors.tags) {
      const element = document.querySelector(selector);
      if (element) {
        elements.tags = element;
        console.log('🎯 找到抖音话题输入框:', selector);
        break;
      }
    }

    return elements;
  }

  /**
   * 激活编辑器（点击作品简介区域）
   */
  activateEditor() {
    try {
      // 查找"添加作品简介"文本或相关区域
      const introText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('添加作品简介')
      );
      
      if (introText) {
        console.log('🎵 点击激活作品简介编辑器');
        introText.click();
        return true;
      }

      // 尝试查找可编辑区域
      const editableArea = document.querySelector('[contenteditable="true"]');
      if (editableArea && !editableArea.querySelector('input')) {
        console.log('🎵 点击激活可编辑区域');
        editableArea.click();
        return true;
      }

      console.log('⚠️ 未找到可激活的编辑器区域');
      return false;
    } catch (error) {
      console.error('❌ 激活编辑器失败:', error);
      return false;
    }
  }

  /**
   * 填充内容到抖音编辑器
   */
  async fillContent(data) {
    console.log('🎵 开始填充抖音内容:', data);
    
    // 打印数据结构以调试
    console.log('📊 数据分析:', {
      原始数据: {
        hasTitle: !!data.title,
        hasContent: !!data.content,
        hasVideoTitle: !!data.videoTitle,
        hasVideoDescription: !!data.videoDescription,
        hasTags: !!data.tags
      }
    });

    try {
      const elements = this.findElements();
      let fillCount = 0;
      const results = {};

      // 直接使用AI转换后的视频数据，如果没有则回退到原始数据
      const videoTitle = data.videoTitle || data.title;
      const videoDescription = data.videoDescription || data.content;
      const tags = data.tags || [];

      console.log('🎵 使用的视频数据:', {
        videoTitle,
        videoDescription: videoDescription?.substring(0, 100) + '...',
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags
      });

      // 填充标题
      if (elements.title && videoTitle) {
        // 确保标题长度符合抖音要求（1-30字符）
        let processedTitle = videoTitle.toString();
        if (processedTitle.length > 30) {
          processedTitle = processedTitle.substring(0, 30);
          console.log('⚠️ 标题超长，已截取到30字符');
        }
        
        results.title = await this.fillVideoTitle(elements.title, processedTitle);
        if (results.title.success) {
          fillCount++;
          console.log('✅ 抖音标题填充完成');
        }
      }

      // 激活并填充内容编辑器
      if (videoDescription) {
        // 先尝试激活编辑器
        this.activateEditor();
        
        // 等待编辑器激活
        await this.sleep(1000);
        
        // 重新查找内容编辑器
        const contentEditor = document.querySelector('[contenteditable="true"]:not(input)');
        if (contentEditor) {
          results.description = await this.fillVideoDescription(contentEditor, videoDescription);
          if (results.description.success) {
            fillCount++;
            console.log('✅ 抖音内容填充完成');
          }
        }
      }

      // 填充话题标签
      if (elements.tags && tags) {
        // 处理标签数据 - 可能是JSON字符串或数组
        let tagsArray = [];
        if (typeof tags === 'string') {
          try {
            tagsArray = JSON.parse(tags);
          } catch (e) {
            // 如果解析失败，可能是用空格分隔的字符串
            tagsArray = tags.split(' ').filter(tag => tag.trim());
          }
        } else if (Array.isArray(tags)) {
          tagsArray = tags;
        }

        if (tagsArray.length > 0) {
          const tagsText = tagsArray.slice(0, 5).map(tag => {
            // 确保标签以#开头
            return tag.startsWith('#') ? tag : `#${tag}`;
          }).join(' ');
          
          results.tags = await this.fillVideoTitle(elements.tags, tagsText);
          if (results.tags.success) {
            fillCount++;
            console.log('✅ 抖音话题填充完成');
          }
        }
      }

      if (fillCount > 0) {
        console.log('✅ 抖音内容填充成功，填充了', fillCount, '个字段');
        return results;
      } else {
        throw new Error('未找到可填充的字段');
      }

    } catch (error) {
      console.error('❌ 抖音内容填充失败:', error);
      throw error;
    }
  }

  /**
   * 转换数据格式为抖音视频数据（已废弃 - 现在直接使用AI转换后的数据）
   * @deprecated 现在直接使用数据库中AI转换后的 videoTitle, videoDescription, tags
   */
  convertToVideoData(data) {
    // 保留此方法作为回退，但优先使用AI转换后的数据
    return {
      videoTitle: data.videoTitle || data.title || '',
      videoDescription: data.videoDescription || data.content || '',
      tags: data.tags || []
    };
  }

  /**
   * 从文本提取关键词
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // 简单的关键词提取逻辑
    const keywords = [];
    
    // 提取中文关键词
    const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,8}/g);
    if (chineseMatches) {
      keywords.push(...chineseMatches.slice(0, 2));
    }
    
    // 提取英文关键词
    const englishMatches = text.match(/[A-Za-z]{3,10}/g);
    if (englishMatches) {
      keywords.push(...englishMatches.slice(0, 1));
    }
    
    return [...new Set(keywords)]; // 去重
  }

  /**
   * 填充富文本编辑器
   */
  async fillRichTextEditor(element, content) {
    try {
      // 聚焦元素
      element.focus();
      await this.sleep(100);

      // 清空现有内容
      element.innerHTML = '';
      await this.sleep(100);

      // 设置新内容
      element.innerHTML = content;
      
      // 触发输入事件
      const events = ['input', 'change', 'blur'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        element.dispatchEvent(event);
        await this.sleep(50);
      }

      console.log('✅ 富文本内容填充完成');
      return true;
    } catch (error) {
      console.error('❌ 富文本填充失败:', error);
      return false;
    }
  }

  /**
   * 填充视频标题
   */
  async fillVideoTitle(element, title) {
    try {
      console.log('🎵 开始填充标题到元素:', element.tagName, title);
      
      // 确保标题长度在限制范围内
      let processedTitle = title;
      if (title.length > 30) {
        processedTitle = title.substring(0, 30);
        console.log('⚠️ 标题超长，已截取到30字符');
      }

      // 设置输入值
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        await this.setInputValue(element, processedTitle);
      } else {
        element.textContent = processedTitle;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { success: true, value: processedTitle };
    } catch (error) {
      console.error('标题填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 填充视频描述
   */
  async fillVideoDescription(element, description) {
    try {
      console.log('🎵 开始填充描述到元素:', element.tagName, description);
      
      // 确保元素获得焦点
      element.focus();
      await this.sleep(200);

      if (element.contentEditable === 'true') {
        console.log('📝 使用contentEditable填充');
        element.innerHTML = '';
        element.textContent = description;
        
        // 触发输入事件
        const events = ['input', 'change', 'blur'];
        for (const eventType of events) {
          element.dispatchEvent(new Event(eventType, { bubbles: true }));
          await this.sleep(50);
        }
      } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
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
   * 设置输入框值
   */
  async setInputValue(element, value) {
    try {
      // 聚焦元素
      element.focus();
      await this.sleep(100);

      // 清空现有内容
      element.select();
      await this.sleep(50);

      // 设置新值
      element.value = value;
      
      // 触发事件
      const events = ['input', 'change', 'blur'];
      for (const eventType of events) {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
        await this.sleep(50);
      }

      return true;
    } catch (error) {
      console.error('输入框值设置失败:', error);
      return false;
    }
  }

  /**
   * 睡眠函数
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查平台特性支持
   */
  supportsFeature(feature) {
    const supportedFeatures = ['videoTitle', 'videoDescription', 'tags'];
    return supportedFeatures.includes(feature);
  }

  /**
   * 获取平台限制信息
   */
  getPlatformLimits() {
    return {
      title: { min: 1, max: 30 },
      content: { max: 1000 },
      tags: { max: 5 }
    };
  }
}

// 自动注册插件
if (typeof window !== 'undefined' && window.ZiliuPlatformRegistry) {
  const config = window.ZiliuPluginConfig?.platforms?.find(p => p.id === 'douyin');
  if (config) {
    const douyinPlugin = new DouyinPlugin(config);
    window.ZiliuPlatformRegistry.register(douyinPlugin);
    console.log('🎵 抖音插件已注册到平台注册中心');
  }
}