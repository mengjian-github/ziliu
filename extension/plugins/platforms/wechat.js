/**
 * 微信公众号平台插件
 * 支持新旧编辑器的智能识别和填充
 */
class WeChatPlatformPlugin extends BasePlatformPlugin {

  static get metadata() {
    return {
      version: '1.0.0',
      description: '微信公众号平台专用插件，支持ProseMirror和UEditor'
    };
  }

  /**
   * 微信特有的元素查找逻辑
   */
  _findElements() {
    // 强制清除缓存，确保使用最新的查找逻辑
    this.cachedElements = null;
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 查找标题输入框
    elements.elements.title = this.findElement('#title');
    
    // 查找作者输入框
    elements.elements.author = this.findElement('#author');

    // 查找内容编辑器 - 支持新旧编辑器
    elements.elements.content = this.findContentEditor();

    // 查找摘要输入框
    elements.elements.digest = this.findElementFromSelectors([
      'textarea[name="digest"]',
      '#js_description', 
      'textarea[placeholder*="选填"]'
    ]);

    // 特殊处理：查找富文本编辑器iframe（旧版UEditor）
    const editorIframe = this.findElement('#ueditor_0 iframe');
    if (editorIframe) {
      try {
        elements.elements.editorBody = editorIframe.contentDocument?.body;
      } catch (e) {
        console.warn('无法访问编辑器iframe:', e);
      }
    }

    // 验证是否是微信编辑器
    elements.isEditor = !!(elements.elements.title && elements.elements.content);

    console.log('🔍 微信编辑器检测结果:', {
      title: !!elements.elements.title,
      author: !!elements.elements.author,
      content: !!elements.elements.content,
      contentType: this.getContentEditorType(elements.elements.content),
      contentSelector: this.getContentElementInfo(elements.elements.content),
      digest: !!elements.elements.digest,
      editorBody: !!elements.elements.editorBody,
      isEditor: elements.isEditor
    });

    return elements;
  }

  /**
   * 查找内容编辑器
   */
  findContentEditor() {
    console.log('🔍 开始查找微信内容编辑器...');
    
    // 直接调试：列出所有contenteditable元素
    const allContentEditables = document.querySelectorAll('[contenteditable="true"]');
    console.log('🔍 页面上所有contenteditable元素:', Array.from(allContentEditables).map(el => ({
      tag: el.tagName,
      id: el.id || 'no-id',
      classes: el.className || 'no-class',
      innerHTML: el.innerHTML?.substring(0, 50) + '...'
    })));
    
    // 1. 优先查找.ProseMirror
    let element = document.querySelector('.ProseMirror');
    if (element) {
      console.log('✅ 找到 .ProseMirror 编辑器');
      return element;
    }
    
    // 2. 查找.rich_media_content .ProseMirror
    element = document.querySelector('.rich_media_content .ProseMirror');
    if (element) {
      console.log('✅ 找到 .rich_media_content .ProseMirror 编辑器');
      return element;
    }
    
    // 3. 手动筛选contenteditable元素，排除不需要的
    for (const el of allContentEditables) {
      // 排除原创声明等元素
      if (el.classList.contains('editor_content_placeholder') ||
          el.classList.contains('original_primary_tips_input') ||
          el.classList.contains('js_reprint_recommend_content')) {
        console.log('🚫 跳过无关元素:', el.className);
        continue;
      }
      
      // 如果是一个合适的编辑器元素
      if (el.innerHTML && el.innerHTML.trim().length < 1000) { // 空编辑器或少量占位内容
        console.log('✅ 找到候选编辑器元素:', {
          tag: el.tagName,
          classes: el.className,
          innerHTML: el.innerHTML?.substring(0, 100) + '...'
        });
        return el;
      }
    }

    // 4. 回退到旧版UEditor
    element = document.querySelector('#ueditor_0');
    if (element) {
      console.log('✅ 找到UEditor编辑器');
      return element;
    }
    
    console.log('❌ 未找到任何有效的编辑器');
    return null;
  }

  /**
   * 获取内容编辑器类型
   */
  getContentEditorType(contentElement) {
    if (!contentElement) return 'unknown';
    
    if (contentElement.classList.contains('ProseMirror')) {
      return 'ProseMirror';
    } else if (contentElement.id === 'ueditor_0') {
      return 'UEditor';
    } else if (contentElement.contentEditable === 'true') {
      return 'ContentEditable';
    }
    
    return 'unknown';
  }

  /**
   * 获取内容元素详细信息
   */
  getContentElementInfo(contentElement) {
    if (!contentElement) return 'null';
    
    return {
      tag: contentElement.tagName,
      id: contentElement.id || 'no-id',
      classes: contentElement.className || 'no-class',
      contentEditable: contentElement.contentEditable,
      innerHTML: contentElement.innerHTML?.substring(0, 100) + '...'
    };
  }

