/**
 * 微博平台插件
 * 处理微博发布框的内容、标签和图片填充
 */
class WeiboPlugin extends BasePlatformPlugin {
    constructor(config) {
        super(config);
        this.platformType = 'short-text';
        console.log('🚀 微博插件初始化完成');
    }

    /**
     * 填充内容到微博编辑器
     */
    async fillContent(data) {
        console.log('🚀 开始填充微博内容:', data);

        try {
            const elements = this.findEditorElements(false);
            if (!elements.isEditor) {
                throw new Error('未找到微博编辑器');
            }

            const editor = elements.elements.content;
            let text = data.content || '';

            // 1. 处理标签 - 微博标签格式为 #标签#
            if (data.tags) {
                let tagsArray = [];
                if (typeof data.tags === 'string') {
                    try {
                        tagsArray = JSON.parse(data.tags);
                    } catch (e) {
                        tagsArray = data.tags.split(/[,，\s]+/).filter(tag => tag.trim());
                    }
                } else if (Array.isArray(data.tags)) {
                    tagsArray = data.tags;
                }

                if (tagsArray.length > 0) {
                    const formattedTags = tagsArray.map(tag => {
                        const t = tag.trim().replace(/^#|#$/g, '');
                        return `#${t}#`;
                    }).join(' ');

                    // 如果内容中已经有这些标签，就不重复添加
                    if (formattedTags && !text.includes(formattedTags)) {
                        text = `${text}\n\n${formattedTags}`.trim();
                    }
                }
            }

            // 2. 填充文本内容
            await this.setEditorContent(editor, text);
            console.log('✅ 微博文案与标签填充成功');

            // 3. 处理图片上传
            if (data.images && data.images.length > 0) {
                console.log('🖼️ 开始填充微博图片...');
                await this.fillImages(data.images, data.coverImage);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ 微博填充失败:', error);
            throw error;
        }
    }

    /**
     * 填充并上传图片
     */
    async fillImages(images, coverImage) {
        try {
            // 微博的图片上传输入框
            const fileInput = document.querySelector('input[type="file"]._file_hqmwy_20') ||
                document.querySelector('input[type="file"][accept*="image"]');

            if (!fileInput) {
                console.warn('⚠️ 未找到微博图片上传输入框');
                return false;
            }

            // 整理图片列表：如果有封面图且不在列表中，加进去
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
            for (let i = 0; i < Math.min(allImageUrls.length, 9); i++) { // 微博最多9张图
                try {
                    const url = allImageUrls[i];
                    const blob = await window.ZiliuUtilsService.fetchImageBlob(url);
                    if (blob) {
                        const fileName = `weibo_image_${i}.png`;
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
            console.error('❌ 微博图片上传失败:', error);
            return false;
        }
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
        .filter(p => p.id === 'weibo' && p.enabled);

    configs.forEach((config) => {
        // 避免重复注册
        if (window.ZiliuPlatformRegistry.get(config.id)) return;

        const plugin = new WeiboPlugin(config);
        window.ZiliuPlatformRegistry.register(plugin);
        console.log(`📖 微博插件已注册: ${config.id}`);
    });
}
