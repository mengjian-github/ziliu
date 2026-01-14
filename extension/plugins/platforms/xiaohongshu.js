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
        'button[class*="contentBtn"]',
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
      ],
      // 封面触发器 (打开编辑/上传弹窗的按钮)
      coverTrigger: [
        '.cover-upload',
        '.upload-cover',
        '.upload-text',
        'div.upload-text',
        '.cover-container'
      ],
      // 封面上传Tab/按钮 (弹窗内部的“上传图片”按钮)
      coverUploadTab: [
        '.upload-btn',
        '.upload-text',
        'div:contains("+ 上传图片")',
        'div:contains("上传图片")'
      ],
      // 封面输入框
      cover: [
        '.d-modal-mask input[type="file"][accept*="image"]',
        '.cover-container input[type="file"][accept*="image"]',
        '.upload-container input[type="file"]',
        'input[type="file"][accept*="image"]',
        '.upload-input',
        '.ant-upload input[type="file"]'
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

    // 查找话题按钮（不要使用 :has-text 这类非标准选择器）
    elements.topicButton =
      document.querySelector('button[class*="contentBtn"]') ||
      this.findButtonByText(['话题', 'Topic']);

    // 查找推荐标签
    elements.recommendTags = document.querySelectorAll('.recommend-topic-wrapper > *');
    console.log('🎯 找到小红书推荐标签:', elements.recommendTags.length, '个');

    // 查找活动话题
    elements.activityTopics = document.querySelectorAll('[class*="activity-topic"]');
    console.log('🎯 找到小红书活动话题:', elements.activityTopics.length, '个');

    // 查找封面输入框
    for (const selector of selectors.cover) {
      const element = document.querySelector(selector);
      if (element) {
        elements.cover = element;
        console.log('🎯 找到小红书封面输入框:', selector);
        break;
      }
    }

    // 查找封面触发器
    for (const selector of selectors.coverTrigger) {
      const element = document.querySelector(selector);
      if (element) {
        elements.coverTrigger = element;
        console.log('🎯 找到小红书封面触发器:', selector);
        break;
      }
    }

    return elements;
  }

  /**
   * 在页面中按文字查找按钮（用于替代非标准的 :has-text 选择器）
   */
  findButtonByText(texts = []) {
    try {
      const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const el of candidates) {
        if (!this.isElementVisible(el)) continue;
        const label = (el.textContent || '').trim();
        if (!label) continue;
        if (texts.some(t => label.includes(t))) return el;
      }
    } catch (error) {
      console.warn('按文字查找按钮失败:', error);
    }
    return null;
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
        hasTags: !!data.tags,
        hasCoverImage: !!data.coverImage
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

      // 填充封面
      if (data.coverImage) {
        results.cover = await this.fillCover(elements, data.coverImage);
        if (results.cover.success) {
          fillCount++;
          console.log('✅ 小红书封面填充完成');
        } else {
          console.warn('⚠️ 小红书封面填充失败:', results.cover.error);
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
   * 填充封面图片
   */
  async fillCover(elements, imageUrl) {
    try {
      console.log('🖼️ 开始填充封面 (增强版):', imageUrl.substring(0, 50) + '...');

      const dispatchFullClick = (el) => {
        if (!el) return;
        console.log(`🖱️ 真正点击的元素: <${el.tagName.toLowerCase()}> Classes: [${el.className}]`);

        // 尝试滚动到视野中
        try { el.scrollIntoView({ block: 'center' }); } catch (e) { }

        const eventOptions = {
          bubbles: true,
          cancelable: true,
          view: window,
          buttons: 1,
          which: 1
        };

        // 按顺序触发所有相关交互事件
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
          const EventClass = type.startsWith('pointer') ? window.PointerEvent : window.MouseEvent;
          el.dispatchEvent(new (EventClass || window.MouseEvent)(type, eventOptions));
        });

        // 最后兜底补一个原生 click
        if (typeof el.click === 'function') {
          el.click();
        }
      };

      // 1. 寻找并点击“设置封面”触发器
      console.log('🔍 寻找设置封面触发器...');
      let trigger = Array.from(document.querySelectorAll('div, span, p'))
        .find(el => el.textContent.trim() === '设置封面' && !el.closest('.d-modal-header') && this.isElementVisible(el));

      if (!trigger) {
        // 尝试通过类名寻找，优先找容器类
        trigger = document.querySelector('.publish-video-cover') ||
          document.querySelector('.cover-upload') ||
          document.querySelector('.upload-cover');
      }

      if (trigger) {
        console.log('🖱️ 准备点击触发器:', trigger.className || 'no-class');
        // 如果点的是里面的小字，尝试向上找包裹它的方块容器
        let clickableArea = trigger;
        let p = trigger;
        for (let i = 0; i < 5; i++) {
          if (p && (p.classList.contains('publish-video-cover') || p.classList.contains('cover-upload'))) {
            clickableArea = p;
            break;
          }
          p = p?.parentElement;
        }

        dispatchFullClick(clickableArea);
        await this.sleep(2000); // 增加等待时长
      } else {
        console.warn('⚠️ 未找到设置封面按钮，请检查页面是否已上传视频且封面区域可见');
      }

      // 2. 在弹窗内寻找“上传图片”按钮并点击
      console.log('🔍 寻找弹窗内的上传图片按钮...');
      let uploadBtn = null;
      let modal = null;

      // 等待弹窗真正渲染出内容 (避开骨架屏)
      for (let i = 0; i < 20; i++) {
        modal = document.querySelector('.d-modal-container, .d-modal-mask, .ant-modal');
        if (modal) {
          // 检查是否有骨架屏 (Xiaohongshu uses skeleton classes or placeholders)
          const isSkeleton = modal.querySelector('.ant-skeleton, .loading, [class*="skeleton"]');
          uploadBtn = modal.querySelector('.upload-btn') ||
            Array.from(modal.querySelectorAll('div, span')).find(el => el.textContent.includes('上传图片'));

          if (uploadBtn && !isSkeleton) {
            console.log('✨ 弹窗内容已就绪');
            break;
          }
        }
        await this.sleep(1000); // 增加等待频率，给足 20s 极慢加载空间
      }

      if (uploadBtn) {
        console.log('🖱️ 点击上传图片按钮');
        dispatchFullClick(uploadBtn);
        await this.sleep(2000); // 点击后等待文件选择器准备好
      } else {
        console.error('❌ 未能找到弹窗内的上传按钮');
      }

      // 3. 寻找真正的文件输入框 (严格锁定在弹窗内!)
      console.log('🔍 寻找弹窗内部专属的文件输入框...');
      let input = null;
      for (let i = 0; i < 15; i++) {
        modal = document.querySelector('.d-modal-container, .d-modal-mask, .ant-modal');
        if (modal) {
          // 只在 modal 内部探测，绝对不触碰背景页面的 input
          input = modal.querySelector('input[type="file"][accept*="image"]') ||
            modal.querySelector('input[type="file"]');

          if (input) {
            console.log('🎯 锁定弹窗内部输入框');
            break;
          }
        }
        await this.sleep(800);
      }

      if (!input) {
        throw new Error('未能在弹窗内找到文件输入框。如果弹窗已加载，请尝试手动点击一次上传图片按钮。');
      }

      console.log('🎯 找到输入框，注入图片数据');
      // 1. 获取图片Blob数据
      const blob = await this.fetchImageBlob(imageUrl);
      if (!blob) throw new Error('无法获取图片数据');

      // 2. 创建File对象
      const file = new File([blob], 'cover.png', { type: 'image/png' });

      // 3. 模拟文件上传
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      // 4. 触发事件
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));

      await this.sleep(2000); // 等待上传反应

      return { success: true };
    } catch (error) {
      console.error('❌ 封面填充失败:', error);
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
  const configs = (window.ZiliuPluginConfig?.platforms || [])
    .filter(p => (p.id === 'xiaohongshu' || p.id === 'xiaohongshu_note') && p.enabled);

  configs.forEach((config) => {
    // 避免重复注册
    if (window.ZiliuPlatformRegistry.get(config.id)) return;

    const plugin = new XiaohongshuPlugin(config);
    window.ZiliuPlatformRegistry.register(plugin);
    console.log(`📖 小红书插件已注册到平台注册中心: ${config.displayName || config.id}`);
  });
}
