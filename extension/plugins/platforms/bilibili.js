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
      ],
      // 封面上传
      cover: [
        '.cover-upload-container input[type="file"]',
        'input[type="file"][accept*="image"]',
        '.upload-cover-btn input'
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

    // 查找封面输入框
    for (const selector of selectors.cover) {
      const element = document.querySelector(selector);
      if (element) {
        elements.cover = element;
        console.log('🎯 找到B站封面输入框:', selector);
        break;
      }
    }

    return elements;
  }

  /**
   * 填充内容到B站编辑器
   */
  async fillContent(data) {
    console.log('📺 开始填充B站内容:', data);

    try {
      const elements = this.findElements();
      let fillCount = 0;
      const results = {};

      // 直接使用AI转换后的视频数据，如果没有则回退到原始数据
      const videoTitle = data.videoTitle || data.title;
      const videoDescription = data.videoDescription || data.content;
      const tags = data.tags || [];

      // 填充标题
      if (elements.title && videoTitle) {
        results.title = await this.fillVideoTitle(elements.title, videoTitle);
        if (results.title.success) fillCount++;
      }

      // 填充简介
      if (elements.description && videoDescription) {
        results.description = await this.fillVideoDescription(elements.description, videoDescription);
        if (results.description.success) fillCount++;
      }

      // 填充标签
      if (elements.tagInput && tags) {
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
          if (results.tags.success) fillCount++;
        }
      }

      // 填充封面
      if (elements.cover && data.coverImage) {
        results.cover = await this.fillCover(elements.cover, data.coverImage);
        if (results.cover.success) {
          fillCount++;
          console.log('✅ B站封面填充完成');
        } else {
          console.warn('⚠️ B站封面填充失败:', results.cover.error);
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
   * 填充封面图片
   */
  async fillCover(element, imageUrl) {
    try {
      console.log('🖼️ 开始填充封面:', imageUrl.substring(0, 50) + '...');

      // 1. 获取图片Blob数据
      const blob = await this.fetchImageBlob(imageUrl);
      if (!blob) throw new Error('无法获取图片数据');

      // 2. 创建File对象
      const file = new File([blob], 'cover.png', { type: 'image/png' });

      // 3. 模拟文件上传
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      element.files = dataTransfer.files;

      // 4. 触发事件
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));

      await this.sleep(1500); // 等待上传反应

      return { success: true };
    } catch (error) {
      console.error('封面填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取图片Blob
   */
  async fetchImageBlob(url) {
    // 如果是base64，直接转换
    if (url.startsWith('data:')) {
      const res = await fetch(url);
      return await res.blob();
    }

    // 如果是URL，通过background script获取（避开CORS）
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'fetchBlob',
        data: { url }
      }, (response) => {
        if (chrome.runtime.lastError) {
          fetch(url).then(res => res.blob()).then(resolve).catch(reject);
        } else if (response && response.success && response.data) {
          fetch(response.data).then(res => res.blob()).then(resolve).catch(reject);
        } else {
          fetch(url).then(res => res.blob()).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * 智能填充标签
   */
  async fillTags(elements, tagsArray) {
    try {
      console.log('🏷️ 开始智能填充B站标签:', tagsArray);

      let addedTags = 0;
      const maxTags = 10;
      const { tagInput } = elements;

      // 首先尝试添加热门/推荐标签（如果存在且匹配）
      const hotTags = document.querySelectorAll(this.getSelectors().recommendTags.join(','));
      if (hotTags.length > 0) {
        for (const hotTag of hotTags) {
          const tagText = hotTag.textContent?.trim();
          if (tagsArray.includes(tagText)) {
            hotTag.click();
            addedTags++;
            await this.sleep(100);
          }
        }
      }

      // 手动输入剩余标签
      for (const tag of tagsArray) {
        if (addedTags >= maxTags) break;

        // 检查是否已经添加（避免重复）
        const existingTags = document.querySelectorAll(this.getSelectors().existingTags.join(','));
        const tagExists = Array.from(existingTags).some(el => el.textContent?.includes(tag));

        if (!tagExists) {
          const success = await this.addTagManually(tagInput, tag);
          if (success) addedTags++;
        }
      }

      return {
        success: addedTags > 0,
        addedCount: addedTags,
        value: tagsArray.join(',')
      };

    } catch (error) {
      console.error('❌ 标签填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动添加标签
   */
  async addTagManually(tagInput, tagText) {
    if (!tagInput) return false;

    try {
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