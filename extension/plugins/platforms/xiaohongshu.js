/**
 * 小红书平台插件（图文）
 * 仅处理小红书创作者平台的图文发布页面
 */
class XiaohongshuPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'note';
    console.log('📖 小红书图文插件初始化完成');
  }

  isNoteTab() {
    return true;
  }

  /**
   * 检测是否为小红书平台
   */
  isPlatformMatch() {
    const url = window.location.href;
    const isMatch = url.includes('creator.xiaohongshu.com/publish/publish') && url.includes('target=image');
    console.log('📖 小红书图文平台检测:', { url, isMatch });
    return isMatch;
  }

  /**
   * 获取页面元素选择器
   */
  getSelectors() {
    return {
      title: [
        'input.d-text',
        'input[placeholder*="填写标题"]',
        'input[placeholder*="标题"]',
        'textbox[placeholder*="标题"]'
      ],
      content: [
        '.tiptap.ProseMirror',
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
      // 封面相关（图文模式由图片顺序决定，不处理）
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

    // 图文模式不处理封面

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
        hasTags: !!data.tags,
        hasCoverImage: !!data.coverImage
      }
    });

    try {
      console.log('📖 小红书发布类型检测: 图文笔记');

      // 1. 如果有图片，先上传图片（因为上传图片后才会显示标题和正文框）
      if (data.images && data.images.length > 0) {
        console.log('🖼️ 检测到图片列表，开始上传图片...');
        await this.fillXhsImages(data.images, data.coverImage);
        // 上传后给页面一点反应时间
        await this.sleep(3000);
      }

      // 重新查找元素（可能刚才上传图片后才出现）
      const elements = this.findElements();
      let fillCount = 0;
      const results = {};

      // 图文优先使用 title/content
      const title = data.title;
      const description = data.content;
      const tags = data.tags || [];

      console.log('📖 准备填充的内容数据:', {
        title,
        description: description?.substring(0, 100) + '...',
        tags: typeof tags === 'string' ? JSON.parse(tags) : tags
      });

      // 填充标题 - 小红书标题限制20字
      if (elements.title && title) {
        let processedTitle = title.toString();
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
      if (elements.content && description) {
        let processedContent = description.toString();
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
   * 填充图文笔记的图片列表
   */
  async fillXhsImages(images, coverImage) {
    try {
      console.log('🖼️ 开始上传图片列表:', images.length);

      const fileInput = document.querySelector('input.upload-input') ||
        document.querySelector('input[type="file"][accept*="image"]');

      if (!fileInput) {
        throw new Error('未找到图片上传输入框');
      }

      // 组合图片：如果专门有封面图，放在第一位
      const allImageUrls = [];
      if (coverImage) {
        allImageUrls.push(coverImage);
      }

      images.forEach(img => {
        const url = typeof img === 'string' ? img : img.url;
        if (url && url !== coverImage) {
          allImageUrls.push(url);
        }
      });

      console.log('🖼️ 最终待上传图片序列:', allImageUrls.length);

      const dataTransfer = new DataTransfer();

      // 串行获取所有图片 Blob
      for (let i = 0; i < allImageUrls.length; i++) {
        try {
          const url = allImageUrls[i];
          console.log(`⏳ 获取第 ${i + 1} 张图片:`, url.substring(0, 50));
          const blob = await this.fetchImageBlob(url);
          const fileName = `image_${i}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });
          dataTransfer.items.add(file);
        } catch (e) {
          console.warn(`⚠️ 图片获取失败 (${i}):`, e);
        }
      }

      if (dataTransfer.items.length > 0) {
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ 已触发 ${dataTransfer.items.length} 张图片的上传`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ 上传图片失败:', error);
      return false;
    }
  }

  async fetchImageBlob(url) {
    if (window.ZiliuUtilsService && typeof window.ZiliuUtilsService.fetchImageBlob === 'function') {
      return await window.ZiliuUtilsService.fetchImageBlob(url);
    }
    return null;
  }

  /**
   * 智能填充话题标签 - 小红书的特色功能
   */
  async fillTags(elements, tagsArray) {
    try {
      console.log('🏷️ [DEBUG] 开始智能填充小红书话题标签:', tagsArray);

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

        console.log(`🏷️ [DEBUG] 处理标签: ${tagText}`);

        // 尝试在推荐标签中找到匹配的话题
        const matchedRecommendTag = await this.findAndClickRecommendTag(recommendTags, tagText);

        if (matchedRecommendTag) {
          addedTagTexts.push(tagText);
          addedTags++;
          console.log(`✅ 通过推荐话题添加: ${tagText}`);
          await this.sleep(400); // 增加等待时间
        } else {
          // 如果推荐标签中没有，尝试手动输入并从下拉框选择
          if (elements.content) {
            console.log(`⌨️ [DEBUG] 尝试手动输入并选择话题: ${tagText}`);
            const manualAdded = await this.addTagToContent(elements.content, tagText);
            if (manualAdded) {
              addedTagTexts.push(tagText);
              addedTags++;
              console.log(`✅ 通过手动输入选择话题成功: ${tagText}`);
              await this.sleep(500); // 给编辑器反应时间
            } else {
              console.warn(`❌ 手动输入话题失败: ${tagText}`);
            }
          } else {
            console.warn('⚠️ 未找到内容编辑器元素，无法填入手动标签');
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
        addedTagTexts: addedTagTexts,
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
      console.log(`📝 开始交互式添加话题: ${tagText}`);
      const tagName = tagText.replace(/^#/, ''); // 去掉开头的#

      // 1. 聚焦并移动光标到末尾
      contentElement.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentElement);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      await this.sleep(100);

      // 2. 输入 # 触发下拉框
      document.execCommand('insertText', false, '#');
      await this.sleep(200);

      // 3. 输入话题名称
      document.execCommand('insertText', false, tagName);
      console.log(`⌨️ 已输入话题文本: ${tagName}，等待下拉框...`);

      // 4. 等待下拉框出现并包含匹配项
      let success = false;
      for (let i = 0; i < 10; i++) {
        const container = document.getElementById('creator-editor-topic-container');
        if (container) {
          const items = container.querySelectorAll('.item');
          if (items.length > 0) {
            console.log(`🎯 找到话题下拉框，项数: ${items.length}`);

            // 尝试找最匹配的一项
            let targetItem = items[0]; // 默认选第一项
            for (const item of items) {
              const nameEl = item.querySelector('.name');
              const name = nameEl?.textContent?.trim().replace(/^#/, '');
              if (name === tagName) {
                targetItem = item;
                break;
              }
            }

            console.log('🖱️ 点击话题项:', targetItem.textContent);
            targetItem.click();
            success = true;
            break;
          }
        }
        await this.sleep(300);
      }

      // 5. 兜底逻辑：如果下拉框没出，或者没匹配到，按个空格变成普通文本
      if (!success) {
        console.warn('⚠️ 未能触发话题下拉框选择，作为普通文本处理');
        document.execCommand('insertText', false, ' ');
        return true;
      }

      // 话题选择后插入一个空格方便后续继续输入
      await this.sleep(200);
      document.execCommand('insertText', false, ' ');

      return true;
    } catch (error) {
      console.error('交互式添加话题失败:', error);
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
        console.log('📝 使用模拟输入填充 (Tiptap Compat)');

        // 1. 聚焦并全选现有内容
        element.focus();
        await this.sleep(100);
        document.execCommand('selectAll', false, null);
        await this.sleep(100);

        // 2. 尝试使用 insertText (这会替换选中内容，是最安全的方式)
        let success = false;
        try {
          success = document.execCommand('insertText', false, processedContent);
        } catch (e) {
          console.warn('execCommand insertText failed:', e);
        }

        // 3. 如果 insertText 失败，尝试模拟粘贴
        if (!success) {
          console.log('⚠️ insertText 失败，尝试模拟粘贴事件');
          try {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', processedContent);
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dataTransfer,
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(pasteEvent);
            success = true;
          } catch (e) {
            console.error('模拟粘贴失败:', e);
          }
        }

        // 4. 兜底方案：如果上述都失败，才谨慎使用 innerText (尽量避免)
        if (!success) {
          console.warn('⚠️ 模拟输入全失败，回退到 innerText 赋值');
          element.innerText = processedContent;
        }

        // 触发通过事件，通知编辑器状态更新
        await this.sleep(100);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
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
    const supportedFeatures = ['title', 'content', 'tags', 'topics'];
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
    .filter(p => p.id === 'xiaohongshu_note' && p.enabled);

  configs.forEach((config) => {
    // 避免重复注册
    if (window.ZiliuPlatformRegistry.get(config.id)) return;

    const plugin = new XiaohongshuPlugin(config);
    window.ZiliuPlatformRegistry.register(plugin);
    console.log(`📖 小红书图文插件已注册到平台注册中心: ${config.id}`);
  });
}
