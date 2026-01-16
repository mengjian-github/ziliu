/**
 * 内容处理服务 - 处理文章数据转换和格式化
 * 从 core/app.js 中移出的业务逻辑
 */
class ZiliuContentService {
  constructor() {
    console.log('🔧 内容处理服务初始化');
  }

  /**
   * 处理内容数据
   */
  async processContentData(data, currentPlatform, selectedPreset) {
    // 如果传入的是articleId，需要获取完整的文章数据
    if (data.articleId) {
      console.log('🔍 获取文章详情:', data.articleId);
      return await this.processArticleData(data, currentPlatform, selectedPreset);
    }

    // 直接使用传入的数据，但确保有预设信息
    return {
      ...data,
      preset: data.preset || selectedPreset
    };
  }

  /**
   * 处理文章数据
   */
  async processArticleData(data, currentPlatform, selectedPreset) {
    try {
      // 获取文章详情
      const articleDetail = await this.fetchArticleDetail(data.articleId);

      // 根据平台类型决定处理方式
      const platformId = currentPlatform?.id;
      const isVideoPlatform = ['video_wechat', 'douyin', 'bilibili', 'xiaohongshu', 'youtube'].includes(platformId);

      console.log('🔍 平台类型分析:', {
        platformId,
        isVideoPlatform,
        displayName: currentPlatform?.displayName
      });

      let baseData = {};

      if (isVideoPlatform) {
        // 视频平台：获取AI转换后的视频数据
        console.log('📹 处理视频平台数据，获取AI转换后的视频内容');
        const videoData = await this.getVideoContent(data.articleId, platformId);

        // 同时保留原始文章数据作为回退
        baseData = {
          title: articleDetail.title,
          content: articleDetail.originalContent || articleDetail.content,
          // 包含AI转换后的视频数据
          ...videoData
        };
      } else {
        // 普通平台：根据平台 contentType 决定使用 HTML / Markdown / 纯文本
        const sourceContent = articleDetail.originalContent || articleDetail.content;
        const platformContentType = currentPlatform?.contentType || 'html';

        // 获取原始Markdown（短文本/Markdown 平台更可靠）
        let originalMarkdown = '';
        try {
          const markdownData = await this.fetchArticleMarkdown(data.articleId);
          originalMarkdown = markdownData.content || '';
        } catch (error) {
          console.warn('获取原始Markdown失败，将使用文章内容回退:', error);
          originalMarkdown = '';
        }

        // 获取预设信息（用于短文本/Markdown 平台拼接开头/结尾）
        const preset = data.preset || selectedPreset;

        let contentForFill = '';
        let shortData = null;

        if (platformContentType === 'html') {
          // HTML 平台：走 convert API 生成内联样式
          const targetFormat = platformId === 'zhihu' ? 'zhihu' : 'wechat';
          console.log('📝 处理普通平台数据，转换为HTML格式:', targetFormat);

          contentForFill = await this.convertArticleFormat(
            sourceContent,
            targetFormat,
            articleDetail.style || 'default'
          );
        } else if (platformContentType === 'markdown') {
          contentForFill = originalMarkdown || sourceContent || '';
          contentForFill = this.applyPresetToContent(contentForFill, preset, 'markdown');
        } else if (platformContentType === 'text') {
          // 短图文平台：
          // 1. 优先尝试从后端获取已保存的短图文内容（对应预览时的结果）
          // 2. 如果没有保存的内容，则调用生成接口（适用于直接填充场景）
          const markdown = originalMarkdown || sourceContent || '';

          // 核心优化点：优先使用传入的生成内容 (Preview -> Publish flow)
          if (data.generatedContent && Object.keys(data.generatedContent).length > 0) {
            console.log('✅ 复用网页端传递的预览内容');
            shortData = data.generatedContent;
          } else {
            // 尝试从后端获取已保存的内容
            try {
              if (platformId) {
                shortData = await this.getShortTextContent(data.articleId, platformId);
              }
            } catch (error) {
              console.warn('获取短图文内容失败:', error);
              shortData = null;
            }
          }

          const baseText = shortData?.content ? shortData.content : this.markdownToPlainText(markdown);
          contentForFill = this.applyPresetToContent(baseText, preset, 'text');
        } else {
          // 未知类型：尽量用Markdown回退
          contentForFill = originalMarkdown || sourceContent || '';
        }

        baseData = {
          // 若 AI 返回了平台化标题（如小红书图文），优先使用
          title: (platformContentType === 'text' && typeof shortData?.title === 'string' && shortData.title.trim())
            ? shortData.title
            : articleDetail.title,
          content: contentForFill,
          // 额外字段：短图文可用
          tags: platformContentType === 'text' ? (shortData?.tags || []) : undefined,
          images: platformContentType === 'text' ? (shortData?.images || []) : undefined,
          originalMarkdown: originalMarkdown
        };
      }

      // 获取预设信息
      const preset = data.preset || selectedPreset;

      // 构建完整的填充数据
      return {
        ...baseData,
        author: data.author || preset?.authorName,
        preset: preset,
        style: articleDetail.style || 'default'  // 确保传递文章样式
      };
    } catch (error) {
      console.error('❌ 处理文章数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取文章详情
   */
  async fetchArticleDetail(articleId) {
    const response = await ZiliuApiService.articles.get(articleId, 'inline');
    if (!response.success) {
      throw new Error(response.error || '获取文章详情失败');
    }
    return response.data;
  }

  /**
   * 转换文章格式
   */
  async convertArticleFormat(content, targetFormat, style = 'default') {
    const response = await ZiliuApiService.content.convert(content || '', targetFormat, style);

    if (!response.success) {
      throw new Error(response.error || '格式转换失败');
    }

    // 按照legacy的逻辑，返回inlineHtml字段
    if (response.data?.inlineHtml) {
      console.log('✅ 使用 convert API 生成内联样式 HTML');
      return response.data.inlineHtml;
    } else {
      console.warn('⚠️ convert API 返回格式异常，使用原始内容');
      return content; // 回退到原始内容
    }
  }

  /**
   * 获取文章Markdown
   */
  async fetchArticleMarkdown(articleId) {
    const response = await ZiliuApiService.articles.get(articleId, 'raw');
    if (!response.success) {
      throw new Error(response.error || '获取Markdown失败');
    }
    return response.data;
  }

  /**
   * 获取视频平台的AI转换后内容
   */
  async getVideoContent(articleId, platform) {
    try {
      console.log('🎬 获取视频平台内容:', { articleId, platform });

      // 通过background script发送API请求，避免CORS问题
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          data: {
            method: 'GET',
            endpoint: `/api/video/content?articleId=${articleId}&platform=${platform}`
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (!response.success) {
        throw new Error(response.error || '获取视频内容失败');
      }

      console.log('🎬 获取到的视频数据:', response.data);

      // 转换API数据格式到插件期望的格式
      return {
        videoTitle: response.data.title,
        videoDescription: response.data.description,
        speechScript: response.data.speechScript,
        tags: response.data.tags,
        coverSuggestion: response.data.coverSuggestion,
        coverImage: response.data.coverImage,
        coverImage169: response.data.coverImage169,
        coverImage43: response.data.coverImage43,
        platformTips: response.data.platformTips,
        estimatedDuration: response.data.estimatedDuration
      };

    } catch (error) {
      console.error('❌ 获取视频内容失败:', error);
      // 如果获取失败，返回空的视频数据结构，让插件能够继续运行
      return {
        videoTitle: '',
        videoDescription: '',
        speechScript: '',
        tags: [],
        coverSuggestion: '',
        platformTips: [],
        estimatedDuration: 0
      };
    }
  }

  /**
   * 通用API请求助手
   */
  async apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'apiRequest',
        data: {
          method,
          endpoint,
          body
        }
      }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(resp);
        }
      });
    });
  }

  /**
   * 获取短图文平台的 AI 改写后内容 + 图片列表
   * 通过 background script 代理请求（避免CORS/cookie问题）
   */
  async getShortTextContent(articleId, platform) {
    try {
      console.log('🧩 获取短图文平台内容:', { articleId, platform });

      // 1. 尝试获取已保存的内容
      let response = await this.apiRequest('GET', `/api/short-text/content?articleId=${articleId}&platform=${platform}`);

      if (!response.success && response.error === '未找到内容') {
        // 2. 如果未找到，则尝试生成 (Legacy fallback)
        console.log('⚠️ 未找到已保存内容，尝试实时生成...');
        response = await this.apiRequest('POST', '/api/short-text/generate', { articleId, platform });
      }

      if (!response || !response.success) {
        throw new Error(response?.error || '获取短图文内容失败');
      }

      const data = response.data || {};
      return {
        title: data.title || '',
        content: data.content || '',
        tags: data.tags || [],
        images: data.images || []
      };
    } catch (error) {
      console.error('❌ 获取短图文内容失败:', error);
      // 尝试打印更详细的错误堆栈，帮助排查 API 问题
      if (error && error.message) console.error('Error details:', error.message);
      return {
        title: '',
        content: '',
        tags: [],
        images: []
      };
    }
  }

  /**
   * 将 Markdown 粗略转换为纯文本（用于短图文平台）
   */
  markdownToPlainText(markdown) {
    if (!markdown) return '';
    const text = String(markdown);

    return text
      // 移除代码块（保留代码块中的纯文本会让短文案过长，先整体去掉）
      .replace(/```[\s\S]*?```/g, '')
      // 行内代码
      .replace(/`([^`]+)`/g, '$1')
      // 图片：![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1')
      // 链接：[text](url) -> text (url)
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)')
      // 引用/标题标记
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      // 粗体/斜体
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // HTML 标签兜底清理
      .replace(/<[^>]*>/g, '')
      // 多余空行与空格
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 按平台内容类型应用预设开头/结尾
   */
  applyPresetToContent(content, preset, contentType) {
    if (!preset) return content;

    let result = content || '';

    const header = preset.headerContent || '';
    const footer = preset.footerContent || '';

    if (contentType === 'text') {
      const headerText = header ? this.markdownToPlainText(header) : '';
      const footerText = footer ? this.markdownToPlainText(footer) : '';

      if (headerText) result = `${headerText}\n\n${result}`;
      if (footerText) result = `${result}\n\n${footerText}`;
      return result.trim();
    }

    // markdown：直接拼接
    if (header) result = `${header}\n\n${result}`;
    if (footer) result = `${result}\n\n${footer}`;
    return result.trim();
  }
}

// 全局内容服务实例
window.ZiliuContentService = new ZiliuContentService();