  /**
   * 微信特有的内容填充逻辑
   */
  async fillContentEditor(contentElement, content, data) {
    const editorType = this.getContentEditorType(contentElement);
    console.log(`📝 微信编辑器类型: ${editorType}`);
    console.log('🔍 接收到的内容详情:', {
      contentLength: content?.length,
      hasContent: !!content,
      contentPreview: content?.substring(0, 100) + '...'
    });

    try {
      // 构建完整内容：开头 + 正文 + 结尾
      let fullContent = content;

      // 如果有预设，应用开头和结尾内容
      if (data.preset) {
        console.log('🔧 应用发布预设:', data.preset.name);

        // 获取文章样式，默认为'default'
        const articleStyle = data.style || 'default';
        console.log('🎨 使用文章样式:', articleStyle);

        // 转换开头内容的Markdown为HTML
        if (data.preset.headerContent) {
          const headerHtml = await this.convertMarkdownToHtml(data.preset.headerContent, articleStyle);
          fullContent = headerHtml + fullContent;
          console.log('✅ 开头内容已添加并转换为HTML');
        }

        // 转换结尾内容的Markdown为HTML
        if (data.preset.footerContent) {
          const footerHtml = await this.convertMarkdownToHtml(data.preset.footerContent, articleStyle);
          fullContent = fullContent + footerHtml;
          console.log('✅ 结尾内容已添加并转换为HTML');
        }
      }

      // 处理特殊语法（如 {{featured-articles:10}}）
      console.log('🔄 处理特殊语法...');
      const processedContent = await this.processSpecialSyntax(fullContent);

      // 转换外链图片
      console.log('🖼️ 转换外链图片...');
      const finalContent = await this.preProcessImages(processedContent, contentElement);

      // 清理HTML内容
      const cleanContent = this.cleanHtmlContent(finalContent);

      switch (editorType) {
        case 'ProseMirror':
          return await this.fillProseMirrorEditor(contentElement, cleanContent);
        
        case 'UEditor':
          return await this.fillUEditor(contentElement, cleanContent, data);
        
        case 'ContentEditable':
          return await this.fillContentEditableEditor(contentElement, cleanContent);
        
        default:
          console.warn('未知的编辑器类型，使用默认方法');
          return await super.fillContentEditor(contentElement, cleanContent, data);
      }
    } catch (error) {
      console.error(`微信内容填充失败 [${editorType}]:`, error);
      throw error;
    }
  }

  /**
   * 填充ProseMirror编辑器
   */
  async fillProseMirrorEditor(element, content) {
    console.log('📝 填充ProseMirror编辑器');
    console.log('🔍 ProseMirror元素详情:', {
      tag: element.tagName,
      classes: element.className,
      contentEditable: element.contentEditable,
      focused: document.activeElement === element,
      originalContent: element.innerHTML?.substring(0, 100) + '...'
    });
    
    element.focus();
    
    // 清空现有内容
    console.log('🧹 清空现有内容');
    element.innerHTML = '';
    
    // 设置新内容
    console.log('📄 设置新内容 (长度:', content.length, ')');
    element.innerHTML = content;
    
    // 验证内容是否设置成功
    console.log('✅ 验证内容设置结果:', {
      newLength: element.innerHTML?.length,
      preview: element.innerHTML?.substring(0, 100) + '...'
    });
    
    // 触发ProseMirror的更新事件
    console.log('🔥 触发更新事件');
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    
    // 额外的更新事件
    const changeEvent = new Event('DOMSubtreeModified', { bubbles: true });
    element.dispatchEvent(changeEvent);

    // 触发微信自动保存和字数更新
    this.triggerWeChatAutoSave(element);

    await this.delay(500);
    return { success: true, value: content, type: 'ProseMirror' };
  }

  /**
   * 填充UEditor编辑器
   */
  async fillUEditor(element, content, data) {
    console.log('📝 填充UEditor编辑器');
    
    // 检查是否有iframe访问权限
    const elements = this.findEditorElements();
    const editorBody = elements.elements.editorBody;
    
    if (editorBody) {
      // 直接操作iframe内的body
      editorBody.innerHTML = content;
      
      // 触发UEditor的更新
      if (window.UE && window.UE.getEditor) {
        try {
          const editor = window.UE.getEditor('ueditor_0');
          if (editor) {
            editor.setContent(content);
          }
        } catch (e) {
          console.warn('UEditor API调用失败:', e);
        }
      }
    } else {
      // 回退方案：尝试设置到主容器
      await this.setEditorContent(element, content);
    }

    await this.delay(1000);
    return { success: true, value: content, type: 'UEditor' };
  }

  /**
   * 填充ContentEditable编辑器
   */
  async fillContentEditableEditor(element, content) {
    console.log('📝 填充ContentEditable编辑器');
    
    element.focus();
    element.innerHTML = content;
    
    // 触发各种可能的事件
    const events = ['input', 'change', 'blur', 'DOMSubtreeModified'];
    for (const eventType of events) {
      try {
        const event = new Event(eventType, { bubbles: true });
        element.dispatchEvent(event);
        await this.delay(100);
      } catch (e) {
        // 某些事件可能不支持，忽略错误
      }
    }

    return { success: true, value: content, type: 'ContentEditable' };
  }

  /**
   * 微信平台的后处理
   */
  async postFillProcess(elements, data, results) {
    console.log('🔧 微信平台后处理...');
    
    // 如果填充了摘要，确保摘要显示区域可见
    if (results.digest?.success && elements.digest) {
      try {
        elements.digest.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        console.warn('滚动到摘要失败:', e);
      }
    }

    // 发送平台特有的事件
    ZiliuEventBus.emit('wechat:fillComplete', {
      results,
      editorType: this.getContentEditorType(elements.content)
    });

    // 发送平台特有的事件
    ZiliuEventBus.emit('wechat:fillComplete', {
      results,
      editorType: this.getContentEditorType(elements.content)
    });

    await this.delay(500);
  }

