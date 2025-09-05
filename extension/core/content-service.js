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
      const isVideoPlatform = ['video_wechat', 'douyin', 'bilibili', 'xiaohongshu'].includes(platformId);
      
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
        // 普通平台：处理文章格式转换
        const targetFormat = platformId === 'zhihu' ? 'zhihu' : 'wechat';
        console.log('📝 处理普通平台数据，转换格式:', targetFormat);
        
        const sourceContent = articleDetail.originalContent || articleDetail.content;
        const convertedContent = await this.convertArticleFormat(
          sourceContent,
          targetFormat,
          articleDetail.style || 'default'
        );

        // 获取原始Markdown
        let originalMarkdown = '';
        try {
          const markdownData = await this.fetchArticleMarkdown(data.articleId);
          originalMarkdown = markdownData.content || '';
        } catch (error) {
          console.warn('获取原始Markdown失败，将使用HTML内容:', error);
        }

        baseData = {
          title: articleDetail.title,
          content: convertedContent,
          originalMarkdown: originalMarkdown
        };
      }

      // 获取预设信息
      const preset = data.preset || selectedPreset;
      
      // 构建完整的填充数据
      return {
        ...baseData,
        author: data.author || preset?.author,
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
}

// 全局内容服务实例
window.ZiliuContentService = new ZiliuContentService();