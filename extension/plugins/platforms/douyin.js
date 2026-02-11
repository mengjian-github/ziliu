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
        hasTags: !!data.tags,
        hasCoverImage: !!data.coverImage,
        hasCoverImage43: !!data.coverImage43
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

        // 重新查找内容编辑器 (使用更准确的选择器)
        const contentEditor = document.querySelector('.editor-kit-container') || document.querySelector('[contenteditable="true"]:not(input)');
        if (contentEditor) {
          // 这里传入描述，不包含标签
          results.description = await this.fillVideoDescription(contentEditor, videoDescription);
          if (results.description.success) {
            fillCount++;
            console.log('✅ 抖音内容填充完成');
          }

          // 填充话题标签 - 抖音的话题也填在内容编辑器里，但需要交互式触发
          if (tags) {
            let tagsArray = [];
            if (typeof tags === 'string') {
              try {
                tagsArray = JSON.parse(tags);
              } catch (e) {
                tagsArray = tags.split(' ').filter(tag => tag.trim());
              }
            } else if (Array.isArray(tags)) {
              tagsArray = tags;
            }

            if (tagsArray.length > 0) {
              console.log('🏷️ 开始交互式填充抖音话题:', tagsArray);
              let addedTags = 0;
              for (const tag of tagsArray.slice(0, 5)) {
                const success = await this.addTagToContent(contentEditor, tag);
                if (success) addedTags++;
                await this.sleep(500); // 抖音建议列表反应稍慢
              }
              results.tags = { success: addedTags > 0, count: addedTags };
              if (addedTags > 0) fillCount++;
            }
          }
        }
      }

      // 填充封面图片
      const coverImage = data.coverImage;  // 用于竖封面 3:4
      const coverImage43 = data.coverImage43 || data.coverImage;  // 用于横封面 4:3
      if (coverImage || coverImage43) {
        console.log('🖼️ 开始填充抖音封面');
        results.cover = await this.fillDouyinCover(coverImage, coverImage43);
        if (results.cover.success) {
          fillCount++;
          console.log('✅ 抖音封面填充完成');
        } else {
          console.warn('⚠️ 抖音封面填充失败:', results.cover.error);
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
        console.log('📝 使用交互式填充内容');
        element.focus();
        // 清空当前内容
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        await this.sleep(100);

        // 插入描述文本 (不带标签)
        document.execCommand('insertText', false, description);

        // 触发输入事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        console.log('📝 使用input/textarea填充');
        await this.setInputValue(element, description);
      }

      return { success: true, value: description };
    } catch (error) {
      console.error('视频描述填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 交互式添加话题到抖音编辑器
   */
  async addTagToContent(contentElement, tagText) {
    try {
      console.log(`📝 开始交互式添加抖音话题: ${tagText}`);
      const tagName = tagText.toString().replace(/^#/, '').trim(); // 去掉开头的#
      if (!tagName) return false;

      // 1. 聚焦并移动光标到末尾
      contentElement.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentElement);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(selection.rangeCount > 0 ? selection.getRangeAt(0) : range);
      selection.removeAllRanges();
      selection.addRange(range);
      await this.sleep(100);

      // 2. 输入 # 触发下拉框
      document.execCommand('insertText', false, ' #'); // 前面带个空格防止粘连
      await this.sleep(300);

      // 3. 输入内容
      document.execCommand('insertText', false, tagName);
      console.log(`⌨️ 已输入话题文本: ${tagName}，等待下拉框...`);

      // 4. 等待下拉框出现，优先选择与输入完全匹配的话题
      let success = false;
      const normalize = (text) => text.toLowerCase().replace(/[#\s]/g, '');
      const target = normalize(tagName);
      // 抖音的下拉框类名带有动态hash，使用属性选择器匹配
      let fallbackItem = null;
      for (let i = 0; i < 20; i++) {
        const container = document.querySelector('div[class*="mention-suggest-item-container-"]');
        if (container) {
          const items = container.querySelectorAll('div[class*="tag-"], [role="option"], div');
          if (items.length > 0) {
            console.log(`🎯 找到话题下拉框，项数: ${items.length}`);
            let matched = null;
            for (const item of items) {
              const text = item.textContent?.trim() || '';
              if (!text) continue;
              const normalized = normalize(text);
              if (normalized === target) {
                matched = item;
                break;
              }
              if (!fallbackItem) fallbackItem = item;
            }
            if (matched) {
              matched.click();
              success = true;
              break;
            }
          }
        }
        await this.sleep(200);
      }
      if (!success && fallbackItem) {
        console.warn('⚠️ 未找到完全匹配话题，使用首个候选项');
        fallbackItem.click();
        success = true;
      }

      // 5. 兜底
      if (!success) {
        console.warn('⚠️ 未能触发抖音话题选择，按空格转换');
        document.execCommand('insertText', false, ' ');
      }

      await this.sleep(200);
      return true;
    } catch (error) {
      console.error('抖音话题交互式填充失败:', error);
      return false;
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
   * 填充抖音封面（竖封面 3:4 + 横封面 4:3）
   */
  async fillDouyinCover(coverImage, coverImage43) {
    try {
      console.log('🖼️ 抖音封面填充开始', {
        hasCoverImage: !!coverImage,
        hasCoverImage43: !!coverImage43
      });

      // 1. 点击竖封面区域打开弹窗
      const coverControls = document.querySelectorAll('.coverControl-CjlzqC .cover-Jg3T4p');
      if (!coverControls || coverControls.length === 0) {
        // 尝试通用选择器
        const fallbackTrigger = Array.from(document.querySelectorAll('div'))
          .find(el => el.textContent.trim() === '选择封面' && el.offsetParent !== null);
        if (fallbackTrigger) {
          fallbackTrigger.click();
        } else {
          throw new Error('未找到封面设置入口');
        }
      } else {
        coverControls[0].click(); // 点击第一个（竖封面）
      }

      await this.sleep(2000);

      // 2. 在弹窗中找到上传按钮并上传竖封面
      if (coverImage) {
        const verticalSuccess = await this.uploadCoverInModal(coverImage);
        console.log('🖼️ 竖封面上传结果:', verticalSuccess);

        if (verticalSuccess) {
          // 等待上传处理完成
          await this.sleep(2000);

          // 点击"完成"按钮
          const doneBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim() === '完成');
          if (doneBtn) {
            doneBtn.click();
            await this.sleep(1000);
          }
        }
      }

      // 3. 如果有横封面，切换到横封面 tab 并上传
      if (coverImage43) {
        // 先检查弹窗是否还开着，如果不在就重新打开
        let modal = document.querySelector('.semi-modal, [class*="modal"]');
        if (!modal || !modal.offsetParent) {
          // 重新打开 —— 点击横封面区域
          if (coverControls && coverControls.length > 1) {
            coverControls[1].click();
          } else {
            // 点击第一个也行，弹窗里可以切换 tab
            const trigger = document.querySelector('.coverControl-CjlzqC .cover-Jg3T4p');
            if (trigger) trigger.click();
          }
          await this.sleep(2000);
        }

        // 点击"设置横封面" tab
        const horizontalTab = Array.from(document.querySelectorAll('span, div, button'))
          .find(el => el.textContent.trim() === '设置横封面' && el.offsetParent !== null);
        if (horizontalTab) {
          horizontalTab.click();
          await this.sleep(1000);
        }

        const horizontalSuccess = await this.uploadCoverInModal(coverImage43);
        console.log('🖼️ 横封面上传结果:', horizontalSuccess);

        if (horizontalSuccess) {
          await this.sleep(2000);

          // 点击"完成"按钮
          const doneBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.trim() === '完成');
          if (doneBtn) {
            doneBtn.click();
            await this.sleep(1000);
          }
        }
      }

      // 关闭可能残留的弹窗
      const closeBtn = document.querySelector('[class*="close"]');
      if (closeBtn && closeBtn.closest('[class*="modal"]')) {
        closeBtn.click();
      }

      return { success: true };
    } catch (error) {
      console.error('❌ 抖音封面填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 在封面弹窗内上传图片
   */
  async uploadCoverInModal(imageUrl) {
    try {
      // 1. 找到"上传封面"按钮并点击
      const uploadBtn = Array.from(document.querySelectorAll('div, span, button'))
        .find(el => {
          const text = el.textContent.trim();
          return (text === '上传封面' || text === '+ 上传封面' || text.includes('上传封面'))
            && el.offsetParent !== null
            && el.offsetWidth > 0;
        });

      if (uploadBtn) {
        console.log('🖱️ 点击上传封面按钮');
        uploadBtn.click();
        await this.sleep(1000);
      }

      // 2. 找到 file input（弹窗内的图片上传输入框）
      let fileInput = null;
      for (let i = 0; i < 10; i++) {
        // 优先找 semi-upload 组件内的 input
        const inputs = document.querySelectorAll('input[type="file"][accept*="image"]');
        for (const input of inputs) {
          // 确保是在弹窗/封面上传区域内的 input
          const parent = input.closest('.semi-upload, [class*="modal"], [class*="upload"]');
          if (parent && input.offsetParent !== null) {
            fileInput = input;
            break;
          }
        }
        if (fileInput) break;

        // 兜底：找所有图片类型 file input
        if (i > 5) {
          fileInput = document.querySelector('.semi-upload-hidden-input[accept*="image"]') ||
            document.querySelector('input[type="file"][accept*="image"]');
          if (fileInput) break;
        }
        await this.sleep(500);
      }

      if (!fileInput) {
        console.error('❌ 未找到文件上传输入框');
        return false;
      }

      console.log('🎯 找到文件输入框，开始注入图片');

      // 3. 获取图片 Blob
      const blob = await this.fetchImageBlob(imageUrl);
      if (!blob) {
        console.error('❌ 无法获取图片数据');
        return false;
      }

      // 4. 创建 File 对象并注入
      const file = new File([blob], 'cover.png', { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // 5. 触发事件
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      console.log('✅ 封面图片已注入到输入框');
      await this.sleep(2000);

      return true;
    } catch (error) {
      console.error('❌ 弹窗内封面上传失败:', error);
      return false;
    }
  }

  /**
   * 获取图片 Blob 数据
   */
  async fetchImageBlob(url) {
    // 优先使用字流的工具服务
    if (window.ZiliuUtilsService && typeof window.ZiliuUtilsService.fetchImageBlob === 'function') {
      return await window.ZiliuUtilsService.fetchImageBlob(url);
    }

    // 如果是 data URL，直接转 Blob
    if (url.startsWith('data:')) {
      try {
        const response = await fetch(url);
        return await response.blob();
      } catch (e) {
        console.error('❌ Data URL 转 Blob 失败:', e);
        return null;
      }
    }

    // 尝试直接 fetch
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.blob();
      }
    } catch (e) {
      console.error('❌ 图片获取失败:', e);
    }

    return null;
  }

  /**
   * 检查平台特性支持
   */
  supportsFeature(feature) {
    const supportedFeatures = ['videoTitle', 'videoDescription', 'tags', 'coverImage'];
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