  /**
   * 微信平台特有的验证逻辑
   */
  validateEditorElements(elements) {
    // 微信编辑器必须有标题和内容编辑器
    const hasRequired = !!(elements.title && elements.content);
    
    // 额外检查：确保内容编辑器是可编辑的
    if (elements.content) {
      const isEditable = elements.content.contentEditable === 'true' || 
                        elements.content.id === 'ueditor_0' ||
                        elements.content.classList.contains('ProseMirror');
      
      return hasRequired && isEditable;
    }
    
    return hasRequired;
  }

  /**
   * 将Markdown转换为HTML
   */
  async convertMarkdownToHtml(markdown, style = 'default') {
    try {
      console.log('🔄 转换Markdown为HTML:', markdown.substring(0, 50) + '...');

      // 使用新的ApiService来调用转换接口
      const data = await window.ZiliuApiService.content.convert(
        markdown,
        'wechat', 
        style
      );

      if (data.success && data.data.inlineHtml) {
        console.log('✅ Markdown转换成功');
        return data.data.inlineHtml;
      } else {
        console.warn('⚠️ Markdown转换失败，使用简单转换');
        return this.simpleMarkdownToHtml(markdown);
      }
    } catch (error) {
      console.warn('⚠️ 调用转换API失败，使用简单转换:', error);
      return this.simpleMarkdownToHtml(markdown);
    }
  }

  /**
   * 简单的Markdown到HTML转换（降级方案）
   */
  simpleMarkdownToHtml(markdown) {
    return markdown
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 引用
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // 分割线
      .replace(/^---$/gim, '<hr>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      // 换行
      .replace(/\n/g, '<br>');
  }

  /**
   * 处理特殊语法
   */
  async processSpecialSyntax(content) {
    // 处理 {{featured-articles:数量}} 语法
    const featuredArticlesRegex = /\{\{featured-articles:(\d+)\}\}/g;

    let processedContent = content;
    let match;

    while ((match = featuredArticlesRegex.exec(content)) !== null) {
      const count = parseInt(match[1]) || 5;
      const placeholder = match[0];

      try {
        // 获取历史文章
        const articles = await this.fetchWeChatArticles(count);

        // 生成文章链接列表（使用p标签但不添加换行）
        const articleLinks = articles.map(article => {
          return `<p><a href="${article.url}" target="_blank">${article.title}</a></p>`;
        }).join('');

        // 替换占位符
        processedContent = processedContent.replace(placeholder, articleLinks);

        console.log(`✅ 已替换 ${placeholder} 为 ${articles.length} 篇历史文章`);
      } catch (error) {
        console.error('获取历史文章失败:', error);
        // 如果失败，保留原始占位符
        processedContent = processedContent.replace(placeholder, `<!-- 获取历史文章失败: ${error.message} -->`);
      }
    }

    return processedContent;
  }

  /**
   * 获取微信公众号历史文章
   */
  async fetchWeChatArticles(count = 5) {
    try {
      // 获取token
      const token = this.getWeChatToken();
      if (!token) {
        throw new Error('未找到微信token');
      }

      // 构建请求URL
      const url = `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&search_field=null&begin=0&count=${count}&query=&fakeid=&type=101_1&free_publish_type=1&sub_action=list_ex&fingerprint=${this.getFingerprint()}&token=${token}&lang=zh_CN&f=json&ajax=1`;

      console.log('🔍 获取历史文章API请求:', count, '篇');

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.base_resp && data.base_resp.ret !== 0) {
        throw new Error(`API错误: ${data.base_resp.err_msg || '未知错误'}`);
      }

      // 解析文章列表
      const articles = [];

      if (data.publish_page) {
        console.log('📄 publish_page 类型:', Array.isArray(data.publish_page) ? '数组' : typeof data.publish_page);

        let publishPageData = data.publish_page;

        // 如果 publish_page 是字符串，先解析成对象
        if (typeof data.publish_page === 'string') {
          try {
            publishPageData = JSON.parse(data.publish_page);
            console.log('✅ publish_page 字符串解析成功');
          } catch (parseError) {
            console.error('❌ publish_page 字符串解析失败:', parseError);
            throw new Error('无法解析publish_page数据');
          }
        }

        let publishList = null;

        // 如果解析后是对象，查找 publish_list
        if (publishPageData && typeof publishPageData === 'object' && !Array.isArray(publishPageData)) {
          if (publishPageData.publish_list && Array.isArray(publishPageData.publish_list)) {
            publishList = publishPageData.publish_list;
            console.log('✅ 找到 publish_list，包含', publishList.length, '项');
          } else {
            console.log('📋 publishPageData 结构:', Object.keys(publishPageData));
          }
        }
        // 如果是数组，直接使用
        else if (Array.isArray(publishPageData)) {
          publishList = publishPageData;
          console.log('✅ publish_page 是数组，包含', publishList.length, '项');
        }

        if (publishList && publishList.length > 0) {
          publishList.forEach((item, index) => {
            console.log(`📖 处理第${index + 1}项:`, Object.keys(item || {}));

            if (!item) return;

            // 尝试不同的文章数据结构
            let articleList = null;

            // 如果有 publish_info，先解析它（可能是JSON字符串）
            if (item.publish_info) {
              let publishInfo = item.publish_info;

              // 如果 publish_info 是字符串，解析成对象
              if (typeof item.publish_info === 'string') {
                try {
                  publishInfo = JSON.parse(item.publish_info);
                  console.log('✅ publish_info 字符串解析成功');
                } catch (parseError) {
                  console.error('❌ publish_info 字符串解析失败:', parseError);
                  publishInfo = null;
                }
              }

              // 从解析后的 publish_info 中获取文章列表
              if (publishInfo && publishInfo.appmsgex && Array.isArray(publishInfo.appmsgex)) {
                articleList = publishInfo.appmsgex;
                console.log('📚 从 publish_info.appmsgex 找到文章组:', articleList.length, '篇');
              }
            }
            // 其他可能的数据结构
            else if (item.appmsgex) {
              articleList = item.appmsgex;
              console.log('📚 从 appmsgex 找到文章组:', articleList.length, '篇');
            } else if (item.articles) {
              articleList = item.articles;
              console.log('📚 从 articles 找到文章组:', articleList.length, '篇');
            } else if (Array.isArray(item)) {
              articleList = item;
              console.log('📚 item 本身是文章数组:', articleList.length, '篇');
            } else if (item.title) {
              // 如果 item 本身就是一篇文章
              articleList = [item];
              console.log('📚 item 本身是一篇文章');
            }

            if (articleList && Array.isArray(articleList)) {
              articleList.forEach(article => {
                if (article && article.title) {
                  articles.push({
                    title: article.title || '无标题',
                    url: article.link || article.url || '#',
                    digest: article.digest || article.summary || '',
                    create_time: article.create_time || article.update_time || 0
                  });
                }
              });
            }
          });
        } else {
          console.log('⚠️ 未找到有效的发布列表数据');
          if (typeof data.publish_page === 'object' && !Array.isArray(data.publish_page)) {
            console.log('📋 可用的 publish_page 字段:', Object.keys(data.publish_page));
          }
        }
      } else {
        console.log('❌ 未找到 publish_page 数据');
        console.log('📋 API响应字段:', Object.keys(data));
      }

      console.log(`✅ 获取到 ${articles.length} 篇历史文章`);
      return articles.slice(0, count);
    } catch (error) {
      console.error('❌ 获取微信历史文章失败:', error);
      return []; // 返回空数组避免阻塞流程
    }
  }

