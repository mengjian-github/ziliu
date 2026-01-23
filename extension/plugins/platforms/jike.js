/**
 * 即刻平台插件
 * 处理即刻发布框的内容、标签和图片填充
 */
class JikePlugin extends BasePlatformPlugin {
    constructor(config) {
        super(config);
        this.platformType = 'short-text';
        console.log('🚀 即刻插件初始化完成');
    }

    /**
     * 填充内容到即刻编辑器
     */
    async fillContent(data) {
        console.log('🚀 开始填充即刻内容:', data);

        try {
            const elements = this.findEditorElements(false);
            if (!elements.isEditor) {
                throw new Error('未找到即刻编辑器');
            }

            const editor = elements.elements.content;
            let text = data.content || '';

            // 2. 填充文本内容
            await this.setEditorContent(editor, text);
            console.log('✅ 即刻文案填充成功');

            // 3. 处理图片上传
            if (data.images && data.images.length > 0) {
                console.log('🖼️ 开始填充即刻图片...');
                await this.fillImages(data.images, data.coverImage);
            }

            // 4. 处理圈子选择 (可选)
            // 如果需要选择圈子，可以尝试在 postFillProcess 中实现

            return { success: true };
        } catch (error) {
            console.error('❌ 即刻填充失败:', error);
            throw error;
        }
    }

    /**
     * 填充并上传图片
     */
    async fillImages(images, coverImage) {
        try {
            // 即刻的图片上传输入框
            const fileInput = document.querySelector('input[type="file"]') ||
                document.querySelector('input[type="file"][accept*="image"]');

            if (!fileInput) {
                console.warn('⚠️ 未找到即刻图片上传输入框');
                return false;
            }

            const allImageUrls = [];
            if (coverImage) {
                const url = typeof coverImage === 'string' ? coverImage : coverImage.url;
                if (url) allImageUrls.push(url);
            }

            images.forEach(img => {
                const url = typeof img === 'string' ? img : img.url;
                if (url && !allImageUrls.includes(url)) {
                    allImageUrls.push(url);
                }
            });

            console.log('🖼️ 待上传图片数量:', allImageUrls.length);

            const dataTransfer = new DataTransfer();
            for (let i = 0; i < Math.min(allImageUrls.length, 9); i++) { // 即刻限制
                try {
                    const url = allImageUrls[i];
                    const blob = await window.ZiliuUtilsService.fetchImageBlob(url);
                    if (blob) {
                        const fileName = `jike_image_${i}.png`;
                        const file = new File([blob], fileName, { type: blob.type || 'image/png' });
                        dataTransfer.items.add(file);
                    }
                } catch (e) {
                    console.error(`❌ 获取图片失败 (${i}):`, e);
                }
            }

            if (dataTransfer.items.length > 0) {
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ 已触发 ${dataTransfer.items.length} 张图片上传`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ 即刻图片上传失败:', error);
            return false;
        }
    }

    /**
   * 针对即刻的编辑器进行内容填充优化
   */
    async setEditorContent(element, content) {
        if (!element || content === undefined) return;

        console.log('📝 即刻专用填充');

        // 1. 确保聚焦
        element.focus();
        await this.delay(100);

        // 2. 全选并插入（模拟用户输入）
        document.execCommand('selectAll', false, null);
        await this.delay(50);

        const text = String(content ?? '');
        const escapeHtml = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const paragraphs = text
            .split(/\n{2,}/)
            .map(p => p.trim())
            .filter(Boolean)
            .map(p => p.split('\n').map(escapeHtml).join('<br>'))
            .map(p => `<p>${p}</p>`)
            .join('');
        const html = paragraphs || escapeHtml(text);

        let success = false;

        // 优先模拟粘贴（即刻对 execCommand 支持不稳定）
        try {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', text);
            dataTransfer.setData('text/html', html);
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(pasteEvent);
            success = true;
        } catch (e) {
            success = false;
        }

        if (!success) {
            try {
                success = document.execCommand('insertText', false, text);
            } catch (e) {
                success = false;
            }
        }

        if (!success) {
            // 备选方案
            element.innerText = text;
        }

        // 3. 触发事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ 即刻内容填充完成');
    }

    /**
     * 验证编辑器元素
     */
    validateEditorElements(elements) {
        return !!elements.content;
    }
}

// 自动注册插件
if (typeof window !== 'undefined' && window.ZiliuPlatformRegistry) {
    const configs = (window.ZiliuPluginConfig?.platforms || [])
        .filter(p => p.id === 'jike' && p.enabled);

    configs.forEach((config) => {
        // 避免重复注册
        if (window.ZiliuPlatformRegistry.get(config.id)) return;

        const plugin = new JikePlugin(config);
        window.ZiliuPlatformRegistry.register(plugin);
        console.log(`📖 即刻插件已注册: ${config.id}`);
    });
}
