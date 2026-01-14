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
      // 封面上传触发器
      coverTrigger: [
        '.cover-main-img .edit-text',
        '.cover-main-img',
        '.upload-cover-btn'
      ],
      // 封面上传输入框
      cover: [
        '.bcc-upload-wrapper input[type="file"][accept*="image"]',
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

    // 查找封面触发器
    for (const selector of selectors.coverTrigger) {
      const element = document.querySelector(selector);
      if (element) {
        elements.coverTrigger = element;
        console.log('🎯 找到B站封面触发器:', selector);
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

      // 填充封面 (支持16:9和4:3)
      const cover169 = data.coverImage169 || data.coverImage;
      const cover43 = data.coverImage43;

      if (cover169 || cover43) {
        results.cover = await this.fillCover(elements, cover169, cover43);
        if (results.cover.success) {
          fillCount++;
          console.log('✅ B站封面填充完成 (包含多规格)');
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
   * 填充封面图片 - 升级版：优先使用API上传并注入Vue状态
   */
  async fillCover(elements, imageUrl169, imageUrl43) {
    try {
      console.log('🖼️ 开始尝试填充封面 (16:9 & 4:3)');
      console.log('🖼️ 16:9 资源:', imageUrl169?.substring(0, 30) + '...');
      console.log('🖼️ 4:3 资源:', imageUrl43?.substring(0, 30) + '...');

      // 1. 获取CSRF Token
      const csrf = this.getCSRF();
      if (!csrf) {
        console.warn('⚠️ 未找到CSRF Token，无法使用API方式，切换到UI模拟');
        return await this.fillCoverByUI(elements, imageUrl169, imageUrl43);
      }
      console.log('🔑 CSRF Token 获取成功');

      // 2. 上传封面到B站服务器
      const uploadCover = async (url, label) => {
        if (!url) return null;
        try {
          console.log(`🚀 正在上传 ${label} 到B站...`);
          const blob = await this.fetchImageBlob(url);
          const reader = new FileReader();
          const base64Data = await new Promise(r => {
            reader.onloadend = () => r(reader.result);
            reader.readAsDataURL(blob);
          });

          const formData = new URLSearchParams();
          formData.append('cover', base64Data);
          formData.append('csrf', csrf);

          const response = await fetch('https://member.bilibili.com/x/vu/web/cover/up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
          const result = await response.json();
          if (result.code === 0 && result.data?.url) {
            console.log(`✅ ${label} 上传成功:`, result.data.url);
            return result.data.url;
          } else {
            console.error(`❌ ${label} API上传失败:`, result);
            return null;
          }
        } catch (err) {
          console.error(`❌ ${label} 上传过程出错:`, err);
          return null;
        }
      };

      const [uploadedUrl169, uploadedUrl43] = await Promise.all([
        uploadCover(imageUrl169, '16:9 封面'),
        uploadCover(imageUrl43, '4:3 封面')
      ]);

      if (!uploadedUrl169 && !uploadedUrl43) {
        console.warn('⚠️ 所有API上传尝试均失败，转入UI模拟');
        return await this.fillCoverByUI(elements, imageUrl169, imageUrl43);
      }

      // 3. 注入Vue状态
      const success = await this.injectCoverToVue(uploadedUrl169, uploadedUrl43);
      if (success) {
        console.log('✨ Vue状态注入成功，封面已更新');
        return { success: true };
      }

      console.warn('⚠️ Vue注入未生效，最后尝试UI模拟交互');
      return await this.fillCoverByUI(elements, imageUrl169, imageUrl43);

    } catch (error) {
      console.error('❌ fillCover 执行异常:', error);
      return await this.fillCoverByUI(elements, imageUrl169, imageUrl43);
    }
  }

  /**
   * 通过UI模拟方式填充封面（回退方案）
   */
  async fillCoverByUI(elements, imageUrl169, imageUrl43) {
    try {
      console.log('🖱️ 进入UI模拟填充流程 (16:9 & 4:3)...');

      const uploadToFileInput = async (imageUrl, label) => {
        if (!imageUrl) return false;
        // B站弹出层可能会有多个 input，选择当前可见或最后一个
        const inputs = Array.from(document.querySelectorAll(this.getSelectors().cover.join(',')))
          .filter(el => el.offsetParent !== null); // 仅查找可见的
        const currentInput = inputs[inputs.length - 1] || document.querySelector(this.getSelectors().cover.join(','));

        if (!currentInput) {
          console.warn(`⚠️ [${label}] 未找到有效的封面输入框`);
          return false;
        }

        try {
          const blob = await this.fetchImageBlob(imageUrl);
          const file = new File([blob], 'cover.png', { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          currentInput.files = dataTransfer.files;
          currentInput.dispatchEvent(new Event('change', { bubbles: true }));
          currentInput.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(`✅ [${label}] UI模拟上传成功`);
          return true;
        } catch (e) {
          console.error(`❌ [${label}] UI上传到Input失败:`, e);
          return false;
        }
      };

      // 1. 打开编辑器弹窗
      let modal = document.querySelector('.bcc-modal-wrapper, .cover-editor-container, .v-modal');
      if (!modal) {
        const trigger = elements.coverTrigger || document.querySelector(this.getSelectors().coverTrigger.join(','));
        if (trigger) {
          console.log('🖱️ 点击封面触发器以打开编辑器');
          trigger.click();
          await this.sleep(2000); // B站封面编辑器加载较慢
        }
      }

      // 2. 尝试关闭“同步”功能，防止一张图覆盖另一张
      await this.disableSync();

      const selectRatioArea = async (ratioText) => {
        console.log(`🔍 正在寻找比例区域: [${ratioText}]`);
        const is169 = ratioText.includes('16:9');
        const id = is169 ? 'editor_16_9' : 'editor_4_3';
        const type = is169 ? 'space' : 'home';
        const area = document.getElementById(id);

        if (area) {
          console.log(`🖱️ 尝试切换焦点到: ${id} (${type})`);

          // 1. 尝试直接修改 Vue 状态 (最快最准)
          let vue = area.__vue__;
          let el = area;
          while (!vue && el) {
            vue = el.__vue__;
            el = el.parentElement;
          }
          if (vue) {
            // 向上寻找包含 activeType 的实例
            while (vue && vue.activeType === undefined && vue.$parent) vue = vue.$parent;
            if (vue && vue.activeType !== undefined) {
              console.log(`🧪 直接通过 Vue 设置 activeType = ${type}`);
              vue.activeType = type;
              if (vue.$forceUpdate) vue.$forceUpdate();
            }
          }

          // 2. 模拟物理点击 (触发 UI 动画和内部逻辑)
          // 优先寻找 upper-canvas，这是 Fabric.js 响应交互的层
          const target = area.querySelector('.upper-canvas') || area.querySelector('canvas') || area;

          const rect = target.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;

          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            target.dispatchEvent(new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: x,
              clientY: y
            }));
          });

          await this.sleep(1000);
          return true;
        }

        // 备选方案
        const headers = Array.from(document.querySelectorAll('div, span, p'))
          .filter(el => el.textContent.includes(ratioText));
        for (const header of headers) {
          const container = header.parentElement?.nextElementSibling || header.closest('.ratio-item');
          if (container) {
            container.click();
            await this.sleep(1000);
            return true;
          }
        }
        return false;
      };

      // 3. 分别上传 (重点：先点区域切换，再操作 input)
      if (imageUrl43) {
        await selectRatioArea('4:3');
        await uploadToFileInput(imageUrl43, '4:3 首页推荐');
        await this.sleep(1500);
      }

      if (imageUrl169) {
        await selectRatioArea('16:9');
        await uploadToFileInput(imageUrl169, '16:9 个人空间');
        await this.sleep(1500);
      }

      // 4. 尝试寻找“完成”按钮并确认
      const finishBtn = Array.from(document.querySelectorAll('.bcc-button, button'))
        .find(el => el.textContent.trim() === '完成');
      if (finishBtn) {
        console.log('🖱️ 点击“完成”按钮关闭编辑器');
        finishBtn.click();
      }

      return { success: true };
    } catch (error) {
      console.error('❌ UI封面填充执行异常:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 尝试关闭B站封面编辑器的同步功能
   */
  async disableSync() {
    try {
      // B站这里通常是一个 .vue-slider 组件进行同步控制
      const syncContainer = Array.from(document.querySelectorAll('div, span'))
        .find(el => el.textContent.trim() === '同步')?.parentElement;

      if (syncContainer) {
        const slider = syncContainer.querySelector('.vue-slider-rail, .vue-slider-dot');
        // 检查是否开启：看 slider 的状态或样式
        // 简单暴力：如果存在且没处理过，点一下尝试关闭
        // 更好的逻辑：检查 vue-slider-process 的宽度或 dot 的位置
        const process = syncContainer.querySelector('.vue-slider-process');
        const isActive = process && parseFloat(process.style.width) > 0;

        if (isActive || !process) { // 如果无法判断，保守点一下
          console.log('🖱️ 确认同步状态... 尝试点击关闭');
          if (slider) slider.click();
          await this.sleep(500);
        }
      }
    } catch (e) {
      console.warn('无法操作同步按钮:', e);
    }
  }

  /**
   * 将上传后的URL注入到Vue组件状态中
   */
  async injectCoverToVue(url169, url43) {
    try {
      console.log('🧪 启动全页面Vue状态探测注入');

      const setCoverDeep = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        let changed = false;

        // 探测所有可能的键名
        const coverKeys = ['cover', 'cover_url', 'coverUrl', 'recom_cover', 'archive_cover'];
        const indexKeys = ['index_cover', 'indexCover', 'recom_index_cover', 'archive_index_cover'];

        for (const key of coverKeys) {
          if (key in obj && url169) {
            console.log(`🎯 匹配到16:9键名 [${key}]`);
            obj[key] = url169;
            changed = true;
          }
        }
        for (const key of indexKeys) {
          if (key in obj && url43) {
            console.log(`🎯 匹配到4:3键名 [${key}]`);
            obj[key] = url43;
            changed = true;
          }
        }

        // 递归探测一级子对象
        const subObjs = ['videoInfo', 'archiveInfo', 'archive_info', 'archive', 'submitData', 'video_info'];
        for (const subKey of subObjs) {
          if (obj[subKey] && typeof obj[subKey] === 'object') {
            changed = setCoverDeep(obj[subKey]) || changed;
          }
        }

        return changed;
      };

      let injectionCount = 0;
      const rootSelectors = ['#app', '.video-up-app', '.york-video-up', 'body'];
      for (const selector of rootSelectors) {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
          let curr = el;
          for (let i = 0; i < 3; i++) {
            if (!curr) break;
            const vue = curr.__vue__;
            if (vue) {
              const targets = [vue, vue.$root];
              for (const target of targets) {
                // 注入前先确保设置正确的 activeType 以避免 UI 渲染冲突
                if (url43 && target.activeType !== undefined) target.activeType = 'home';

                if (setCoverDeep(target)) {
                  console.log('✅ 在Vue实例中成功注入数据');
                  injectionCount++;

                  // 针对B站的 Vue 实例，尝试触发特定的更新方法
                  if (target.recomputeCover) target.recomputeCover();
                  if (target.onCoverUpSuccess) {
                    if (url169) target.onCoverUpSuccess(url169, 'space');
                    if (url43) target.onCoverUpSuccess(url43, 'home');
                  }

                  if (vue.$forceUpdate) vue.$forceUpdate();
                }
              }
            }
            curr = curr.parentElement;
          }
        }
      }

      return injectionCount > 0;
    } catch (e) {
      console.error('❌ Vue探测注入时发生错误:', e);
      return false;
    }
  }

  /**
   * 获取B站CSRF Token
   */
  getCSRF() {
    const match = document.cookie.match(/bili_jct=([^;]+)/);
    return match ? match[1] : null;
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
      // 优先尝试注入Vue以避开 "Untrusted event" 错误
      let curr = tagInput;
      let vue = null;
      while (curr && !vue) {
        vue = curr.__vue__;
        curr = curr.parentElement;
      }

      if (vue && vue.$parent && vue.$parent.tags !== undefined) {
        console.log('🧪 探测到标签输入的Vue实例，尝试直接注入标签');
        const tags = vue.$parent.tags;
        if (Array.isArray(tags) && !tags.includes(tagText)) {
          tags.push(tagText);
          if (vue.$parent.$forceUpdate) vue.$parent.$forceUpdate();
          return true;
        }
      }

      // 如果Vue注入不成功，回退到模拟按键
      console.log('🖱️ 模拟按键填充标签:', tagText);
      tagInput.focus();
      await this.sleep(100);
      tagInput.value = tagText;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(200);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      tagInput.dispatchEvent(enterEvent);
      await this.sleep(300);
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