  /**
   * 预处理图片，将外链图片转换为微信CDN
   */
  async preProcessImages(htmlContent) {
    if (!htmlContent) return htmlContent;

    console.log('🔍 开始分析HTML中的图片...');

    // 创建临时DOM来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // 查找所有外链图片
    const images = Array.from(tempDiv.querySelectorAll('img')).filter(img => {
      const src = img.src || img.getAttribute('src');
      return src && !src.includes('mmbiz.qpic.cn') && !src.startsWith('data:') && src.startsWith('http');
    });

    if (images.length === 0) {
      console.log('✅ 没有发现需要转换的外链图片');
      return htmlContent;
    }

    console.log(`🖼️ 发现 ${images.length} 个外链图片，开始转换...`);

    // 显示上传进度UI
    const overlay = this.showUploadProgressOverlay(images.length);

    try {
      // 使用队列管理机制转换所有图片
      const conversionPromises = images.map(async (img, index) => {
        const originalSrc = img.src || img.getAttribute('src');
        console.log(`📤 转换图片 ${index + 1}/${images.length}: ${originalSrc}`);

        try {
          // 更新进度显示
          this.updateUploadProgress(overlay, index, images.length, '开始上传');

          const cdnUrl = await this.uploadImageWithQueue(originalSrc);
          if (cdnUrl) {
            img.src = cdnUrl;
            img.setAttribute('src', cdnUrl);
            
            // 更新进度显示
            this.updateUploadProgress(overlay, index, images.length, '上传成功');
            console.log(`✅ 图片 ${index + 1} 转换成功: ${cdnUrl}`);
            return { success: true, index, originalSrc, newSrc: cdnUrl };
          } else {
            // 更新进度显示
            this.updateUploadProgress(overlay, index, images.length, '上传失败');
            console.warn(`⚠️ 图片 ${index + 1} 转换失败，保留原链接`);
            return { success: false, index, originalSrc, error: '上传返回空结果' };
          }
        } catch (error) {
          // 更新进度显示
          this.updateUploadProgress(overlay, index, images.length, '上传出错');
          console.error(`❌ 图片 ${index + 1} 转换出错:`, error);
          return { success: false, index, originalSrc, error: error.message };
        }
      });

      // 等待所有转换完成
      const results = await Promise.all(conversionPromises);
      const successResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // 显示最终统计
      const stats = this.getUploadStats();
      console.log('📊 图片上传最终统计:', stats);
      
      this.showUploadCompletionMessage(overlay, successResults.length, images.length, failedResults);

      // 延迟隐藏进度UI
      setTimeout(() => {
        this.hideUploadProgressOverlay(overlay);
      }, 3000);

      return tempDiv.innerHTML;

    } catch (error) {
      console.error('❌ 图片预处理过程出错:', error);
      this.hideUploadProgressOverlay(overlay);
      throw error;
    }
  }

