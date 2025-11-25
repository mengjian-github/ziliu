/**
 * 知识星球平台插件
 * 支持特殊的列表标签处理和星球选择一键发布
 */
class ZsxqPlatformPlugin extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    
    // 知识星球特有配置
    this.zsxqConfig = {
      supportsFill: false, // 不支持自动填充
      supportsPublish: true, // 支持自动发布
      supportsMultipleTargets: true, // 支持多星球发布
      maxContentLength: 10000,
      apiBase: 'https://api.zsxq.com/v2'
    };

    // 缓存的星球列表
    this.cachedGroups = null;
    this.groupsCacheTime = 0;
    this.groupsCacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  static get metadata() {
    return {
      version: '1.0.0',
      description: '知识星球平台专用插件，支持列表标签特殊处理和星球选择发布'
    };
  }

  /**
   * 知识星球特有的元素查找逻辑
   */
  _findElements() {
    const elements = {
      isEditor: false,
      platform: this.id,
      elements: {}
    };

    // 查找标题输入框
    elements.elements.title = this.findElementFromSelectors([
      'input[placeholder*="请输入主题"]',
      'input[placeholder*="标题"]',
      '.topic-input input'
    ]);

    // 查找内容编辑器
    elements.elements.content = this.findElementFromSelectors([
      '[contenteditable="true"]:not(.ql-editor-placeholder)',
      '.ql-editor[contenteditable="true"]',
      '.editor-content[contenteditable="true"]'
    ]);

    // 验证是否是知识星球编辑器
    elements.isEditor = !!(elements.elements.title && elements.elements.content);

    console.log('🔍 知识星球编辑器检测结果:', {
      title: !!elements.elements.title,
      content: !!elements.elements.content,
      isEditor: elements.isEditor,
      contentType: this.getEditorType(elements.elements.content)
    });

    return elements;
  }

  /**
   * 获取编辑器类型
   */
  getEditorType(contentElement) {
    if (!contentElement) return 'unknown';
    
    if (contentElement.classList.contains('ql-editor')) {
      return 'Quill';
    } else if (contentElement.contentEditable === 'true') {
      return 'ContentEditable';
    }
    
    return 'unknown';
  }

  /**
   * 知识星球特有的内容处理
   * 主要解决ol/ul标签显示问题
   */
  async processContent(content, data) {
    console.log('🔧 处理知识星球内容格式');
    
    if (typeof content !== 'string') return content;

    // 处理有序列表
    let processedContent = content.replace(/<ol[^>]*>/gi, (match) => {
      return '<ol style="padding-left: 20px; margin: 10px 0;">';
    });

    // 处理无序列表
    processedContent = processedContent.replace(/<ul[^>]*>/gi, (match) => {
      return '<ul style="padding-left: 20px; margin: 10px 0; list-style-type: disc;">';
    });

    // 确保列表项有适当的样式
    processedContent = processedContent.replace(/<li[^>]*>/gi, (match) => {
      return '<li style="margin: 5px 0;">';
    });

    console.log('✅ 知识星球内容格式处理完成');
    return processedContent;
  }

  /**
   * 知识星球内容填充逻辑
   */
  async fillContentEditor(contentElement, content, data) {
    console.log('📝 填充知识星球编辑器内容');

    const editorType = this.getEditorType(contentElement);
    
    try {
      // 先处理内容格式
      const processedContent = await this.processContent(content, data);
      
      switch (editorType) {
        case 'Quill':
          return await this.fillQuillEditor(contentElement, processedContent);
        
        case 'ContentEditable':
          return await this.fillContentEditableEditor(contentElement, processedContent);
        
        default:
          return await super.fillContentEditor(contentElement, processedContent, data);
      }
    } catch (error) {
      console.error(`知识星球内容填充失败 [${editorType}]:`, error);
      throw error;
    }
  }

  /**
   * 填充Quill编辑器
   */
  async fillQuillEditor(element, content) {
    console.log('📝 填充Quill编辑器');

    try {
      element.focus();
      
      // 清空现有内容
      element.innerHTML = '';
      await this.delay(100);

      // 设置新内容
      element.innerHTML = content;
      
      // 触发Quill的更新事件
      const events = ['input', 'DOMSubtreeModified', 'text-change'];
      for (const eventType of events) {
        try {
          let event;
          if (eventType === 'text-change') {
            // Quill特有的事件
            event = new CustomEvent(eventType, {
              detail: { 
                delta: null,
                oldDelta: null,
                source: 'user'
              },
              bubbles: true
            });
          } else {
            event = new Event(eventType, { bubbles: true });
          }
          element.dispatchEvent(event);
        } catch (e) {
          console.warn(`事件触发失败: ${eventType}`, e);
        }
        await this.delay(50);
      }

      await this.delay(500);
      return { success: true, value: content, type: 'Quill' };
    } catch (error) {
      console.error('Quill编辑器填充失败:', error);
      throw error;
    }
  }

  /**
   * 填充ContentEditable编辑器
   */
  async fillContentEditableEditor(element, content) {
    console.log('📝 填充ContentEditable编辑器');

    try {
      element.focus();
      
      // 清空现有内容
      element.innerHTML = '';
      await this.delay(100);

      // 设置新内容
      element.innerHTML = content;

      // 触发各种必要的事件
      const events = ['input', 'change', 'blur', 'DOMSubtreeModified'];
      for (const eventType of events) {
        try {
          const event = new Event(eventType, { bubbles: true });
          element.dispatchEvent(event);
          await this.delay(50);
        } catch (e) {
          console.warn(`事件触发失败: ${eventType}`, e);
        }
      }

      await this.delay(500);
      return { success: true, value: content, type: 'ContentEditable' };
    } catch (error) {
      console.error('ContentEditable编辑器填充失败:', error);
      throw error;
    }
  }

  /**
   * 知识星球特有的标题填充
   */
  async fillTitle(titleElement, title) {
    console.log('📝 填充知识星球标题:', title);

    try {
      titleElement.focus();
      titleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      await this.delay(200);

      // 清空并设置新标题
      titleElement.value = '';
      await this.delay(100);
      
      titleElement.value = title;

      // 触发知识星球需要的事件
      const events = ['input', 'change', 'blur', 'focus'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        titleElement.dispatchEvent(event);
        await this.delay(100);
      }

      // 验证标题是否设置成功
      if (titleElement.value !== title) {
        console.warn('知识星球标题设置可能失败，重新尝试');
        titleElement.value = title;
        titleElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { success: true, value: title };
    } catch (error) {
      console.error('知识星球标题填充失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 知识星球平台的后处理
   */
  async postFillProcess(elements, data, results) {
    console.log('🔧 知识星球平台后处理...');
    
    // 确保列表样式正确应用
    if (results.content?.success && elements.content) {
      await this.delay(500);
      
      // 检查并修复列表样式
      await this.fixListStyles(elements.content);
    }

    // 如果标题和内容都填充成功，可以滚动到内容区域
    if (results.title?.success && results.content?.success && elements.content) {
      try {
        elements.content.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      } catch (e) {
        console.warn('滚动失败:', e);
      }
    }

    // 发送知识星球特有的事件
    ZiliuEventBus.emit('zsxq:fillComplete', {
      results,
      hasListContent: this.hasListContent(data.content || '')
    });

    await this.delay(300);
  }

  /**
   * 修复列表样式
   */
  async fixListStyles(contentElement) {
    try {
      const lists = contentElement.querySelectorAll('ol, ul');
      
      for (const list of lists) {
        if (list.tagName === 'OL') {
          list.style.paddingLeft = '20px';
          list.style.margin = '10px 0';
        } else if (list.tagName === 'UL') {
          list.style.paddingLeft = '20px';
          list.style.margin = '10px 0';
          list.style.listStyleType = 'disc';
        }

        // 设置列表项样式
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          item.style.margin = '5px 0';
        });
      }
      
      console.log(`✅ 修复了 ${lists.length} 个列表的样式`);
    } catch (error) {
      console.warn('修复列表样式失败:', error);
    }
  }

  /**
   * 检查内容是否包含列表
   */
  hasListContent(content) {
    if (typeof content !== 'string') return false;
    return /<[ou]l[^>]*>/i.test(content);
  }

  /**
   * 验证编辑器元素
   */
  validateEditorElements(elements) {
    // 知识星球需要标题和内容编辑器
    const hasRequired = !!(elements.title && elements.content);
    
    // 额外检查内容编辑器是否可编辑
    if (elements.content) {
      const isEditable = elements.content.contentEditable === 'true' ||
                        elements.content.classList.contains('ql-editor');
      return hasRequired && isEditable;
    }
    
    return hasRequired;
  }

  /**
   * 知识星球特有的等待机制
   */
  async waitForEditor(maxWaitTime = 5000) {
    console.log('⏳ 等待知识星球编辑器加载...');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkEditor = () => {
        const elements = this._findElements();
        
        if (elements.isEditor && this.isContentEditorReady(elements.elements.content)) {
          console.log('✅ 知识星球编辑器已就绪');
          resolve(elements);
          return;
        }

        if (Date.now() - startTime >= maxWaitTime) {
          console.warn('⏰ 知识星球编辑器等待超时');
          resolve(elements);
          return;
        }

        setTimeout(checkEditor, 300);
      };

      checkEditor();
    });
  }

  /**
   * 检查内容编辑器是否准备就绪
   */
  isContentEditorReady(contentElement) {
    if (!contentElement) return false;
    
    return contentElement.contentEditable === 'true' &&
           contentElement.offsetParent !== null &&
           !contentElement.classList.contains('ql-editor-placeholder');
  }

  /**
   * 获取用户的知识星球列表
   */
  async fetchUserGroups(prioritizeLastSelected = true) {
    try {
      console.log('🔍 获取知识星球列表');
      
      // 检查缓存
      const now = Date.now();
      if (this.cachedGroups && (now - this.groupsCacheTime) < this.groupsCacheTimeout) {
        console.log('✅ 使用缓存的星球列表');
        return this.cachedGroups;
      }
      
      const response = await this.apiRequestWithRetry(`${this.zsxqConfig.apiBase}/groups`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.resp_data && data.resp_data.groups) {
        console.log('🔍 知识星球API原始数据:', JSON.stringify(data.resp_data.groups.slice(0, 2), null, 2));
        
        const groups = data.resp_data.groups.map(group => ({
          groupId: group.group_id,
          name: group.name || group.group_name || `星球-${group.group_id}`,
          description: group.description || '',
          avatar: group.avatar_url || group.background_url || '',
          memberCount: group.statistics?.members?.count || 0
        }));
        
        console.log(`✅ 获取到 ${groups.length} 个知识星球`);
        
        // 排序：优先显示上次选择的星球，然后按人数排序
        let sortedGroups = groups;
        if (prioritizeLastSelected) {
          const lastSelected = this.getLastSelectedGroups();
          if (lastSelected && lastSelected.length > 0) {
            const selectedGroups = [];
            const otherGroups = [];
            
            groups.forEach(group => {
              if (lastSelected.includes(group.groupId) || lastSelected.includes(String(group.groupId))) {
                group.lastSelected = true;
                selectedGroups.push(group);
              } else {
                group.lastSelected = false;
                otherGroups.push(group);
              }
            });
            
            // 上次选择的星球按人数排序
            selectedGroups.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
            // 其他星球按人数排序
            otherGroups.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
            
            sortedGroups = [...selectedGroups, ...otherGroups];
          } else {
            // 没有上次选择记录，直接按人数排序
            sortedGroups = groups.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
          }
        } else {
          // 不优先上次选择，直接按人数排序
          sortedGroups = groups.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
        }
        
        // 更新缓存
        this.cachedGroups = sortedGroups;
        this.groupsCacheTime = now;
        
        return sortedGroups;
      } else {
        throw new Error('API响应格式不正确');
      }
    } catch (error) {
      console.error('❌ 获取知识星球列表失败:', error);
      return [];
    }
  }

  /**
   * 带重试的API请求
   */
  async apiRequestWithRetry(url, options, maxRetries = 3, baseDelay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 API请求尝试 ${attempt}/${maxRetries}: ${url.split('/').pop()}`);
        
        const response = await fetch(url, options);
        
        // 检查限流
        if (response.status === 429) {
          console.warn('⚠️ 触发限流，等待后重试...');
          await this.delay(baseDelay * 2 * attempt);
          continue;
        }
        
        // 检查服务器错误
        if (response.status >= 500) {
          console.warn(`⚠️ 服务器错误 ${response.status}`);
          throw new Error(`服务器错误: ${response.status}`);
        }
        
        return response;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ API请求失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏱️ 等待 ${delay}ms 后重试...`);
        await this.delay(delay);
      }
    }
    
    throw lastError || new Error('API请求重试失败');
  }

  /**
   * 存储上次选择的星球
   */
  saveLastSelectedGroups(groupIds) {
    try {
      localStorage.setItem('zsxq_last_selected_groups', JSON.stringify(groupIds));
      console.log('✅ 保存上次选择的星球:', groupIds);
    } catch (error) {
      console.warn('⚠️ 保存星球选择失败:', error);
    }
  }

  /**
   * 获取上次选择的星球
   */
  getLastSelectedGroups() {
    try {
      const stored = localStorage.getItem('zsxq_last_selected_groups');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('⚠️ 读取星球选择失败:', error);
    }
    return [];
  }

  /**
   * 显示星球选择对话框
   */
  async showGroupSelector(groups, allowMultiple = false) {
    return new Promise((resolve) => {
      const dialog = this.createGroupSelectorDialog(groups, allowMultiple, resolve);
      document.body.appendChild(dialog);
    });
  }

  /**
   * 创建星球选择对话框
   */
  createGroupSelectorDialog(groups, allowMultiple, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'ziliu-group-selector-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); z-index: 10001;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
      padding: 20px;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'ziliu-group-selector-dialog';
    dialog.style.cssText = `
      background: #ffffff; border-radius: 16px; padding: 24px;
      max-width: 420px; width: 100%; max-height: 70vh; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
      animation: slideInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex; flex-direction: column;
    `;

    // 添加现代化CSS动画
    if (!document.querySelector('#ziliu-group-selector-styles')) {
      const styles = document.createElement('style');
      styles.id = 'ziliu-group-selector-styles';
      styles.textContent = `
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .ziliu-group-item {
          transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
        }
        .ziliu-group-item:hover {
          background: #f8fafc !important;
          border-color: #3b82f6 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .ziliu-group-item.selected {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%) !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        .ziliu-group-list {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .ziliu-group-list::-webkit-scrollbar {
          width: 6px;
        }
        .ziliu-group-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .ziliu-group-list::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .ziliu-group-list::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        #ziliu-group-cancel:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #475569 !important;
        }
        #ziliu-group-confirm:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
        }
        #ziliu-select-all:hover {
          border-color: #cbd5e1 !important;
          background: #f1f5f9 !important;
        }
      `;
      document.head.appendChild(styles);
    }

    const selectedGroups = new Set();

    dialog.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="font-size: 22px; margin-right: 12px;">🌟</div>
        <div style="flex: 1;">
          <h3 style="margin: 0; color: #1e293b; font-weight: 600; font-size: 18px;">
            选择知识星球
          </h3>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 13px;">
            ${allowMultiple ? `共 ${groups.length} 个星球` : '选择一个星球进行发布'}
          </p>
        </div>
        ${allowMultiple ? `
          <button id="ziliu-select-all" style="
            padding: 4px 12px; border: 1px solid #e2e8f0;
            background: #f8fafc; color: #475569; border-radius: 8px; 
            cursor: pointer; font-size: 12px; font-weight: 500;
            transition: all 0.2s;
          ">全选</button>
        ` : ''}
      </div>
      
      <div class="ziliu-group-list" style="
        flex: 1; overflow-y: auto; margin-bottom: 16px; 
        padding-right: 6px; max-height: 320px;
      ">
        ${groups.map(group => `
          <div class="ziliu-group-item" 
               data-group-id="${String(group.groupId)}"
               style="
                 display: flex; align-items: center; padding: 12px 14px;
                 border: 1px solid ${group.lastSelected ? '#3b82f6' : '#e2e8f0'}; 
                 border-radius: 12px; margin-bottom: 8px;
                 cursor: pointer; position: relative; background: #ffffff;
                 ${group.lastSelected ? 'background: #eff6ff; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);' : ''}
               ">
            ${allowMultiple ? `
              <input type="checkbox" 
                     data-group-id="${String(group.groupId)}"
                     style="
                       width: 16px; height: 16px; margin: 0 10px 0 0;
                       accent-color: #3b82f6; cursor: pointer;
                     "
                     ${group.lastSelected ? 'checked' : ''}>
            ` : ''}
            
            ${group.avatar ? `
              <img src="${group.avatar}" 
                   style="width: 40px; height: 40px; border-radius: 50%; 
                          margin-right: 12px; object-fit: cover;">
            ` : `
              <div style="
                width: 40px; height: 40px; border-radius: 50%; 
                margin-right: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: 600; font-size: 16px;
              ">
                ${group.name.charAt(0)}
              </div>
            `}
            
            <div style="flex: 1; min-width: 0;">
              <div style="
                display: flex; align-items: center; margin-bottom: 2px;
              ">
                <span style="
                  font-weight: 500; color: #1e293b; font-size: 14px;
                  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                  flex: 1;
                ">
                  ${group.name}
                </span>
                ${group.lastSelected ? `
                  <span style="
                    background: #3b82f6; color: white; font-size: 10px; 
                    padding: 1px 6px; border-radius: 8px; margin-left: 8px;
                    font-weight: 500;
                  ">上次选择</span>
                ` : ''}
              </div>
              <div style="color: #64748b; font-size: 12px;">
                ${group.memberCount > 0 ? `${group.memberCount} 人` : '成员信息加载中...'}
              </div>
            </div>
            
            ${!allowMultiple ? `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6" style="margin-left: 8px;">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        padding-top: 12px; border-top: 1px solid #f1f5f9;
      ">
        <div style="color: #64748b; font-size: 12px;">
          <span id="selected-count">已选择 ${groups.filter(g => g.lastSelected).length} 个</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="ziliu-group-cancel" style="
            padding: 8px 16px; border: 1px solid #e2e8f0;
            background: #ffffff; color: #64748b; border-radius: 8px; 
            cursor: pointer; font-size: 13px; font-weight: 500;
          ">取消</button>
          
          ${allowMultiple ? `
            <button id="ziliu-group-confirm" style="
              padding: 8px 16px; border: none;
              background: #3b82f6; color: white; border-radius: 8px; 
              cursor: pointer; font-size: 13px; font-weight: 500;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            ">确认发布</button>
          ` : ''}
        </div>
      </div>
    `;

    // 初始化多选模式的选中状态
    if (allowMultiple) {
      groups.forEach(group => {
        if (group.lastSelected) {
          selectedGroups.add(String(group.groupId));
          // 确保复选框状态和样式同步
          const groupElement = dialog.querySelector(`[data-group-id="${group.groupId}"]`);
          if (groupElement) {
            groupElement.classList.add('selected');
          }
        }
      });
    }

    // 更新选择计数
    const updateSelectedCount = () => {
      const countElement = dialog.querySelector('#selected-count');
      if (countElement && allowMultiple) {
        countElement.textContent = `已选择 ${selectedGroups.size} 个`;
      }
    };

    // 更新全选按钮状态
    const updateSelectAllButton = () => {
      const selectAllBtn = dialog.querySelector('#ziliu-select-all');
      if (selectAllBtn && allowMultiple) {
        const allSelected = selectedGroups.size === groups.length;
        selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        selectAllBtn.style.background = allSelected ? '#3b82f6' : '#f8fafc';
        selectAllBtn.style.color = allSelected ? 'white' : '#475569';
      }
    };

    // 绑定事件
    dialog.addEventListener('click', (e) => {
      const groupItem = e.target.closest('.ziliu-group-item');
      const checkbox = e.target.type === 'checkbox' ? e.target : null;
      
      // 全选按钮
      if (e.target.id === 'ziliu-select-all') {
        e.stopPropagation();
        const allSelected = selectedGroups.size === groups.length;
        
        if (allSelected) {
          // 取消全选
          selectedGroups.clear();
          dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            const groupItem = cb.closest('.ziliu-group-item');
            if (groupItem) {
              groupItem.classList.remove('selected');
            }
          });
        } else {
          // 全选
          selectedGroups.clear(); // 先清空再重新添加，确保数据一致
          groups.forEach(group => selectedGroups.add(String(group.groupId)));
          dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
            const groupItem = cb.closest('.ziliu-group-item');
            if (groupItem) {
              groupItem.classList.add('selected');
            }
          });
        }
        
        updateSelectedCount();
        updateSelectAllButton();
        return;
      }
      
      if (groupItem) {
        const groupId = groupItem.dataset.groupId;
        const group = groups.find(g => g.groupId === groupId);
        
        if (allowMultiple) {
          // 多选模式
          const itemCheckbox = groupItem.querySelector('input[type="checkbox"]');
          
          if (!checkbox) {
            // 点击了项目本身，切换复选框状态
            itemCheckbox.checked = !itemCheckbox.checked;
          }
          
          // 根据复选框最新状态更新选中集合
          // 确保groupId类型一致性
          const normalizedGroupId = String(groupId);
          if (itemCheckbox.checked) {
            selectedGroups.add(normalizedGroupId);
            groupItem.classList.add('selected');
          } else {
            selectedGroups.delete(normalizedGroupId);
            groupItem.classList.remove('selected');
          }
          
          updateSelectedCount();
          updateSelectAllButton();
        } else {
          // 单选模式，直接选择
          overlay.remove();
          onComplete([group]);
        }
      }
      
      // 取消按钮
      if (e.target.id === 'ziliu-group-cancel') {
        overlay.remove();
        onComplete(null);
      }
      
      // 确认按钮（多选模式）
      if (e.target.id === 'ziliu-group-confirm') {
        const selected = groups.filter(g => selectedGroups.has(String(g.groupId)));
        overlay.remove();
        onComplete(selected.length > 0 ? selected : null);
      }
    });

    // 初始更新
    updateSelectedCount();
    updateSelectAllButton();

    overlay.appendChild(dialog);
    return overlay;
  }

  /**
   * 发布到选中的星球（带状态界面）
   */
  async publishToSelectedGroups(data, selectedGroups) {
    if (!selectedGroups || selectedGroups.length === 0) {
      throw new Error('未选择发布目标');
    }

    console.log(`🚀 开始发布到 ${selectedGroups.length} 个星球`);
    
    // 保存用户选择
    const groupIds = selectedGroups.map(g => g.groupId);
    this.saveLastSelectedGroups(groupIds);
    
    // 创建发布状态界面
    const publishStatus = this.createPublishStatusDialog(selectedGroups);
    document.body.appendChild(publishStatus.overlay);
    
    const results = [];
    const baseDelay = 3000; // 基础延迟3秒
    
    try {
      for (let i = 0; i < selectedGroups.length; i++) {
        const group = selectedGroups[i];
        
        // 更新当前发布状态
        publishStatus.updateProgress(i, selectedGroups.length, group.name, 'publishing');
        publishStatus.updateGroupStatus(group.groupId, 'publishing', '发布中...');
        
        try {
          console.log(`📤 发布到星球: ${group.name} (${i + 1}/${selectedGroups.length})`);
          
          const result = await this.publishToGroupWithRetry(data, group, publishStatus);
          results.push({
            groupId: group.groupId,
            groupName: group.name,
            success: result.success,
            message: result.message || result.error,
            url: result.url
          });
          
          if (result.success) {
            console.log(`✅ 发布成功: ${group.name}`);
            publishStatus.updateGroupStatus(group.groupId, 'success', '发布成功');
          } else {
            console.log(`❌ 发布失败: ${group.name} - ${result.error}`);
            publishStatus.updateGroupStatus(group.groupId, 'failed', result.error);
          }
          
          // 如果不是最后一个，添加延迟
          if (i < selectedGroups.length - 1) {
            publishStatus.updateProgress(i + 1, selectedGroups.length, '准备中...', 'waiting');
            console.log(`⏱️ 延迟 ${baseDelay}ms 后发布下一个星球...`);
            await this.delay(baseDelay);
          }
          
        } catch (error) {
          console.error(`❌ 发布异常: ${group.name}`, error);
          results.push({
            groupId: group.groupId,
            groupName: group.name,
            success: false,
            message: error.message,
            error: true,
            retryable: this.isRetryableError(error)
          });
          publishStatus.updateGroupStatus(group.groupId, 'failed', error.message);
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      console.log(`📊 发布完成: 成功 ${successCount}，失败 ${failCount}`);
      
      // 更新最终状态
      publishStatus.updateProgress(selectedGroups.length, selectedGroups.length, '发布完成', 'completed');
      publishStatus.showFinalResults(successCount, failCount, results, data, selectedGroups);
      
      return {
        results,
        totalGroups: selectedGroups.length,
        successCount,
        failCount,
        summary: `发布完成：成功 ${successCount} 个，失败 ${failCount} 个`
      };
    } catch (error) {
      publishStatus.overlay.remove();
      throw error;
    }
  }

  /**
   * 发布到单个星球
   */
  async publishToGroup(data, group) {
    try {
      const groupId = group.groupId || group;
      
      // 处理内容
      let contentToPublish = '';
      
      // 添加预设开头内容
      const currentPreset = window.ZiliuApp?.getSelectedPreset?.();
      if (currentPreset?.headerContent) {
        contentToPublish += currentPreset.headerContent + '\n\n';
      }
      
      // 添加正文内容，并处理列表标签
      if (data.content) {
        // 先处理转义字符，再处理列表标签
        let processedContent = this.unescapeContent(data.content);
        contentToPublish += this.convertListsForZsxq(processedContent);
      }
      
      // 添加预设结尾内容
      if (currentPreset?.footerContent) {
        contentToPublish += '\n\n' + currentPreset.footerContent;
      }
      
      // 调用API发布
      const publishResult = await this.directPublishToGroup(groupId, data.title || '', contentToPublish);
      
      if (publishResult.success) {
        return {
          success: true,
          message: `已成功发布到 ${group.name || groupId}`,
          url: publishResult.url
        };
      } else {
        return {
          success: false,
          error: publishResult.error || 'API发布失败'
        };
      }
      
    } catch (error) {
      console.error(`发布到星球失败:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 反转义内容中的特殊字符
   */
  unescapeContent(content) {
    if (!content) return '';
    
    return content
      .replace(/&quot;/g, '"')        // 将&quot;转换为双引号
      .replace(/&#39;/g, "'")         // 将&#39;转换为单引号  
      .replace(/&#x27;/g, "'")        // 将&#x27;转换为单引号
      .replace(/&amp;/g, '&')         // 将&amp;转换为&
      .replace(/&lt;/g, '<')          // 将&lt;转换为<
      .replace(/&gt;/g, '>')          // 将&gt;转换为>
      .replace(/&nbsp;/g, ' ')        // 将&nbsp;转换为空格
      .replace(/\\"/g, '"')           // 将\"转换为"
      .replace(/\\'/g, "'")           // 将\'转换为'
      .replace(/\\\\/g, '\\');        // 将\\转换为\
  }

  /**
   * 转换列表标签为知识星球支持的格式
   */
  convertListsForZsxq(html) {
    if (!html) return '';

    let content = html;

    // 处理有序列表
    content = content.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_, attrs, listContent) => {
      let counter = 1;
      const processedContent = listContent.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (__, liAttrs, liContent) => {
        return `<div${liAttrs}><p style="margin: 16px 0;">${counter++}. ${liContent.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '')}</p></div>`;
      });
      return `<div${attrs}>${processedContent}</div>`;
    });

    // 处理无序列表
    content = content.replace(/<ul([^>]*)>([\s\S]*?)<\/ul>/gi, (_, attrs, listContent) => {
      const processedContent = listContent.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (__, liAttrs, liContent) => {
        return `<div${liAttrs}><p style="margin: 16px 0;">• ${liContent.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '')}</p></div>`;
      });
      return `<div${attrs}>${processedContent}</div>`;
    });

    return content;
  }

  /**
   * 直接调用API发布到指定星球
   */
  async directPublishToGroup(groupId, title, content, imageIds = []) {
    try {
      console.log(`🔍 API发布到星球 ${groupId}`);
      
      // 第一步：创建文章
      const articlePayload = {
        req_data: {
          group_id: groupId,
          article_id: "",
          title: title,
          content: content,
          image_ids: imageIds,
          scheduled_article: false
        }
      };

      const articleResponse = await this.apiRequestWithRetry(`${this.zsxqConfig.apiBase}/articles`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(articlePayload)
      });

      if (!articleResponse.ok) {
        let errorText;
        try {
          errorText = await articleResponse.text();
          console.error('创建文章失败，响应内容:', errorText);
        } catch (e) {
          errorText = '无法读取错误响应';
        }
        throw new Error(`创建文章失败: ${articleResponse.status} ${articleResponse.statusText} - ${errorText}`);
      }

      let articleResult;
      try {
        articleResult = await articleResponse.json();
        console.log('创建文章响应:', articleResult);
      } catch (e) {
        console.error('解析文章创建响应失败:', e);
        throw new Error('创建文章失败: 响应格式错误');
      }
      
      if (!articleResult.succeeded) {
        const errorMsg = articleResult.error_message || articleResult.msg || articleResult.error_code || '未知错误';
        console.error('文章创建失败，响应:', articleResult);
        throw new Error(`创建文章失败: ${errorMsg}`);
      }

      const articleId = articleResult.resp_data.article_id;
      const articleUrl = `https://articles.zsxq.com/id_${articleId}.html`;
      
      console.log(`✅ 文章创建成功，ID: ${articleId}`);

      // 第二步：发布主题到星球  
      const summary = this.generateTextSummary(title, content);
      
      const topicPayload = {
        req_data: {
          type: "talk",
          text: summary,
          article_id: articleId
        }
      };

      const topicResponse = await this.apiRequestWithRetry(`${this.zsxqConfig.apiBase}/groups/${groupId}/topics`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(topicPayload)
      });

      if (!topicResponse.ok) {
        let errorText;
        try {
          errorText = await topicResponse.text();
          console.error('发布主题失败，响应内容:', errorText);
        } catch (e) {
          errorText = '无法读取错误响应';
        }
        throw new Error(`发布主题失败: ${topicResponse.status} ${topicResponse.statusText} - ${errorText}`);
      }

      let topicResult;
      try {
        topicResult = await topicResponse.json();
        console.log('发布主题响应:', topicResult);
      } catch (e) {
        console.error('解析主题发布响应失败:', e);
        throw new Error('发布主题失败: 响应格式错误');
      }
      
      if (!topicResult.succeeded) {
        const errorMsg = topicResult.error_message || topicResult.msg || topicResult.error_code || '未知错误';
        console.error('主题发布失败，响应:', topicResult);
        throw new Error(`发布主题失败: ${errorMsg}`);
      }

      console.log(`✅ 主题发布成功到星球 ${groupId}`);

      return {
        success: true,
        message: '发布成功',
        url: articleUrl,
        articleId: articleId,
        topicId: topicResult.resp_data.topic_id
      };

    } catch (error) {
      console.error(`❌ 直接API发布失败:`, error);
      throw error;
    }
  }

  /**
   * 生成纯文本摘要（用于topic）
   */
  generateTextSummary(_title, content) {
    // 清理HTML标签，但保留基本换行结构
    let cleanContent = content
      .replace(/<br\s*\/?>/gi, '\n')  // 将<br>转换为换行
      .replace(/<\/p>/gi, '\n\n')     // 段落结束添加两个换行
      .replace(/<[^>]+>/g, '')        // 移除其他HTML标签
      .replace(/\n{3,}/g, '\n\n')     // 合并多余换行，最多保留两个
      .replace(/[ \t]+/g, ' ')        // 合并空格和制表符
      .trim();

    // 处理HTML实体和转义字符
    cleanContent = cleanContent
      .replace(/&quot;/g, '"')        // 将&quot;转换为双引号
      .replace(/&#39;/g, "'")         // 将&#39;转换为单引号
      .replace(/&amp;/g, '&')         // 将&amp;转换为&
      .replace(/&lt;/g, '<')          // 将&lt;转换为<
      .replace(/&gt;/g, '>')          // 将&gt;转换为>
      .replace(/&nbsp;/g, ' ')        // 将&nbsp;转换为空格
      .replace(/\\"/g, '"')           // 将\"转换为"
      .replace(/\\'/g, "'")           // 将\'转换为'
      .replace(/\\\\/g, '\\');        // 将\\转换为\

    // 只返回内容，不包含标题
    if (cleanContent.length > 150) {
      return cleanContent.substring(0, 150) + '...';
    } else {
      return cleanContent;
    }
  }

  /**
   * 重写复制方法，直接返回错误提示用户使用发布功能
   */
  async copyArticleContent(_articleId) {
    return {
      success: false,
      error: '知识星球平台不支持复制功能，请使用「选择星球发布」功能',
      message: '知识星球平台请使用「选择星球发布」功能'
    };
  }

  /**
   * 重写填充方法，实际执行星球选择发布
   */
  async fillContent(data) {
    try {
      console.log('🌟 知识星球：开始选择星球发布流程');
      
      // 调用星球选择发布功能
      const result = await this.publishWithGroupSelection(data, true); // 允许多选
      
      return {
        success: true,
        message: result.summary,
        data: result
      };
      
    } catch (error) {
      console.error('知识星球发布失败:', error);
      
      if (error.message === '用户取消了操作') {
        return {
          success: false,
          error: '用户取消了发布操作',
          message: '已取消发布'
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: '发布失败: ' + error.message
      };
    }
  }

  /**
   * 创建发布状态界面
   */
  createPublishStatusDialog(selectedGroups) {
    const overlay = document.createElement('div');
    overlay.className = 'ziliu-publish-status-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.6); z-index: 10002;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(3px);
    `;

    const dialog = document.createElement('div');
    dialog.className = 'ziliu-publish-status-dialog';
    dialog.style.cssText = `
      background: #ffffff; border-radius: 16px; padding: 0;
      max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      animation: slideInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    const totalGroups = selectedGroups.length;
    
    dialog.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px; color: white;
      ">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
          🚀 发布到知识星球
        </h3>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">
          正在发布到 ${totalGroups} 个星球...
        </p>
      </div>
      
      <div style="padding: 20px;">
        <!-- 整体进度 -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 14px; color: #64748b; font-weight: 500;">整体进度</span>
            <span id="publish-overall-progress" style="font-size: 14px; color: #64748b;">0/${totalGroups}</span>
          </div>
          <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
            <div id="publish-progress-bar" style="
              height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
              width: 0%; transition: width 0.3s ease;
            "></div>
          </div>
        </div>
        
        <!-- 状态统计 -->
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div id="publish-success-count" style="font-size: 20px; font-weight: 600; color: #059669;">0</div>
            <div style="font-size: 12px; color: #64748b;">成功</div>
          </div>
          <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div id="publish-failed-count" style="font-size: 20px; font-weight: 600; color: #dc2626;">0</div>
            <div style="font-size: 12px; color: #64748b;">失败</div>
          </div>
          <div style="flex: 1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 8px;">
            <div id="publish-pending-count" style="font-size: 20px; font-weight: 600; color: #7c3aed;">${totalGroups}</div>
            <div style="font-size: 12px; color: #64748b;">待发布</div>
          </div>
        </div>
        
        <!-- 当前状态 -->
        <div style="margin-bottom: 20px; padding: 12px; background: #f0f9ff; border-radius: 8px;">
          <div style="display: flex; align-items: center;">
            <div id="publish-spinner" class="publish-loading-spinner" style="
              width: 16px; height: 16px; border: 2px solid #ddd;
              border-top: 2px solid #3b82f6; border-radius: 50%;
              animation: spin 1s linear infinite; margin-right: 8px;
            "></div>
            <span id="publish-status-text" style="font-size: 14px; color: #1e40af;">准备开始发布...</span>
          </div>
        </div>
        
        <!-- 星球列表 -->
        <div style="max-height: 200px; overflow-y: auto;">
          <div style="font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: 500;">发布详情</div>
          ${selectedGroups.map(group => `
            <div id="publish-group-${group.groupId}" data-group-id="${group.groupId}" style="
              display: flex; align-items: center; padding: 8px 12px; margin-bottom: 6px;
              background: #f8fafc; border-radius: 8px; border-left: 3px solid #e2e8f0;
            ">
              <div style="
                width: 28px; height: 28px; border-radius: 50%;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: 600; font-size: 12px; margin-right: 10px;
              ">
                ${group.name.charAt(0)}
              </div>
              <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 500; color: #1e293b;">${group.name}</div>
                <div class="publish-status-message" style="font-size: 11px; color: #64748b;">等待发布</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="individual-retry-btn" data-group-id="${group.groupId}" style="
                  display: none; padding: 4px 8px; font-size: 11px; border: none;
                  background: #3b82f6; color: white; border-radius: 4px; cursor: pointer;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#3b82f6'">
                  重试
                </button>
                <div class="publish-status-icon" style="font-size: 16px; color: #94a3b8;">⏳</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- 操作按钮 -->
        <div id="publish-actions" style="display: none; margin-top: 16px; text-align: center;">
          <button id="publish-close-btn" style="
            padding: 8px 20px; border: 1px solid #e2e8f0;
            background: #ffffff; color: #64748b; border-radius: 8px;
            cursor: pointer; font-size: 13px; font-weight: 500; margin-right: 8px;
          ">关闭</button>
          <button id="publish-retry-failed-btn" style="
            padding: 8px 20px; border: none;
            background: #f59e0b; color: white; border-radius: 8px;
            cursor: pointer; font-size: 13px; font-weight: 500; display: none;
          ">重试失败项</button>
        </div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    // 绑定事件
    dialog.querySelector('#publish-close-btn')?.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.appendChild(dialog);

    // 返回控制接口
    return {
      overlay,
      dialog,
      
      updateProgress: (current, total, currentGroup, status) => {
        const progressPercent = (current / total) * 100;
        const progressBar = dialog.querySelector('#publish-progress-bar');
        const overallProgress = dialog.querySelector('#publish-overall-progress');
        const statusText = dialog.querySelector('#publish-status-text');
        const pendingCount = dialog.querySelector('#publish-pending-count');
        
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (overallProgress) overallProgress.textContent = `${current}/${total}`;
        if (pendingCount) pendingCount.textContent = total - current;
        
        if (statusText) {
          switch (status) {
            case 'publishing':
              statusText.textContent = `正在发布到：${currentGroup}`;
              break;
            case 'waiting':
              statusText.textContent = `等待发布下一个星球...`;
              break;
            case 'completed':
              statusText.textContent = '🎉 发布完成！';
              const spinner = dialog.querySelector('#publish-spinner');
              if (spinner) spinner.style.display = 'none';
              break;
          }
        }
      },
      
      updateGroupStatus: (groupId, status, message) => {
        const groupElement = dialog.querySelector(`#publish-group-${groupId}`);
        if (!groupElement) return;
        
        const statusIcon = groupElement.querySelector('.publish-status-icon');
        const statusMessage = groupElement.querySelector('.publish-status-message');
        const retryBtn = groupElement.querySelector('.individual-retry-btn');
        
        switch (status) {
          case 'publishing':
            if (statusIcon) statusIcon.textContent = '⏳';
            if (statusMessage) statusMessage.textContent = '发布中...';
            if (retryBtn) retryBtn.style.display = 'none';
            groupElement.style.borderLeftColor = '#3b82f6';
            break;
          case 'success':
            if (statusIcon) statusIcon.textContent = '✅';
            if (statusMessage) statusMessage.textContent = '发布成功';
            if (retryBtn) retryBtn.style.display = 'none';
            groupElement.style.borderLeftColor = '#059669';
            const successCount = dialog.querySelector('#publish-success-count');
            if (successCount) successCount.textContent = parseInt(successCount.textContent) + 1;
            break;
          case 'failed':
            if (statusIcon) statusIcon.textContent = '❌';
            if (statusMessage) statusMessage.textContent = message || '发布失败';
            if (retryBtn) retryBtn.style.display = 'inline-block';
            groupElement.style.borderLeftColor = '#dc2626';
            const failedCount = dialog.querySelector('#publish-failed-count');
            if (failedCount) failedCount.textContent = parseInt(failedCount.textContent) + 1;
            break;
        }
      },
      
      showFinalResults: (successCount, failCount, results, data, selectedGroups) => {
        const self = this; // 保存外部this引用
        const actions = dialog.querySelector('#publish-actions');
        if (actions) {
          actions.style.display = 'block';
          
          if (failCount > 0) {
            const retryBtn = dialog.querySelector('#publish-retry-failed-btn');
            if (retryBtn) {
              retryBtn.style.display = 'inline-block';
              retryBtn.textContent = `重试失败项 (${failCount})`;
              
              // 绑定重试事件 - 需要访问外部状态对象
              const statusUpdater = {
                updateGroupStatus: (groupId, status, message) => {
                  const groupElement = dialog.querySelector(`[data-group-id="${groupId}"]`);
                  if (!groupElement) return;
                  
                  const statusIcon = groupElement.querySelector('.publish-status-icon');
                  const statusMessage = groupElement.querySelector('.publish-status-message');
                  
                  switch (status) {
                    case 'publishing':
                      if (statusIcon) statusIcon.textContent = '⏳';
                      if (statusMessage) statusMessage.textContent = message || '发布中...';
                      groupElement.style.borderLeftColor = '#3b82f6';
                      break;
                    case 'success':
                      if (statusIcon) statusIcon.textContent = '✅';
                      if (statusMessage) statusMessage.textContent = message || '发布成功';
                      groupElement.style.borderLeftColor = '#10b981';
                      break;
                    case 'failed':
                      if (statusIcon) statusIcon.textContent = '❌';
                      if (statusMessage) statusMessage.textContent = message || '发布失败';
                      groupElement.style.borderLeftColor = '#dc2626';
                      break;
                  }
                }
              };
              
              const retryHandler = async () => {
                const failedGroups = selectedGroups.filter(g => {
                  const result = results.find(r => r.groupId === g.groupId);
                  return result && !result.success && result.retryable !== false;
                });
                
                if (failedGroups.length > 0) {
                  retryBtn.disabled = true;
                  retryBtn.textContent = '重试中...';
                  
                  try {
                    // 重新发布失败的星球
                    for (const group of failedGroups) {
                      try {
                        statusUpdater.updateGroupStatus(group.groupId, 'publishing', '正在重试发布...');
                        // 使用外部范围的this引用
                        const result = await self.publishToGroupWithRetry(data, group, statusUpdater, 2);
                        
                        if (result.success) {
                          statusUpdater.updateGroupStatus(group.groupId, 'success', '重试发布成功');
                        } else {
                          statusUpdater.updateGroupStatus(group.groupId, 'failed', result.error || '重试发布失败');
                        }
                      } catch (error) {
                        console.error(`重试发布到 ${group.name} 失败:`, error);
                        statusUpdater.updateGroupStatus(group.groupId, 'failed', error.message || '重试发布失败');
                      }
                      
                      // 星球间延迟
                      await self.delay(2000);
                    }
                  } catch (error) {
                    console.error('重试发布失败:', error);
                  }
                  
                  retryBtn.disabled = false;
                  retryBtn.style.display = 'none'; // 重试后隐藏按钮
                }
              };
              
              retryBtn.addEventListener('click', retryHandler);
            }
          }
        }
        
        // 为每个失败的星球添加独立的重试按钮事件
        results.forEach(result => {
          if (!result.success) {
            const retryBtn = dialog.querySelector(`.individual-retry-btn[data-group-id="${result.groupId}"]`);
            if (retryBtn) {
              const retryHandler = async () => {
                const group = selectedGroups.find(g => g.groupId === result.groupId);
                if (!group) return;
                
                retryBtn.disabled = true;
                retryBtn.textContent = '重试中';
                
                try {
                  // 使用主要的updateGroupStatus方法
                  const statusUpdater = {
                    updateGroupStatus: (groupId, status, message) => {
                      const groupElement = dialog.querySelector(`#publish-group-${groupId}`);
                      if (!groupElement) return;
                      
                      const statusIcon = groupElement.querySelector('.publish-status-icon');
                      const statusMessage = groupElement.querySelector('.publish-status-message');
                      const retryButton = groupElement.querySelector('.individual-retry-btn');
                      
                      switch (status) {
                        case 'publishing':
                          if (statusIcon) statusIcon.textContent = '⏳';
                          if (statusMessage) statusMessage.textContent = message || '发布中...';
                          if (retryButton) retryButton.style.display = 'none';
                          groupElement.style.borderLeftColor = '#3b82f6';
                          break;
                        case 'success':
                          if (statusIcon) statusIcon.textContent = '✅';
                          if (statusMessage) statusMessage.textContent = message || '重试发布成功';
                          if (retryButton) retryButton.style.display = 'none';
                          groupElement.style.borderLeftColor = '#10b981';
                          break;
                        case 'failed':
                          if (statusIcon) statusIcon.textContent = '❌';
                          if (statusMessage) statusMessage.textContent = message || '重试发布失败';
                          if (retryButton) {
                            retryButton.style.display = 'inline-block';
                            retryButton.disabled = false;
                            retryButton.textContent = '重试';
                          }
                          groupElement.style.borderLeftColor = '#dc2626';
                          break;
                      }
                    }
                  };
                  
                  statusUpdater.updateGroupStatus(group.groupId, 'publishing', '正在重试发布...');
                  
                  // 执行重试发布
                  const retryResult = await self.publishToGroupWithRetry(data, group, statusUpdater, 2);
                  
                  if (retryResult.success) {
                    statusUpdater.updateGroupStatus(group.groupId, 'success', '重试发布成功');
                    // 更新结果数组
                    result.success = true;
                    result.message = '重试发布成功';
                  } else {
                    statusUpdater.updateGroupStatus(group.groupId, 'failed', retryResult.error || '重试发布失败');
                  }
                  
                } catch (error) {
                  console.error(`重试发布到 ${group.name} 失败:`, error);
                  const statusMessage = dialog.querySelector(`#publish-group-${group.groupId} .publish-status-message`);
                  const statusIcon = dialog.querySelector(`#publish-group-${group.groupId} .publish-status-icon`);
                  if (statusMessage) statusMessage.textContent = error.message || '重试发布失败';
                  if (statusIcon) statusIcon.textContent = '❌';
                  retryBtn.disabled = false;
                  retryBtn.textContent = '重试';
                  retryBtn.style.display = 'inline-block';
                }
              };
              
              retryBtn.addEventListener('click', retryHandler);
            }
          }
        });
      }
    };
  }

  /**
   * 带重试机制的发布方法
   */
  async publishToGroupWithRetry(data, group, publishStatus, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 重试发布 ${group.name} (第 ${attempt} 次尝试)`);
          publishStatus.updateGroupStatus(group.groupId, 'publishing', `重试中... (${attempt}/${maxRetries})`);
          
          // 重试延迟
          const retryDelay = 2000 * Math.pow(2, attempt - 1); // 指数退避
          await this.delay(retryDelay);
        }
        
        const result = await this.publishToGroup(data, group);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 发布失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 重试失败的发布
   */
  async retryFailedPublishes(data, failedGroups, publishStatus, originalResults) {
    console.log(`🔄 开始重试 ${failedGroups.length} 个失败的星球`);
    
    const baseDelay = 5000; // 重试时使用更长的延迟
    
    for (let i = 0; i < failedGroups.length; i++) {
      const group = failedGroups[i];
      
      // 更新状态为重试中
      publishStatus.updateGroupStatus(group.groupId, 'publishing', '重试中...');
      
      try {
        console.log(`🔄 重试发布: ${group.name} (${i + 1}/${failedGroups.length})`);
        
        const result = await this.publishToGroupWithRetry(data, group, publishStatus, 2); // 重试时最多2次
        
        // 更新原始结果数组
        const originalIndex = originalResults.findIndex(r => r.groupId === group.groupId);
        if (originalIndex !== -1) {
          originalResults[originalIndex] = {
            groupId: group.groupId,
            groupName: group.name,
            success: result.success,
            message: result.message || result.error,
            url: result.url,
            retried: true
          };
        }
        
        if (result.success) {
          console.log(`✅ 重试成功: ${group.name}`);
          publishStatus.updateGroupStatus(group.groupId, 'success', '重试成功');
          
          // 更新成功计数，减少失败计数
          const successCount = publishStatus.dialog.querySelector('#publish-success-count');
          const failedCount = publishStatus.dialog.querySelector('#publish-failed-count');
          if (successCount) successCount.textContent = parseInt(successCount.textContent) + 1;
          if (failedCount) failedCount.textContent = Math.max(0, parseInt(failedCount.textContent) - 1);
        } else {
          console.log(`❌ 重试仍然失败: ${group.name} - ${result.error}`);
          publishStatus.updateGroupStatus(group.groupId, 'failed', `重试失败: ${result.error}`);
        }
        
        // 添加重试间隔
        if (i < failedGroups.length - 1) {
          console.log(`⏱️ 重试延迟 ${baseDelay}ms...`);
          await this.delay(baseDelay);
        }
        
      } catch (error) {
        console.error(`❌ 重试异常: ${group.name}`, error);
        publishStatus.updateGroupStatus(group.groupId, 'failed', `重试失败: ${error.message}`);
        
        // 更新原始结果
        const originalIndex = originalResults.findIndex(r => r.groupId === group.groupId);
        if (originalIndex !== -1) {
          originalResults[originalIndex].message = `重试失败: ${error.message}`;
          originalResults[originalIndex].retried = true;
        }
      }
    }
    
    console.log('🔄 重试完成');
    
    // 更新最终统计
    const finalSuccessCount = originalResults.filter(r => r.success).length;
    const finalFailCount = originalResults.length - finalSuccessCount;
    
    // 更新状态文本
    const statusText = publishStatus.dialog.querySelector('#publish-status-text');
    if (statusText) {
      statusText.textContent = `🔄 重试完成！总计成功 ${finalSuccessCount} 个，失败 ${finalFailCount} 个`;
    }
  }

  /**
   * 判断错误是否可以重试
   */
  isRetryableError(error) {
    const retryableMessages = [
      '内部错误',
      '服务暂时不可用', 
      '请稍后重试',
      '网络连接超时',
      'fetch'
    ];
    
    const errorMessage = error.message.toLowerCase();
    
    // 检查HTTP状态码
    if (error.status) {
      // 429 (Too Many Requests), 5xx (Server Error) 可以重试
      if (error.status === 429 || error.status >= 500) {
        return true;
      }
      // 4xx (Client Error) 通常不应该重试
      if (error.status >= 400 && error.status < 500) {
        return false;
      }
    }
    
    // 检查错误消息
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * 暴露星球选择发布的公共接口
   */
  async publishWithGroupSelection(data, allowMultiple = true) {
    try {
      // 1. 获取星球列表
      const groups = await this.fetchUserGroups();
      if (groups.length === 0) {
        throw new Error('未找到任何知识星球，请确保已登录知识星球账户');
      }

      // 2. 显示选择对话框
      const selectedGroups = await this.showGroupSelector(groups, allowMultiple);
      if (!selectedGroups) {
        throw new Error('用户取消了操作');
      }

      // 3. 发布到选中的星球
      return await this.publishToSelectedGroups(data, selectedGroups);

    } catch (error) {
      console.error('❌ 知识星球发布失败:', error);
      throw error;
    }
  }
}

// 配置驱动的自动注册
if (window.ZiliuPlatformRegistry && window.ZiliuPluginConfig) {
  const zsxqConfig = window.ZiliuPluginConfig.platforms.find(p => p.id === 'zsxq');
  
  if (zsxqConfig && zsxqConfig.enabled) {
    const shouldRegister = zsxqConfig.urlPatterns.some(pattern => {
      try {
        const escapedPattern = pattern.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp('^' + escapedPattern + '$', 'i');
        return regex.test(window.location.href);
      } catch (e) {
        return false;
      }
    });

    if (shouldRegister) {
      console.log('🔧 注册知识星球专用插件（配置驱动）');
      const zsxqPlugin = new ZsxqPlatformPlugin(zsxqConfig);
      ZiliuPlatformRegistry.register(zsxqPlugin);
    }
  }
}

window.ZsxqPlatformPlugin = ZsxqPlatformPlugin;