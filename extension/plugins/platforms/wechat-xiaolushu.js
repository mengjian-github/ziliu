/**
 * 微信小绿书（图片消息）平台插件
 * 专用版本 1.0.7 - 修复 CORS 权限与 ProseMirror 深度注入
 */
class WeChatXiaolushuPlugin extends BasePlatformPlugin {

    constructor(config) {
        super(config);
    }

    static get metadata() {
        return {
            version: '1.0.7',
            description: '微信小绿书专用插件 - 修复 CORS 与 ProseMirror 换行'
        };
    }

    /**
     * 查找小绿书编辑器元素
     */
    _findElements() {
        this.cachedElements = null;
        const elements = {
            isEditor: false,
            platform: this.id,
            elements: {}
        };

        elements.elements.title = this.findElement('#title');
        elements.elements.content = document.querySelector('.ProseMirror');
        elements.elements.digest = this.findElement('#js_description');
        elements.elements.uploadInput = document.querySelector('.webuploader-container input[type="file"]') || document.querySelector('input[type="file"]');

        elements.isEditor = !!(elements.elements.title && elements.elements.content);

        console.log('🔍 小绿书检测结果:', {
            title: !!elements.elements.title,
            content: !!elements.elements.content,
            upload: !!elements.elements.uploadInput,
            isEditor: elements.isEditor
        });

        return elements;
    }

    /**
     * 重写 fillContent
     */
    async fillContent(data) {
        console.log('🚀 小绿书填充任务启动', { title: data.title, imageCount: data.images?.length });

        const elements = this.findEditorElements(false);
        if (!elements.isEditor) throw new Error(`未检测到小绿书编辑器`);

        const results = {};

        // 1. 填充标题
        if (data.title && elements.elements.title) {
            results.title = await this.fillTitle(elements.elements.title, data.title);
        }

        // 2. 图片上传 (核心增强)
        if (data.images && data.images.length > 0) {
            results.images = await this.uploadImages(data.images);
        }

        // 3. 填充正文 (ProseMirror 深度优化)
        if (data.content && elements.elements.content) {
            results.content = await this.fillContentEditor(elements.elements.content, data.content, data);
        }

        // 4. 摘要填充
        const digestText = data.digest || data.content?.substring(0, 120) || '';
        if (digestText && elements.elements.digest) {
            results.digest = await this.fillDigest(elements.elements.digest, digestText);
        }

        return results;
    }

    /**
     * 处理正文填充
     * 方案：使用 document.execCommand('insertHTML') 并确保格式为 <p>
     */
    /**
     * 处理正文填充
     * 方案：将 Markdown 转换为带 <br> 的 HTML，适配小绿书编辑器
     */
    async fillContentEditor(contentElement, content, data) {
        console.log('📝 开始注入格式化正文...');
        let textContent = content || '';

        // 兜底：如果消息里没有带 preset，尝试从全局选中预设获取
        if (!data?.preset && window.ZiliuApp?.getSelectedPreset) {
            const fallbackPreset = window.ZiliuApp.getSelectedPreset();
            if (fallbackPreset) {
                data.preset = fallbackPreset;
                console.log('✅ 小绿书兜底获取当前选中预设:', fallbackPreset.name);
            } else {
                console.warn('⚠️ 小绿书未获取到预设（消息与全局均为空）');
            }
        }

        // 小绿书正文为“文本型”，这里直接拼接预设开头/结尾（保持纯文本效果）
        if (data?.preset) {
            const header = (data.preset.headerContent || '').trim();
            const footer = (data.preset.footerContent || '').trim();
            if (header) {
                textContent = `${header}\n\n${textContent}`;
                console.log('✅ 小绿书已添加预设开头');
            }
            if (footer) {
                textContent = `${textContent}\n\n${footer}`;
                console.log('✅ 小绿书已添加预设结尾');
            }
        }

        try {
            contentElement.focus();

            // 1. 简单的 Markdown 转换 (针对小绿书优化的纯文本/换行版)
            // 小绿书描述主要是纯文本，但支持换行
            let lines = textContent.split('\n');
            let processedLines = lines.map(line => {
                // 去除 bold/italic 标记，只保留文本 (或者保留由用户决定，这里先清理常见标记以防源码泄露)
                // 简单清理：**text** -> text
                let cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

                // 处理标题: # Title -> Title (也许可以加几个空行突出)
                if (/^#+\s+/.test(cleanLine)) {
                    cleanLine = cleanLine.replace(/^#+\s+/, '');
                    // 标题行可以考虑前后加空行，但这里先不做复杂布局
                }

                // 处理列表: - Item -> • Item
                cleanLine = cleanLine.replace(/^[\-\*]\s+/, '• ');

                // 处理引用: > Quote -> | Quote
                cleanLine = cleanLine.replace(/^>\s+/, '| ');

                // 2. 转义 HTML 字符，防止源码直接显示
                return this.escapeHtml(cleanLine);
            });

            // 3. 用 <br> 重组内容
            let htmlContent = processedLines.join('<br>');

            // 追加描述
            if (data.images && data.images.some(img => img.alt)) {
                htmlContent += '<br><br>--- 图片描述 ---<br>';
                data.images.forEach((img, idx) => {
                    if (img.alt) {
                        htmlContent += `<br>图${idx + 1}：${this.escapeHtml(img.alt)}`;
                    }
                });
            }

            // 追加标签 (小绿书标签写在正文里)
            if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
                const tagsHtml = data.tags.map(tag => `#${this.escapeHtml(tag)}`).join(' ');
                htmlContent += `<br><br>${tagsHtml}`;
            }

            // 4. 注入内容
            // 先尝试 execCommand，这通常最能兼容编辑器状态
            contentElement.focus();

            // 即使内容为空，也要确保清空
            if (!htmlContent) {
                contentElement.innerHTML = '<br>';
                return { success: true };
            }

            // 方法 A: execCommand 'insertHTML'
            let success = false;
            try {
                // 先全选然后覆盖
                document.execCommand('selectAll', false, null);
                success = document.execCommand('insertHTML', false, htmlContent);
            } catch (e) {
                console.warn('execCommand 失败', e);
            }

            // 方法 B: 直接操作 innerHTML
            if (!success) {
                console.log('⚠️ 使用 innerHTML 降级注入');
                contentElement.innerHTML = htmlContent;
            }

            // 5. 触发事件同步状态
            ['input', 'change', 'blur', 'DOMSubtreeModified'].forEach(ev => {
                contentElement.dispatchEvent(new Event(ev, { bubbles: true }));
            });

            this.triggerWeChatAutoSave(contentElement);
            return { success: true };
        } catch (error) {
            console.error('❌ 正文填充异常:', error);
            contentElement.innerText = textContent;
            return { success: false, error: error.message };
        }
    }