  /**
   * 图片上传风控配置
   */
  static get UPLOAD_CONFIG() {
    return {
      // 并发控制
      MAX_CONCURRENT_UPLOADS: 3,
      
      // 重试配置
      MAX_RETRY_ATTEMPTS: 3,
      BASE_DELAY: 1000, // 1秒基础延迟
      MAX_DELAY: 10000, // 最大延迟10秒
      
      // 请求频率限制
      MIN_REQUEST_INTERVAL: 500, // 最小请求间隔500ms
      
      // 上传队列配置
      QUEUE_TIMEOUT: 120000, // 队列超时2分钟
      
      // 错误码配置
      RETRY_ERROR_CODES: [-1, 400001, 400002, 429, 503],
      FATAL_ERROR_CODES: [401, 403, 404]
    };
  }

  constructor(config) {
    // 合并传入的配置和默认的静态配置
    const defaultConfig = WeChatPlatformPlugin.metadata;
    const mergedConfig = { ...defaultConfig, ...config };
    super(mergedConfig);
    
    // 上传状态管理
    this.uploadState = {
      activeUploads: 0,
      uploadQueue: [],
      lastRequestTime: 0,
      totalUploads: 0,
      successUploads: 0,
      failedUploads: 0,
      retryAttempts: new Map(), // 记录每个URL的重试次数
      uploadHistory: new Map() // 防止重复上传相同图片
    };
  }

  /**
   * 智能图片上传队列管理
   */
  async uploadImageWithQueue(imageUrl) {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return new Promise((resolve, reject) => {
      // 检查是否已经上传过相同图片
      if (this.uploadState.uploadHistory.has(imageUrl)) {
        console.log('🔄 复用已上传图片:', imageUrl);
        const cachedUrl = this.uploadState.uploadHistory.get(imageUrl);
        resolve(cachedUrl);
        return;
      }

      // 添加到上传队列
      const uploadTask = {
        id: uploadId,
        imageUrl,
        resolve,
        reject,
        addedAt: Date.now(),
        retryCount: 0
      };

      this.uploadState.uploadQueue.push(uploadTask);
      this.uploadState.totalUploads++;
      
      console.log(`📋 图片加入上传队列: ${uploadId}, 队列长度: ${this.uploadState.uploadQueue.length}`);
      
      // 启动队列处理
      this.processUploadQueue();
    });
  }

  /**
   * 处理上传队列
   */
  async processUploadQueue() {
    // 检查是否可以启动新的上传
    if (this.uploadState.activeUploads >= WeChatPlatformPlugin.UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS ||
        this.uploadState.uploadQueue.length === 0) {
      return;
    }

    // 获取下一个上传任务
    const uploadTask = this.uploadState.uploadQueue.shift();
    
    // 检查任务是否超时
    const now = Date.now();
    if (now - uploadTask.addedAt > WeChatPlatformPlugin.UPLOAD_CONFIG.QUEUE_TIMEOUT) {
      console.error(`⏰ 上传任务超时: ${uploadTask.id}`);
      uploadTask.reject(new Error('上传队列超时'));
      this.uploadState.failedUploads++;
      return;
    }

    // 执行上传
    this.uploadState.activeUploads++;
    
    try {
      console.log(`🚀 开始上传图片: ${uploadTask.id} (活跃: ${this.uploadState.activeUploads})`);
      
      const result = await this.uploadImageWithRetry(uploadTask);
      
      if (result) {
        // 缓存成功的上传结果
        this.uploadState.uploadHistory.set(uploadTask.imageUrl, result);
        this.uploadState.successUploads++;
        uploadTask.resolve(result);
        console.log(`✅ 上传成功: ${uploadTask.id}`);
      } else {
        this.uploadState.failedUploads++;
        uploadTask.reject(new Error('上传失败'));
        console.error(`❌ 上传失败: ${uploadTask.id}`);
      }
      
    } catch (error) {
      this.uploadState.failedUploads++;
      uploadTask.reject(error);
      console.error(`❌ 上传异常: ${uploadTask.id}`, error);
    } finally {
      this.uploadState.activeUploads--;
      console.log(`📊 上传完成统计: 活跃:${this.uploadState.activeUploads}, 成功:${this.uploadState.successUploads}, 失败:${this.uploadState.failedUploads}`);
      
      // 继续处理队列中的下一个任务
      setTimeout(() => this.processUploadQueue(), 100);
    }
  }

