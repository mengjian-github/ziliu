/**
 * B站(哔哩哔哩)平台插件
 * 支持B站创作者中心的视频编辑页面
 */
class BilibiliPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'video';
    console.log('📺 B站插件初始化完成');
  }

  /**
   * 检测是否为B站平台
   */
  isPlatformMatch() {
    const url = window.location.href;
    const isMatch = url.includes('member.bilibili.com/platform/upload/video/frame') ||
                   url.includes('member.bilibili.com/york/video-up');
    console.log('📺 B站平台检测:', { url, isMatch });
    return isMatch;
  }

  /**
   * 获取页面元素选择器
   */
  getSelectors() {
    return {
      title: [
        'input[placeholder*="请输入稿件标题"]',
        'textbox[placeholder*="请输入稿件标题"]',
        'input[placeholder*="标题"]'
      ],
      description: [
        '[contenteditable="true"]',
        '.editor-content',
        'textarea[placeholder*="简介"]',
        '.description-editor'
      ],
      tagInput: [
        'input[placeholder*="按回车键Enter创建标签"]',
        'input[placeholder*="创建标签"]',
        '.tag-input input'
      ],
      // 推荐标签容器
      recommendTags: [
        '.hot-tag-container',
        '.recommend-tag'
      ],
      // 现有标签（用于清理）
      existingTags: [
        '.selected-tag',
        '.tag-item'
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
        console.log('🎯 找到B站标题输入框:', selector);
        break;
      }
    }

    // 查找简介编辑器
    for (const selector of selectors.description) {
      const element = document.querySelector(selector);
      if (element && !element.querySelector('input')) { // 避免选到标题输入框
        elements.description = element;
        console.log('🎯 找到B站简介编辑器:', selector);
        break;
      }
    }

    // 查找标签输入框
    for (const selector of selectors.tagInput) {
      const element = document.querySelector(selector);
      if (element) {
        elements.tagInput = element;
        console.log('🎯 找到B站标签输入框:', selector);
        break;
      }
    }

    // 查找推荐标签
    elements.recommendTags = document.querySelectorAll('.hot-tag-container');
    console.log('🎯 找到B站推荐标签:', elements.recommendTags.length, '个');

    return elements;
  }

  /**
   * 填充内容到B站编辑器
   */
  async fillContent(data) {
    console.log('📺 开始填充B站内容:', data);
    
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

      console.log('📺 使用的视频数据:', {
        videoTitle,
        videoDescription: videoDescription?.substring(0, 100) + '...',
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags
      });

      // 填充标题
      if (elements.title && videoTitle) {
        // B站标题限制80字符
        let processedTitle = videoTitle.toString();
        if (processedTitle.length > 80) {
          processedTitle = processedTitle.substring(0, 80);
          console.log('⚠️ 标题超长，已截取到80字符');
        }
        
        results.title = await this.fillVideoTitle(elements.title, processedTitle);
        if (results.title.success) {
          fillCount++;
          console.log('✅ B站标题填充完成');
        }
      }

      // 填充简介
      if (elements.description && videoDescription) {
        results.description = await this.fillVideoDescription(elements.description, videoDescription);
        if (results.description.success) {
          fillCount++;
          console.log('✅ B站简介填充完成');
        }
      }

      // 填充标签 - 这是重点功能
      if (tags) {
        // 处理标签数据
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
            console.log('✅ B站标签填充完成');
          }
        }
      }

      if (fillCount > 0) {
        console.log('✅ B站内容填充成功，填充了', fillCount, '个字段');
        return results;
      } else {
        throw new Error('未找到可填充的字段');
      }

    } catch (error) {
      console.error('❌ B站内容填充失败:', error);
      throw error;
    }
  }

  /**
   * 智能填充标签 - B站的核心功能
   */
  async fillTags(elements, tagsArray) {
    try {
      console.log('🏷️ 开始智能填充B站标签:', tagsArray);
      
      let addedTags = 0;
      const maxTags = 10; // B站标签限制
      
      // 首先尝试点击推荐标签
      const recommendTags = elements.recommendTags || document.querySelectorAll('.hot-tag-container');
      const addedTagTexts = [];
      
      for (const tag of tagsArray.slice(0, maxTags)) {
        const tagText = tag.toString().trim();
        if (!tagText) continue;
        
        // 尝试在推荐标签中找到匹配的标签
        const matchedRecommendTag = await this.findAndClickRecommendTag(recommendTags, tagText);
        
        if (matchedRecommendTag) {
          addedTagTexts.push(tagText);
          addedTags++;
          console.log(`✅ 通过推荐标签添加: ${tagText}`);
          await this.sleep(200); // 等待UI更新
        } else {
          // 如果推荐标签中没有，通过输入框手动添加
          if (elements.tagInput) {
            const manualAdded = await this.addTagManually(elements.tagInput, tagText);
            if (manualAdded) {
              addedTagTexts.push(tagText);
              addedTags++;
              console.log(`✅ 通过输入框添加: ${tagText}`);
              await this.sleep(500); // 手动输入需要更长等待时间
            }
          }
        }
        
        if (addedTags >= maxTags) {
          console.log('⚠️ 已达到标签数量限制');
          break;
        }
      }
      
      return {
        success: addedTags > 0,
        addedCount: addedTags,
        addedTags: addedTagTexts,
        value: addedTagTexts.join(', ')
      };
      
    } catch (error) {
      console.error('❌ 标签填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 在推荐标签中查找并点击匹配的标签
   */
  async findAndClickRecommendTag(recommendTags, targetTag) {
    try {
      const normalizedTarget = targetTag.toLowerCase().replace(/[#\s]/g, '');
      
      for (const tagElement of recommendTags) {
        const tagText = tagElement.textContent.trim().toLowerCase().replace(/[#\s]/g, '');
        
        // 精确匹配或包含匹配
        if (tagText === normalizedTarget || 
            tagText.includes(normalizedTarget) || 
            normalizedTarget.includes(tagText)) {
          
          console.log(`🎯 找到匹配的推荐标签: "${tagElement.textContent.trim()}" -> "${targetTag}"`);
          
          // 检查是否已经选中
          if (tagElement.classList.contains('hot-tag-container-selected')) {
            console.log('⚠️ 标签已选中，跳过');
            return true; // 认为已经添加成功
          }
          
          // 点击添加标签
          tagElement.click();
          await this.sleep(200);
          
          // 验证是否添加成功（检查是否获得selected类）
          if (tagElement.classList.contains('hot-tag-container-selected')) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('推荐标签点击失败:', error);
      return false;
    }
  }

  /**
   * 通过输入框手动添加标签
   */
  async addTagManually(tagInput, tagText) {
    try {
      console.log(`📝 手动添加标签: ${tagText}`);
      
      // 聚焦输入框
      tagInput.focus();
      await this.sleep(100);
      
      // 清空输入框
      tagInput.value = '';
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(100);
      
      // 输入标签文本
      tagInput.value = tagText;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(200);
      
      // 按回车键添加标签
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      tagInput.dispatchEvent(enterEvent);
      await this.sleep(300);
      
      // 清空输入框
      tagInput.value = '';
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('手动添加标签失败:', error);
      return false;
    }
  }

  /**
   * 填充视频标题
   */
  async fillVideoTitle(element, title) {
    try {
      console.log('📺 开始填充标题到元素:', element.tagName, title);
      
      // 确保标题长度在限制范围内
      let processedTitle = title;
      if (title.length > 80) {
        processedTitle = title.substring(0, 80);
        console.log('⚠️ 标题超长，已截取到80字符');
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
   * 填充视频简介
   */
  async fillVideoDescription(element, description) {
    try {
      console.log('📺 开始填充简介到元素:', element.tagName, description);
      
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
      console.error('视频简介填充失败:', error);
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
    const supportedFeatures = ['videoTitle', 'videoDescription', 'tags', 'smartTags'];
    return supportedFeatures.includes(feature);
  }

  /**
   * 获取平台限制信息
   */
  getPlatformLimits() {
    return {
      title: { min: 1, max: 80 },
      content: { max: 2000 },
      tags: { max: 10 }
    };
  }
}

// 自动注册插件
if (typeof window !== 'undefined' && window.ZiliuPlatformRegistry) {
  const config = window.ZiliuPluginConfig?.platforms?.find(p => p.id === 'bilibili');
  if (config) {
    const bilibiliPlugin = new BilibiliPlugin(config);
    window.ZiliuPlatformRegistry.register(bilibiliPlugin);
    console.log('📺 B站插件已注册到平台注册中心');
  }
}