    /**
     * 增强版图片上传
     * 方案：针对 WebUploader 模拟完整的事件链
     */
    async uploadImages(images) {
        const elements = this.findEditorElements();
        const uploadInput = elements.elements.uploadInput;
        const uploadContainer = document.querySelector('.webuploader-container') || uploadInput?.parentElement;

        if (!uploadInput || !uploadContainer) {
            console.error('❌ 未找到上传控件');
            return { success: false, error: '未找到上传控件' };
        }

        const progressOverlay = this.createProgressOverlay(images.length);
        const dataTransfer = new DataTransfer();
        let successCount = 0;

        for (let i = 0; i < images.length; i++) {
            const url = typeof images[i] === 'string' ? images[i] : images[i].url;
            this.updateProgressOverlay(progressOverlay, i + 1, images.length, `获取图片素材中...`);

            try {
                // 现在 manifest 已包含 <all_urls>，这里通过 background 抓取应该 100% 成功
                const blob = await window.ZiliuUtilsService.fetchImageBlob(url);
                if (blob) {
                    const file = new File([blob], `image_${i}.png`, { type: 'image/png' });
                    dataTransfer.items.add(file);
                    successCount++;
                    console.log(`✅ 图片素材已就绪: ${i + 1}`);
                } else {
                    console.error(`❌ 图片素材获取失败: ${url}`);
                }
            } catch (error) {
                console.error(`⚠️ 处理第 ${i + 1} 张图片异常:`, error);
            }
        }

        if (dataTransfer.files.length > 0) {
            this.updateProgressOverlay(progressOverlay, images.length, images.length, '同步到编辑器队列...');
            try {
                // 1. 设置文件
                uploadInput.files = dataTransfer.files;

                // 2. 模拟拖拽上传 (WebUploader 对此非常敏感)
                console.log('🏗️ 模拟 Drop 事件同步...');
                const events = ['dragenter', 'dragover', 'drop'];
                events.forEach(name => {
                    uploadContainer.dispatchEvent(new DragEvent(name, {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: dataTransfer
                    }));
                });

                // 3. 模拟变化事件
                uploadInput.dispatchEvent(new Event('change', { bubbles: true }));

                // 4. 模拟点击 Picker
                const picker = document.querySelector('.webuploader-pick');
                if (picker) {
                    picker.click();
                    await this.delay(500);
                }

                console.log(`✅ 已向编辑器提交 ${dataTransfer.files.length} 张图片`);
                await this.delay(2000);
            } catch (e) {
                console.error('❌ 驱动上传执行失败:', e);
            }
        }

        this.removeProgressOverlay(progressOverlay);
        return { success: true, count: successCount };
    }

    triggerWeChatAutoSave(element) {
        try {
            ['input', 'change', 'blur', 'keyup'].forEach(t => element.dispatchEvent(new Event(t, { bubbles: true })));
        } catch (e) { }
    }

    createProgressOverlay(total) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; color: white;`;
        overlay.innerHTML = `<div style="text-align: center; width: 300px;"><div style="font-size: 18px; margin-bottom: 20px;">正在填充素材...</div><div style="height: 6px; background: #333; border-radius: 3px; overflow: hidden;"><div id="pb" style="width: 0%; height: 100%; background: #07c160; transition: width 0.3s ease;"></div></div><div id="pt" style="margin-top: 10px; font-size: 14px; color: #999;">正在准备...</div></div>`;
        document.body.appendChild(overlay);
        return overlay;
    }

    updateProgressOverlay(overlay, current, total, status) {
        const pb = overlay.querySelector('#pb');
        const pt = overlay.querySelector('#pt');
        if (pb) pb.style.width = `${Math.round((current / total) * 100)}%`;
        if (pt) pt.textContent = status;
    }

    removeProgressOverlay(overlay) {
        if (overlay) overlay.remove();
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// 自动注册
if (typeof window !== 'undefined' && window.ZiliuPlatformRegistry) {
    const configs = (window.ZiliuPluginConfig?.platforms || []).filter(p => p.id === 'wechat_xiaolushu' && p.enabled);
    configs.forEach((config) => {
        // 仅在“小绿书”模式下注册：createType=8
        // 注意：type=77 是公众号长文编辑器，不能走小绿书逻辑
        if (/createType=8/i.test(window.location.href)) {
            if (!window.ZiliuPlatformRegistry.get(config.id)) {
                window.ZiliuPlatformRegistry.register(new WeChatXiaolushuPlugin(config));
            }
        }
    });
}
window.WeChatXiaolushuPlugin = WeChatXiaolushuPlugin;
