/**
 * X (Twitter) 平台插件
 * 处理 X 发布框的内容和图片填充
 */
class XPlugin extends BasePlatformPlugin {
    constructor(config) {
        super(config);
        this.platformType = 'short-text';
        console.log('🚀 X 插件初始化完成');
    }

    /**
     * 填充内容到 X 编辑器
     */
    async fillContent(data) {
        console.log('🚀 开始填充 X 内容:', data);

        try {
            const elements = this.findEditorElements(false);
            if (!elements.isEditor) {
                throw new Error('未找到 X 编辑器');
            }

            const editor = elements.elements.content;
            let text = (data.content || '').toString();

            // X 字数限制：Premium 用户可发 4000 字，普通用户 280 字
            // 这里不做截断，让用户自己决定（可能是 Premium 用户）
            // 如果超长，X 会自动提示，用户可以手动调整
            const configLimit = this.config?.specialHandling?.contentLimit?.max;
            const softLimit = 4000; // X Premium 上限
            const limit = (typeof configLimit === 'number' && configLimit > 0)
                ? configLimit
                : softLimit;
            if (text.length > limit) {
                console.warn(`⚠️ X 内容超长 (${text.length}/${limit})，可能需要手动调整`);
                text = text.substring(0, limit);
            }

            // 1. 填充文本内容
            // X 使用 Draft.js，直接赋值可能不生效，setEditorContent 基类中处理了 execCommand('insertText')
            await this.setEditorContent(editor, text);
            console.log('✅ X 文案填充成功');

            // 2. 处理图片上传
            if (data.images && data.images.length > 0) {
                console.log('🖼️ 开始填充 X 图片...');
                await this.fillImages(data.images, data.coverImage);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ X 填充失败:', error);
            throw error;
        }
    }

    /**
     * 填充并上传图片
     */
    async fillImages(images, coverImage) {
        try {
            // X 的图片上传输入框
            const fileInput = document.querySelector('input[type="file"][data-testid="fileInput"]');

            if (!fileInput) {
                console.warn('⚠️ 未找到 X 图片上传输入框');
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
            // X 限制 4 张图片
            for (let i = 0; i < Math.min(allImageUrls.length, 4); i++) {
                try {
                    const url = allImageUrls[i];
                    const blob = await window.ZiliuUtilsService.fetchImageBlob(url);
                    if (blob) {
                        const fileName = `x_image_${i}.png`;
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
            console.error('❌ X 图片上传失败:', error);
            return false;
        }
    }

    /**
   * 针对 X (Twitter) 的 Draft.js 编辑器进行特殊处理的内容填充
   */
    async setEditorContent(element, content) {
        if (!element || content === undefined) return;

        console.log('📝 X 专用填充 (Draft.js 兼容)');

        // 1. 确保聚焦
        element.focus();
        await this.delay(100);

        // 2. 全选现有内容（比 range 更能被 Draft.js 识别）
        document.execCommand('selectAll', false, null);
        await this.delay(50);

        // 3. 执行插入（模拟用户输入）
        const text = String(content ?? '');
        const normalizedText = text.replace(/\u00A0/g, ' ');
        let success = false;

        // 优先模拟粘贴，避免行顺序错乱
        try {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', normalizedText);
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
                success = document.execCommand('insertText', false, normalizedText);
            } catch (e) {
                console.warn('execCommand 插入失败:', e);
                success = false;
            }
        }

        if (!success) {
            console.warn('⚠️ 填充失败，使用兜底方案');
            element.textContent = normalizedText;
        }

        // 4. 触发 input 事件通知 React/Draft.js 状态更新
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // 5. 额外触发一个空格或退格键，强制 Draft.js 进行一次校验（可选）
        // document.execCommand('insertText', false, ' ');
        // document.execCommand('delete', false, null);

        console.log('✅ X 内容填充指令已发出');
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
        .filter(p => p.id === 'x' && p.enabled);

    configs.forEach((config) => {
        // 避免重复注册
        if (window.ZiliuPlatformRegistry.get(config.id)) return;

        const plugin = new XPlugin(config);
        window.ZiliuPlatformRegistry.register(plugin);
        console.log(`📖 X 插件已注册: ${config.id}`);
    });
}
