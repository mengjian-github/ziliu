/**
 * YouTube Studio 平台插件
 * 说明：
 * - YouTube Studio 使用 Web Components + Shadow DOM，普通 querySelector 很难直接拿到输入框
 * - 这里通过深度遍历 Shadow Root 的方式查找“标题/简介/标签”输入
 */
class YouTubePlatformPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.platformType = 'video';
  }

  static get metadata() {
    return {
      version: '1.0.0',
      description: 'YouTube Studio 平台专用插件（Shadow DOM 适配）'
    };
  }

  /**
   * 深度查询（包含 Shadow DOM）
   */
  querySelectorAllWithShadow(selector, root = document) {
    const results = new Set();

    const search = (node) => {
      if (!node) return;

      // 1. 在当前节点（或 ShadowRoot）上查找
      try {
        if (typeof node.querySelectorAll === 'function') {
          node.querySelectorAll(selector).forEach(el => results.add(el));
        }
      } catch (_) {
        // ignore invalid selectors
      }

      // 2. 如果该节点有 ShadowRoot，进入其中查找
      if (node.shadowRoot) {
        search(node.shadowRoot);
      }

      // 3. 遍历所有子节点，检查它们是否有 ShadowRoot
      try {
        const children = node.querySelectorAll ? node.querySelectorAll('*') : [];
        children.forEach(el => {
          if (el && el.shadowRoot) {
            search(el.shadowRoot);
          }
        });
      } catch (_) {
        // ignore
      }
    };

    search(root);
    return Array.from(results);
  }

  isVisible(element) {
    try {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    } catch (e) {
      return true;
    }
  }

  matchAny(text, keywords) {
    if (!text) return false;
    const lower = String(text).toLowerCase();
    return keywords.some(k => lower.includes(String(k).toLowerCase()));
  }

  findInputByLabelKeywords(keywords) {
    const candidates = this.querySelectorAllWithShadow('textarea, input, div[contenteditable="true"]');

    // 优先找可见的
    const visible = candidates.filter(el => this.isVisible(el));

    const allCandidates = visible.length > 0 ? visible : candidates;

    // 先用 aria-label / placeholder 精确匹配
    for (const el of allCandidates) {
      const aria = el.getAttribute?.('aria-label') || '';
      const placeholder = el.getAttribute?.('placeholder') || '';
      const title = el.getAttribute?.('title') || '';
      const dataLabel = el.getAttribute?.('data-label') || '';
      const text = el.innerText || '';

      if (
        this.matchAny(aria, keywords) ||
        this.matchAny(placeholder, keywords) ||
        this.matchAny(title, keywords) ||
        this.matchAny(dataLabel, keywords)
      ) {
        return el;
      }
    }

    return null;
  }

  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 针对 YouTube Studio 的特殊优化：
    // Title 和 Description 都是 div[contenteditable="true"]，且在特定的 component 下
    const titleContainer = this.querySelectorAllWithShadow('ytcp-social-suggestions-textbox#title-textarea').shift();
    if (titleContainer) {
      elements.elements.title = this.querySelectorAllWithShadow('div#textbox', titleContainer).shift();
    }

    const descContainer = this.querySelectorAllWithShadow('ytcp-social-suggestions-textbox#description-textarea').shift();
    if (descContainer) {
      elements.elements.description = this.querySelectorAllWithShadow('div#textbox', descContainer).shift();
    }

    // 如果没找到，尝试模糊匹配
    if (!elements.elements.title) {
      elements.elements.title = this.findInputByLabelKeywords(['title', '标题', 'video title', 'add a title']);
    }
    if (!elements.elements.description) {
      elements.elements.description = this.findInputByLabelKeywords(['description', '描述', '说明', '介绍', 'video description', 'add a description']);
    }

    // Tags 往往需要点击 "SHOW MORE" 才会出现
    elements.elements.tags = this.findInputByLabelKeywords(['tags', '标签', 'add tags']);

    elements.isEditor = !!(elements.elements.title || elements.elements.description);

    console.log('🔍 YouTube Studio 编辑器检测结果:', {
      title: !!elements.elements.title,
      description: !!elements.elements.description,
      tags: !!elements.elements.tags,
      isEditor: elements.isEditor,
      url: window.location.href
    });

    return elements;
  }

  async _waitForEditor() {
    const maxWaitTime = this.specialHandling?.maxWaitTime || 15000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        const found = this._findElements();
        if (found.isEditor) {
          resolve(found);
          return;
        }
        if (Date.now() - startTime >= maxWaitTime) {
          resolve(found);
          return;
        }
        setTimeout(check, 500);
      };
      check();
    });
  }

  async fillContent(data) {
    console.log('🎬 开始填充 YouTube Studio 内容:', data);

    const elements = (this.specialHandling?.waitForEditor)
      ? await this._waitForEditor()
      : this._findElements();

    if (!elements.isEditor) {
      throw new Error('未检测到 YouTube Studio 上传详情页的标题/简介输入框（请先进入上传详情页）');
    }

    const results = {};

    const videoTitle = (data.videoTitle || data.title || '').toString();
    const videoDescription = (data.videoDescription || data.content || '').toString();
    const tags = data.tags || data.videoTags || [];

    if (elements.elements.title && videoTitle) {
      const max = this.specialHandling?.titleLimit?.max || 100;
      const processedTitle = videoTitle.length > max ? videoTitle.slice(0, max) : videoTitle;
      results.title = await this.fillVideoTitle(elements.elements.title, processedTitle);
    }

    if (elements.elements.description && videoDescription) {
      const max = this.specialHandling?.contentLimit?.max || 5000;
      const processedDesc = videoDescription.length > max ? videoDescription.slice(0, max) : videoDescription;
      results.description = await this.fillVideoDescription(elements.elements.description, processedDesc);
    }

    // 尝试填充 Tags
    let tagsElement = elements.elements.tags;
    if (!tagsElement) {
      // 尝试展开“更多选项”以显示标签
      await this.revealMoreOptions();
      await this.delay(1000);
      const reFound = this._findElements();
      tagsElement = reFound.elements.tags;
    }

    if (tagsElement && tags) {
      let tagsArray = [];
      if (typeof tags === 'string') {
        try {
          tagsArray = JSON.parse(tags);
        } catch (e) {
          tagsArray = tags.split(/[,，\s]+/).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }

      // YouTube tags 通常用逗号分隔
      if (tagsArray.length > 0) {
        const tagsText = tagsArray.slice(0, 15).join(', ');
        results.tags = await this.fillVideoTitle(tagsElement, tagsText);
      }
    }

    return results;
  }

  async revealMoreOptions() {
    try {
      const buttons = this.querySelectorAllWithShadow('ytcp-button#toggle-button');
      for (const btn of buttons) {
        const text = btn.innerText || '';
        if (text.includes('更多选项') || text.includes('SHOW MORE')) {
          console.log('🔘 正在点击“更多选项”...');
          btn.click();
          return true;
        }
      }
    } catch (e) {
      console.warn('点击展开更多选项失败:', e);
    }
    return false;
  }

  async fillVideoTitle(element, title) {
    try {
      await this.setEditorContent(element, title);
      await this.delay(150);
      return { success: true, value: title };
    } catch (error) {
      console.error('YouTube 标题/标签填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  async fillVideoDescription(element, description) {
    try {
      await this.setEditorContent(element, description);
      await this.delay(150);
      return { success: true, value: description };
    } catch (error) {
      console.error('YouTube 简介填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  async copyArticleContent(articleId) {
    try {
      console.log('📋 YouTube 平台复制内容，文章ID:', articleId);

      // 优先复制已生成的视频文案（标题/简介/标签）
      let videoData = null;
      try {
        const response = await window.ZiliuApiService.makeRequest(`/api/video/content?articleId=${articleId}&platform=youtube`, { method: 'GET' });
        if (response?.success && response.data) {
          videoData = response.data;
        }
      } catch (e) {
        // ignore，走降级
      }

      let contentToCopy = '';

      if (videoData) {
        const tags = Array.isArray(videoData.tags) ? videoData.tags : (videoData.tags || []);
        const hashTags = (tags || []).map(t => `#${t}`).join(' ');

        contentToCopy = [
          videoData.title ? `Title: ${videoData.title}` : '',
          videoData.description ? `\n${videoData.description}` : '',
          hashTags ? `\n\n${hashTags}` : ''
        ].join('').trim();
      } else {
        // 降级：使用基类复制（文章原始内容）
        const fallback = await super.copyArticleContent(articleId);
        contentToCopy = fallback.content || '';
      }

      // 应用预设内容（直接拼接，保留用户自定义格式）
      const currentPreset = window.ZiliuApp?.getSelectedPreset?.();
      if (currentPreset) {
        if (currentPreset.headerContent) {
          contentToCopy = currentPreset.headerContent + '\n\n' + contentToCopy;
        }
        if (currentPreset.footerContent) {
          contentToCopy += '\n\n' + currentPreset.footerContent;
        }
      }

      await navigator.clipboard.writeText(contentToCopy);
      return {
        success: true,
        content: contentToCopy,
        format: 'text',
        message: 'YouTube 文案已复制到剪贴板！'
      };
    } catch (error) {
      console.error('YouTube 复制失败:', error);
      return { success: false, error: error.message, message: '复制失败: ' + error.message };
    }
  }
}

// 配置驱动的自动注册（仅在当前 URL 命中时注册）
if (window.ZiliuPlatformRegistry && window.ZiliuPluginConfig) {
  const youtubeConfig = window.ZiliuPluginConfig.platforms.find(p => p.id === 'youtube');

  if (youtubeConfig && youtubeConfig.enabled) {
    const shouldRegister = youtubeConfig.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(window.location.href);
      } catch (e) {
        return false;
      }
    });

    if (shouldRegister) {
      console.log('🔧 注册 YouTube Studio 专用插件（配置驱动）');
      const youtubePlugin = new YouTubePlatformPlugin(youtubeConfig);
      window.ZiliuPlatformRegistry.register(youtubePlugin);
    }
  }
}

window.YouTubePlatformPlugin = YouTubePlatformPlugin;

