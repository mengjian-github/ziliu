/**
 * 小红书平台插件
 * 支持小红书创作者平台的视频和图文发布页面
 */
class XiaohongshuPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'video'; // 主要支持视频，也支持图文
    console.log('📖 小红书插件初始化完成');
  }

  /**
   * 检测是否为小红书平台
   */
  isPlatformMatch() {
    const url = window.location.href;
    const isMatch = url.includes('creator.xiaohongshu.com/publish/publish');
    console.log('📖 小红书平台检测:', { url, isMatch });
    return isMatch;
  }

  /**
   * 获取页面元素选择器
   */
  getSelectors() {
    return {
      title: [
        'input[placeholder*="填写标题"]',
        'input[placeholder*="标题"]',
        'textbox[placeholder*="标题"]'
      ],
      content: [
        'div[contenteditable="true"]',
        'textarea[placeholder*="正文"]',
        'textbox[placeholder*="描述"]'
      ],
      // 小红书的话题标签系统
      topicButton: [
        'button:has-text("话题")',
        '.contentBtn:has-text("话题")',
        '[class*="topic-btn"]'
      ],
      recommendTags: [
        '.recommend-topic-wrapper',
        '[class*="topic"][class*="recommend"]',
        '[data-testid*="topic"]'
      ],
      // 活动话题
      activityTopics: [
        '[class*="activity"] [class*="topic"]',
        '.activity-topic-item',
        '[data-testid*="activity-topic"]'
      ],
      // 个人话题标签
      individualTags: [
        '[class*="tag-item"]',
        '.topic-tag',
        '[class*="hashtag"]'
      ]
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
        console.log('🎯 找到小红书标题输入框:', selector);
        break;
      }
    }

    // 查找内容编辑器
    for (const selector of selectors.content) {
      const element = document.querySelector(selector);
      if (element) {
        elements.content = element;
        console.log('🎯 找到小红书内容编辑器:', selector);
        break;
      }
    }

    // 查找话题按钮
    elements.topicButton = document.querySelector('button[class*="contentBtn"]') ||
                          document.querySelector('button:has-text("话题")');

    // 查找推荐标签
    elements.recommendTags = document.querySelectorAll('.recommend-topic-wrapper > *');
    console.log('🎯 找到小红书推荐标签:', elements.recommendTags.length, '个');

    // 查找活动话题
    elements.activityTopics = document.querySelectorAll('[class*="activity-topic"]');
    console.log('🎯 找到小红书活动话题:', elements.activityTopics.length, '个');

    return elements;
  }

  /**
   * 填充内容到小红书编辑器
   */
  async fillContent(data) {
    console.log('📖 开始填充小红书内容:', data);
    
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

      console.log('📖 使用的视频数据:', {
        videoTitle,
        videoDescription: videoDescription?.substring(0, 100) + '...',
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags
      });

      // 填充标题 - 小红书标题限制20字
      if (elements.title && videoTitle) {
        let processedTitle = videoTitle.toString();
        if (processedTitle.length > 20) {
          processedTitle = processedTitle.substring(0, 20);
          console.log('⚠️ 标题超长，已截取到20字符');
        }
        
        results.title = await this.fillVideoTitle(elements.title, processedTitle);
        if (results.title.success) {
          fillCount++;
          console.log('✅ 小红书标题填充完成');
        }
      }

      // 填充内容 - 小红书内容限制1000字
      if (elements.content && videoDescription) {
        let processedContent = videoDescription.toString();
        if (processedContent.length > 1000) {
          processedContent = processedContent.substring(0, 1000);
          console.log('⚠️ 内容超长，已截取到1000字符');
        }

        results.content = await this.fillVideoDescription(elements.content, processedContent);
        if (results.content.success) {
          fillCount++;
          console.log('✅ 小红书内容填充完成');
        }
      }

      // 填充话题标签 - 小红书的核心功能
      if (tags) {
        let tagsArray = [];
        if (typeof tags === 'string') {
          try {
            tagsArray = JSON.parse(tags);
          } catch (e) {
            tagsArray = tags.split(/[,，\s]+/).filter(tag => tag.trim());
          }
        } else if (Array.isArray(tags)) {
          tagsArray = tags;
        }

        if (tagsArray.length > 0) {
          results.tags = await this.fillTags(elements, tagsArray);
          if (results.tags.success) {
            fillCount++;
            console.log('✅ 小红书话题标签填充完成');
          }
        }
      }

      if (fillCount > 0) {
        console.log('✅ 小红书内容填充成功，填充了', fillCount, '个字段');
        return results;
      } else {
        throw new Error('未找到可填充的字段');
      }

    } catch (error) {
      console.error('❌ 小红书内容填充失败:', error);
      throw error;
    }
  }

  /**
   * 智能填充话题标签 - 小红书的特色功能
   */
  async fillTags(elements, tagsArray) {
    try {
      console.log('🏷️ 开始智能填充小红书话题标签:', tagsArray);
      
      let addedTags = 0;
      const maxTags = 10; // 小红书话题限制
      const addedTagTexts = [];
      
      // 先尝试点击推荐标签（类似B站的逻辑）
      const recommendTags = elements.recommendTags || document.querySelectorAll('.recommend-topic-wrapper > *');
      
      for (const tag of tagsArray.slice(0, maxTags)) {
        let tagText = tag.toString().trim();
        
        // 确保话题以#开头
        if (!tagText.startsWith('#')) {
          tagText = `#${tagText}`;
        }
        
        // 尝试在推荐标签中找到匹配的话题
        const matchedRecommendTag = await this.findAndClickRecommendTag(recommendTags, tagText);
        
        if (matchedRecommendTag) {
          addedTagTexts.push(tagText);
          addedTags++;
          console.log(`✅ 通过推荐话题添加: ${tagText}`);
          await this.sleep(200);
        } else {
          // 如果推荐标签中没有，尝试手动添加到内容中
          if (elements.content) {
            const manualAdded = await this.addTagToContent(elements.content, tagText);
            if (manualAdded) {
              addedTagTexts.push(tagText);
              addedTags++;
              console.log(`✅ 通过内容区添加: ${tagText}`);
              await this.sleep(300);
            }
          }
        }
        
        if (addedTags >= maxTags) {
          console.log('⚠️ 已达到话题数量限制');
          break;
        }
      }
      
      return {
        success: addedTags > 0,
        addedCount: addedTags,
        addedTags: addedTagTexts,
        value: addedTagTexts.join(' ')
      };
      
    } catch (error) {
      console.error('❌ 话题标签填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 在推荐话题中查找并点击匹配的话题
   */
  async findAndClickRecommendTag(recommendTags, targetTag) {
    try {
      const normalizedTarget = targetTag.toLowerCase().replace(/[#\s]/g, '');
      
      for (const tagElement of recommendTags) {
        const tagText = tagElement.textContent?.trim().toLowerCase().replace(/[#\s]/g, '');
        
        // 精确匹配或包含匹配
        if (tagText === normalizedTarget || 
            tagText.includes(normalizedTarget) || 
            normalizedTarget.includes(tagText)) {
          
          console.log(`🎯 找到匹配的推荐话题: "${tagElement.textContent?.trim()}" -> "${targetTag}"`);
          
          // 检查是否已经选中
          if (tagElement.classList.contains('selected') || 
              tagElement.classList.contains('active')) {
            console.log('⚠️ 话题已选中，跳过');
            return true;
          }
          
          // 点击添加话题
          tagElement.click();
          await this.sleep(200);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('推荐话题点击失败:', error);
      return false;
    }
  }

  /**
   * 将话题添加到内容区域
   */
  async addTagToContent(contentElement, tagText) {
    try {
      console.log(`📝 将话题添加到内容区: ${tagText}`);
      
      // 聚焦内容编辑器
      contentElement.focus();
      await this.sleep(100);
      
      // 获取当前内容
      const currentContent = contentElement.textContent || contentElement.value || '';
      
      // 在内容末尾添加话题
      const newContent = currentContent ? `${currentContent} ${tagText}` : tagText;
      
      if (contentElement.contentEditable === 'true') {
        // 对于可编辑div
        contentElement.textContent = newContent;
        contentElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // 对于input/textarea
        contentElement.value = newContent;
        contentElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      await this.sleep(100);
      return true;
    } catch (error) {
      console.error('添加话题到内容区失败:', error);
      return false;
    }
  }

  /**
   * 填充视频标题
   */
  async fillVideoTitle(element, title) {
    try {
      console.log('📖 开始填充标题到元素:', element.tagName, title);
      
      // 确保标题长度在限制范围内
      let processedTitle = title;
      if (title.length > 20) {
        processedTitle = title.substring(0, 20);
        console.log('⚠️ 标题超长，已截取到20字符');
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
      console.log('📖 开始填充内容到元素:', element.tagName, description);
      
      // 确保内容长度在限制范围内
      let processedContent = description;
      if (description.length > 1000) {
        processedContent = description.substring(0, 1000);
        console.log('⚠️ 内容超长，已截取到1000字符');
      }

      // 确保元素获得焦点
      element.focus();
      await this.sleep(200);

      if (element.contentEditable === 'true') {
        console.log('📝 使用contentEditable填充');
        element.innerHTML = '';
        element.textContent = processedContent;
        
        // 触发输入事件
        const events = ['input', 'change', 'blur'];
        for (const eventType of events) {
          element.dispatchEvent(new Event(eventType, { bubbles: true }));
          await this.sleep(50);
        }
      } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        console.log('📝 使用input/textarea填充');
        await this.setInputValue(element, processedContent);
      } else {
        // 尝试直接设置文本
        console.log('📝 使用通用方法填充');
        element.textContent = processedContent;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { success: true, value: processedContent };
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
    const supportedFeatures = ['videoTitle', 'videoDescription', 'tags', 'topics'];
    return supportedFeatures.includes(feature);
  }

  /**
   * 获取平台限制信息
   */
  getPlatformLimits() {
    return {
      title: { min: 1, max: 20 },
      content: { max: 1000 },
      tags: { max: 10 }
    };
  }
}

// 自动注册插件
if (typeof window !== 'undefined' && window.ZiliuPlatformRegistry) {
  const config = window.ZiliuPluginConfig?.platforms?.find(p => p.id === 'xiaohongshu');
  if (config) {
    const xiaohongshuPlugin = new XiaohongshuPlugin(config);
    window.ZiliuPlatformRegistry.register(xiaohongshuPlugin);
    console.log('📖 小红书插件已注册到平台注册中心');
  }
}