  /**
   * 带重试机制的图片上传
   */
  async uploadImageWithRetry(uploadTask) {
    const config = WeChatPlatformPlugin.UPLOAD_CONFIG;
    let lastError = null;

    for (let attempt = 0; attempt <= config.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // 请求频率控制
        await this.enforceRateLimit();

        console.log(`🔄 上传尝试 ${attempt + 1}/${config.MAX_RETRY_ATTEMPTS + 1}: ${uploadTask.imageUrl}`);
        
        const result = await this.uploadImageToCDN(uploadTask.imageUrl);
        
        if (result) {
          if (attempt > 0) {
            console.log(`✅ 重试成功: ${uploadTask.id}, 尝试次数: ${attempt + 1}`);
          }
          return result;
        }
        
        // 如果返回null但没有抛出异常，视为上传失败
        lastError = new Error('上传返回空结果');
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ 上传尝试 ${attempt + 1} 失败:`, error.message);

        // 检查是否为致命错误，不需要重试
        if (this.isFatalError(error)) {
          console.error(`💀 致命错误，停止重试: ${error.message}`);
          break;
        }

        // 如果不是最后一次尝试，则等待后重试
        if (attempt < config.MAX_RETRY_ATTEMPTS) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await this.delay(delay);
        }
      }
    }

    console.error(`❌ 所有重试尝试都失败了: ${uploadTask.imageUrl}`, lastError);
    throw lastError;
  }

  /**
   * 请求频率控制
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.uploadState.lastRequestTime;
    const minInterval = WeChatPlatformPlugin.UPLOAD_CONFIG.MIN_REQUEST_INTERVAL;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`🚦 请求频率控制: 等待 ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.uploadState.lastRequestTime = Date.now();
  }

  /**
   * 计算指数退避延迟
   */
  calculateBackoffDelay(attempt) {
    const config = WeChatPlatformPlugin.UPLOAD_CONFIG;
    const baseDelay = config.BASE_DELAY;
    const maxDelay = config.MAX_DELAY;
    
    // 指数退避: delay = baseDelay * (2^attempt) + 随机抖动
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * baseDelay; // 添加随机抖动避免惊群效应
    const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.round(finalDelay);
  }

  /**
   * 判断是否为致命错误
   */
  isFatalError(error) {
    const config = WeChatPlatformPlugin.UPLOAD_CONFIG;
    
    // 检查错误码
    if (error.code && config.FATAL_ERROR_CODES.includes(error.code)) {
      return true;
    }
    
    // 检查HTTP状态码
    if (error.status && config.FATAL_ERROR_CODES.includes(error.status)) {
      return true;
    }
    
    // 检查错误信息中的关键字
    const fatalKeywords = ['token无效', '权限不足', '账号异常', '接口不存在'];
    const errorMessage = error.message?.toLowerCase() || '';
    
    return fatalKeywords.some(keyword => errorMessage.includes(keyword.toLowerCase()));
  }

  /**
   * 获取上传统计信息
   */
  getUploadStats() {
    return {
      total: this.uploadState.totalUploads,
      success: this.uploadState.successUploads,
      failed: this.uploadState.failedUploads,
      active: this.uploadState.activeUploads,
      queued: this.uploadState.uploadQueue.length,
      cached: this.uploadState.uploadHistory.size,
      successRate: this.uploadState.totalUploads > 0 ? 
        (this.uploadState.successUploads / this.uploadState.totalUploads * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 上传图片到微信CDN (改进版)
   */
  async uploadImageToCDN(imageUrl) {
    const startTime = Date.now();
    
    try {
      console.log('📡 调用微信uploadimg2cdn接口:', imageUrl);

      // 获取当前页面的token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        throw new Error('无法获取微信token');
      }

      // 构造请求参数（模拟微信真实的调用方式）
      const params = new URLSearchParams();
      params.append('t', 'ajax-editor-upload-img');
      params.append('imgUrl', imageUrl);
      params.append('fingerprint', this.getFingerprint());
      params.append('token', token);
      params.append('lang', 'zh_CN');
      params.append('f', 'json');
      params.append('ajax', '1');

      // 使用XMLHttpRequest模拟微信的真实调用，增强错误处理
      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const timeoutId = setTimeout(() => {
          xhr.abort();
          reject(new Error('请求超时'));
        }, 30000);

        xhr.open('POST', `/cgi-bin/uploadimg2cdn?lang=zh_CN&token=${token}&t=${Math.random()}`);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.onload = () => {
          clearTimeout(timeoutId);
          
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error(`响应解析失败: ${xhr.responseText}`));
            }
          } else {
            // 根据HTTP状态码提供更详细的错误信息
            let errorMsg = `HTTP ${xhr.status}: ${xhr.statusText}`;
            if (xhr.status === 429) {
              errorMsg = '请求过于频繁，触发限流';
            } else if (xhr.status >= 500) {
              errorMsg = '服务器内部错误';
            } else if (xhr.status === 401 || xhr.status === 403) {
              errorMsg = '认证失败或权限不足';
            }
            
            const error = new Error(errorMsg);
            error.status = xhr.status;
            reject(error);
          }
        };

        xhr.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('网络连接失败'));
        };

        xhr.onabort = () => {
          clearTimeout(timeoutId);
          reject(new Error('请求被中止'));
        };

        xhr.send(params.toString());
      });

      const duration = Date.now() - startTime;
      console.log(`📥 上传响应 (${duration}ms):`, response);

      // 增强响应验证
      if (response && response.errcode === 0 && response.url) {
        console.log(`✅ 图片上传成功 (${duration}ms):`, response.url);
        return response.url;
      } else if (response && response.errcode !== undefined) {
        // 根据错误码提供更详细的错误信息
        let errorMsg = `API错误 (${response.errcode})`;
        if (response.errmsg) {
          errorMsg += `: ${response.errmsg}`;
        }
        
        const error = new Error(errorMsg);
        error.code = response.errcode;
        throw error;
      } else {
        throw new Error('上传响应格式异常');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ 上传图片到CDN失败 (${duration}ms):`, error.message);
      throw error;
    }
  }

  /**
   * 处理HTML内容，清理不必要的标签和样式
   */
  cleanHtmlContent(html) {
    if (!html) return '';

    // 注意：不再处理代码块和引用块的样式，因为convert接口已经处理过了
    // 只保留必要的HTML清理，不覆盖已有的内联样式
    let processedHtml = html;

    // 处理有序列表 - 用div模拟，避免微信ol问题
    processedHtml = processedHtml.replace(
      /<ol[^>]*>([\s\S]*?)<\/ol>/g,
      (_, content) => {
        // 提取所有li内容
        const listItems = [];
        let itemMatch;
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;

        while ((itemMatch = liRegex.exec(content)) !== null) {
          listItems.push(itemMatch[1]);
        }

        // 生成带编号的div列表
        const numberedItems = listItems.map((item, index) => {
          return `<div style="padding-left: 0; line-height: 1.3; font-size: 16px; display: flex; align-items: baseline;">
            <span style="color: #666; font-weight: bold; margin-right: 12px; min-width: 24px; flex-shrink: 0; text-align: right;">${index + 1}.</span>
            <span style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.3;">${item}</span>
          </div>`;
        }).join('');

        return `<div>${numberedItems}</div>`;
      }
    );

    // 处理无序列表 - 移动端优化
    processedHtml = processedHtml.replace(
      /<ul[^>]*>([\s\S]*?)<\/ul>/g,
      (_, content) => {
        return `<ul style="margin: 16px 0; padding-left: 20px; line-height: 1.8; font-size: 16px;">${content}</ul>`;
      }
    );

    // 处理无序列表项 - 移动端优化
    processedHtml = processedHtml.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/g,
      (_, content) => {
        return `<li style="margin: 8px 0; padding-left: 8px; line-height: 1.8; word-wrap: break-word; overflow-wrap: break-word;">${content}</li>`;
      }
    );

    return processedHtml;
  }

  /**
   * 触发微信自动保存和字数更新
   */
  triggerWeChatAutoSave(element) {
    try {
      console.log('🔄 触发微信自动保存和字数更新...');

      // 触发各种可能的事件来让微信更新字数和自动保存
      const events = [
        'input',
        'change',
        'keyup',
        'paste',
        'blur',
        'focus'
      ];

      events.forEach(eventType => {
        try {
          const event = new Event(eventType, {
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(event);
        } catch (e) {
          console.warn(`触发${eventType}事件失败:`, e);
        }
      });

      // 特别触发input事件（微信最常用的字数更新触发器）
      try {
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: ' '
        });
        element.dispatchEvent(inputEvent);
      } catch (e) {
        console.warn('触发InputEvent失败:', e);
      }

      // 延迟触发一次额外的input事件，确保微信检测到变化
      setTimeout(() => {
        try {
          const delayedEvent = new Event('input', {
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(delayedEvent);
          console.log('✅ 延迟触发事件完成');
        } catch (e) {
          console.warn('延迟触发事件失败:', e);
        }
      }, 100);

      console.log('✅ 微信自动保存触发完成');
    } catch (error) {
      console.error('❌ 触发微信自动保存失败:', error);
    }
  }

  /**
   * 获取微信token
   */
  getWeChatToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }

  /**
   * 获取fingerprint
   */
  getFingerprint() {
    // 尝试从页面中获取fingerprint
    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      const content = script.textContent || script.innerText;
      const match = content.match(/fingerprint['"\s]*:\s*['"\s]([^'"]+)['"\s]/);
      if (match) {
        return match[1];
      }
    }

    // 如果找不到，生成一个简单的fingerprint
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 显示上传进度覆盖层
   */
  showUploadProgressOverlay(totalImages = 0) {
    // 创建loading覆盖层
    const overlay = document.createElement('div');
    overlay.id = 'ziliu-loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      border-radius: 6px;
      backdrop-filter: blur(2px);
    `;

    // 创建loading内容
    const loadingContent = document.createElement('div');
    loadingContent.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid #e1e5e9;
      min-width: 280px;
    `;

    // 创建spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1890ff;
      border-radius: 50%;
      animation: ziliu-spin 1s linear infinite;
    `;

    // 添加CSS动画
    if (!document.getElementById('ziliu-loading-styles')) {
      const style = document.createElement('style');
      style.id = 'ziliu-loading-styles';
      style.textContent = `
        @keyframes ziliu-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // 创建标题
    const title = document.createElement('div');
    title.textContent = '正在上传图片';
    title.style.cssText = `
      color: #333;
      font-size: 16px;
      font-weight: 600;
    `;

    // 创建描述文本
    const text = document.createElement('div');
    text.textContent = `准备上传 ${totalImages} 张图片，请稍候...`;
    text.style.cssText = `
      color: #666;
      font-size: 14px;
      text-align: center;
    `;

    // 创建详细状态文本
    const detailText = document.createElement('div');
    detailText.textContent = '初始化中...';
    detailText.style.cssText = `
      color: #999;
      font-size: 12px;
      text-align: center;
      margin-top: 4px;
    `;

    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    `;

    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #1890ff, #36cfc9);
      border-radius: 3px;
      transition: width 0.3s ease;
    `;
    progressContainer.appendChild(progressBar);

    // 创建进度文本
    const progressText = document.createElement('div');
    progressText.textContent = '0%';
    progressText.style.cssText = `
      color: #666;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
    `;

    loadingContent.appendChild(spinner);
    loadingContent.appendChild(title);
    loadingContent.appendChild(text);
    loadingContent.appendChild(detailText);
    if (totalImages > 1) {
      loadingContent.appendChild(progressContainer);
      loadingContent.appendChild(progressText);
    }
    overlay.appendChild(loadingContent);

    // 保存子元素引用供更新使用
    overlay._progressBar = progressBar;
    overlay._progressText = progressText;
    overlay._text = text;
    overlay._detailText = detailText;
    overlay._title = title;
    overlay._spinner = spinner;

    // 使用固定定位，覆盖整个页面
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '10001';
    document.body.appendChild(overlay);

    return overlay;
  }

  /**
   * 更新上传进度
   */
  updateUploadProgress(overlay, current, total, status = '') {
    if (!overlay) return;

    const progress = Math.round(((current + 1) / total) * 100);
    
    if (overlay._progressBar) {
      overlay._progressBar.style.width = `${progress}%`;
    }
    
    if (overlay._progressText) {
      overlay._progressText.textContent = `${progress}%`;
    }
    
    if (overlay._text) {
      overlay._text.textContent = `正在处理第 ${current + 1} 张图片（共 ${total} 张）`;
    }
    
    if (overlay._detailText && status) {
      overlay._detailText.textContent = status;
    }
    
    // 获取实时统计信息
    const stats = this.getUploadStats();
    if (overlay._detailText && stats) {
      overlay._detailText.textContent = `${status} - 成功:${stats.success} 失败:${stats.failed} 活跃:${stats.active}`;
    }
  }

  /**
   * 显示上传完成消息
   */
  showUploadCompletionMessage(overlay, successCount, totalCount, failedResults = []) {
    if (!overlay) return;

    // 停止spinner动画
    if (overlay._spinner) {
      overlay._spinner.style.display = 'none';
    }

    // 更新标题
    if (overlay._title) {
      if (successCount === totalCount) {
        overlay._title.textContent = '✅ 上传完成';
        overlay._title.style.color = '#52c41a';
      } else if (successCount > 0) {
        overlay._title.textContent = '⚠️ 部分上传成功';
        overlay._title.style.color = '#faad14';
      } else {
        overlay._title.textContent = '❌ 上传失败';
        overlay._title.style.color = '#f5222d';
      }
    }

    // 更新主要文本
    if (overlay._text) {
      overlay._text.textContent = `成功: ${successCount}/${totalCount} 张图片`;
    }

    // 更新详细信息
    if (overlay._detailText) {
      if (failedResults.length > 0) {
        const errorSummary = failedResults.slice(0, 3).map(r => r.error).join('; ');
        overlay._detailText.textContent = `失败原因: ${errorSummary}`;
        if (failedResults.length > 3) {
          overlay._detailText.textContent += ` 等 ${failedResults.length} 个错误`;
        }
      } else {
        overlay._detailText.textContent = '所有图片上传成功！';
      }
    }

    // 最终进度条设为100%
    if (overlay._progressBar) {
      overlay._progressBar.style.width = '100%';
    }
    if (overlay._progressText) {
      overlay._progressText.textContent = '100%';
    }
  }

  /**
   * 隐藏上传进度覆盖层
   */
  hideUploadProgressOverlay(overlay) {
    if (!overlay) return;
    
    try {
      // 添加淡出动画
      overlay.style.transition = 'opacity 0.3s ease-out';
      overlay.style.opacity = '0';
      
      setTimeout(() => {
        if (overlay.parentElement) {
          overlay.parentElement.removeChild(overlay);
        }
      }, 300);
    } catch (error) {
      console.warn('隐藏上传进度覆盖层失败:', error);
    }
  }

}

// 配置驱动的自动注册（支持多个微信编辑器变体，例如：公众号长文 / 小绿书）
if (window.ZiliuPlatformRegistry && window.ZiliuPluginConfig) {
  const wechatLikeIds = ['wechat', 'wechat_xiaolushu'];
  const platformConfigs = (window.ZiliuPluginConfig.platforms || [])
    .filter(p => wechatLikeIds.includes(p.id) && p.enabled);

  const matchesUrl = (patterns) => {
    return (patterns || []).some(pattern => {
      try {
        const escapedPattern = pattern
          .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
          .replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(window.location.href);
      } catch (_e) {
        return false;
      }
    });
  };

  platformConfigs.forEach((config) => {
    if (!matchesUrl(config.urlPatterns)) return;

    // 避免重复注册
    if (window.ZiliuPlatformRegistry.get(config.id)) return;

    console.log(`🔧 注册微信专用插件（配置驱动）: ${config.displayName || config.id}`);
    const plugin = new WeChatPlatformPlugin(config);
    window.ZiliuPlatformRegistry.register(plugin);
  });
}

window.WeChatPlatformPlugin = WeChatPlatformPlugin;
