'use client';

import { useState, useEffect, useCallback } from 'react';
import { Platform, isVideoPlatform, getPlatformType, PLATFORM_CONFIGS } from '@/types/platform-settings';
import { Smartphone, Monitor, Palette, Loader2, ExternalLink, Settings, Chrome, Copy, Crown, Sun, Moon } from 'lucide-react';
import { PublishSettings } from './publish-settings';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';
import { PlatformGuard, StyleGuard } from '@/lib/subscription/components/FeatureGuard';
import { UpgradePrompt } from '@/lib/subscription/components/UpgradePrompt';
import { useExtensionDetector } from '@/hooks/useExtensionDetector';
import { useRouter } from 'next/navigation';
import { extractImagesFromMarkdown, markdownToPlainText as markdownToPlainTextUtil, type ExtractedImage } from '@/lib/markdown-utils';

interface PlatformPreviewProps {
  title: string;
  content: string;
  articleId?: string;
}

type ShortTextGenerated = {
  title?: string;
  content: string;
  tags?: string[];
  images?: ExtractedImage[];
};

export function PlatformPreview({ title, content, articleId }: PlatformPreviewProps) {
  // 状态持久化key
  const storageKey = `editor-preview-state-${articleId || 'new'}`;

  // 从localStorage获取保存的状态
  const getSavedState = () => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load preview state:', error);
      return null;
    }
  };

  const savedState = getSavedState();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(savedState?.platform || 'wechat');
  const [selectedStyle, setSelectedStyle] = useState<'default' | 'tech' | 'minimal' | 'elegant'>(savedState?.style || 'default');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [appliedSettings, setAppliedSettings] = useState<any>(savedState?.settings || null);
  const [finalContent, setFinalContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [shortTextCache, setShortTextCache] = useState<Partial<Record<Platform, ShortTextGenerated>>>({});
  const [shortTextImages, setShortTextImages] = useState<ExtractedImage[]>([]);
  const [isGeneratingShortText, setIsGeneratingShortText] = useState(false);

  // 保存状态到localStorage
  const saveState = useCallback((platform: Platform, style: string, settings: any) => {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        platform,
        style,
        settings,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save preview state:', error);
    }
  }, [storageKey]);

  // 添加订阅信息和插件检测
  const { hasFeature, checkFeatureAccess } = useUserPlan();
  const { isInstalled, isChecking } = useExtensionDetector();
  const router = useRouter();

  // 自动创建草稿功能
  const createDraftArticle = useCallback(async () => {
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || '未命名文章',
          content: content,
          status: 'draft',
          style: selectedStyle
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.id;
        }
      }

      throw new Error('创建草稿失败');
    } catch (error) {
      console.error('创建草稿失败:', error);
      throw error;
    }
  }, [title, content, selectedStyle]);

  // 图文平台配置
  const longTextPlatforms = [
    {
      id: 'wechat' as Platform,
      name: '公众号',
      icon: '📱',
      color: 'bg-green-500',
      description: '微信公众号文章'
    },
    {
      id: 'zhihu' as Platform,
      name: '知乎',
      icon: '🔵',
      color: 'bg-blue-500',
      description: '知乎专栏文章'
    },
    {
      id: 'juejin' as Platform,
      name: '掘金',
      icon: '⚡',
      color: 'bg-cyan-500',
      description: '掘金技术文章'
    },
    {
      id: 'zsxq' as Platform,
      name: '知识星球',
      icon: '🌟',
      color: 'bg-yellow-500',
      description: '知识星球文章和主题'
    }
  ];

  // 短图文平台配置
  const shortTextPlatforms = [
    {
      id: 'wechat_xiaolushu' as Platform,
      name: '小绿书',
      icon: '🟢',
      color: 'bg-emerald-600',
      description: '微信小绿书'
    },
    {
      id: 'xiaohongshu_note' as Platform,
      name: '小红书（图文）',
      icon: '📕',
      color: 'bg-red-500',
      description: '小红书图文笔记'
    },
    {
      id: 'weibo' as Platform,
      name: '微博',
      icon: '🧣',
      color: 'bg-red-600',
      description: '微博短内容'
    },
    {
      id: 'jike' as Platform,
      name: '即刻',
      icon: '🟡',
      color: 'bg-yellow-500',
      description: '即刻动态'
    },
    {
      id: 'x' as Platform,
      name: 'X',
      icon: '𝕏',
      color: 'bg-black',
      description: 'X（Twitter）'
    }
  ];

  // 视频平台配置
  const videoPlatforms = [
    {
      id: 'video_wechat' as Platform,
      name: '视频号',
      icon: '📹',
      color: 'bg-green-600',
      description: '微信视频号发布'
    },
    {
      id: 'douyin' as Platform,
      name: '抖音',
      icon: '🎵',
      color: 'bg-black',
      description: '抖音短视频发布'
    },
    {
      id: 'bilibili' as Platform,
      name: 'B站',
      icon: '📺',
      color: 'bg-pink-500',
      description: 'B站视频投稿'
    },
    {
      id: 'xiaohongshu' as Platform,
      name: '小红书（视频）',
      icon: '📕',
      color: 'bg-red-600',
      description: '小红书视频发布'
    },
    {
      id: 'youtube' as Platform,
      name: 'YouTube',
      icon: '🎬',
      color: 'bg-red-600',
      description: 'YouTube 视频发布'
    }
  ];

  // 应用发布设置到内容
  const applySettingsToContent = useCallback((baseContent: string, settings: any) => {
    if (!settings) return baseContent;

    let fullContent = baseContent;

    // 添加开头内容
    if (settings.headerContent) {
      fullContent = settings.headerContent + '\n\n' + fullContent;
    }

    // 添加结尾内容
    if (settings.footerContent) {
      fullContent = fullContent + '\n\n' + settings.footerContent;
    }

    return fullContent;
  }, []);

  // 简单的 Markdown -> 纯文本（用于短图文平台预览/复制）
  const markdownToPlainText = useCallback((markdown: string) => {
    return markdownToPlainTextUtil(markdown);
  }, []);

  // 生成短图文平台文案（AI）
  const generateShortTextContent = useCallback(async () => {
    if (getPlatformType(selectedPlatform) !== 'short_text') return;
    if (!content.trim()) return;

    setIsGeneratingShortText(true);
    try {
      const response = await fetch('/api/short-text/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          title,
          content: finalContent || content,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        console.error('短图文生成失败:', data?.error);
        alert(data?.error || '生成失败，请重试');
        return;
      }

      const generated: ShortTextGenerated = {
        title: data.data?.title,
        content: data.data?.content || '',
        tags: data.data?.tags || [],
        images: data.data?.images || [],
      };

      setShortTextCache(prev => ({ ...prev, [selectedPlatform]: generated }));
      setPreviewText(generated.content || '');
      setShortTextImages(generated.images || []);
    } catch (error) {
      console.error('短图文生成出错:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGeneratingShortText(false);
    }
  }, [selectedPlatform, content, finalContent, title]);

  const copyShortTextImages = useCallback(async () => {
    try {
      const urls = (shortTextImages || []).map(img => img.url).filter(Boolean).join('\n');
      if (!urls) return;
      await navigator.clipboard.writeText(urls);
    } catch (error) {
      console.error('复制图片链接失败:', error);
    }
  }, [shortTextImages]);

  // 更新最终内容
  useEffect(() => {
    const newFinalContent = applySettingsToContent(content, appliedSettings);
    setFinalContent(newFinalContent);
  }, [content, appliedSettings, applySettingsToContent]);

  // 加载视频内容（先从数据库加载，没有则生成）
  const loadVideoContent = useCallback(async (forceRegenerate = false) => {
    if (!isVideoPlatform(selectedPlatform) || !content.trim() || !articleId) {
      return;
    }

    setIsGeneratingVideo(true);
    try {
      // 如果不是强制重新生成，先尝试从数据库加载
      if (!forceRegenerate) {
        const loadResponse = await fetch(`/api/video/content?articleId=${articleId}&platform=${selectedPlatform}`);
        if (loadResponse.ok) {
          const loadData = await loadResponse.json();
          if (loadData.success) {
            setVideoMetadata({
              title: loadData.data.title,
              description: loadData.data.description,
              speechScript: loadData.data.speechScript,
              tags: loadData.data.tags,
              coverSuggestion: loadData.data.coverSuggestion,
              coverImage: loadData.data.coverImage,
              coverImage169: loadData.data.coverImage169,
              coverImage43: loadData.data.coverImage43,
              platformTips: loadData.data.platformTips,
              estimatedDuration: loadData.data.estimatedDuration
            });
            setIsGeneratingVideo(false);
            return;
          }
        }
      }

      // 数据库没有内容或强制重新生成，则调用AI生成
      const [speechResponse, metadataResponse] = await Promise.all([
        fetch('/api/video/convert-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: finalContent || content,
            platform: selectedPlatform,
            title: title
          })
        }),
        fetch('/api/video/generate-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: finalContent || content,
            platform: selectedPlatform,
            title: title
          })
        })
      ]);

      const speechData = await speechResponse.json();
      const metadataData = await metadataResponse.json();

      if (speechData.success && metadataData.success) {
        const videoData = {
          speechScript: speechData.data.speechScript,
          ...metadataData.data,
          estimatedDuration: speechData.data.estimatedDuration
        };

        setVideoMetadata(videoData);

        // 保存到数据库
        await fetch('/api/video/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId,
            platform: selectedPlatform,
            videoTitle: metadataData.data.title,
            videoDescription: metadataData.data.description,
            speechScript: speechData.data.speechScript,
            tags: metadataData.data.tags,
            coverSuggestion: metadataData.data.coverSuggestion,
            coverImage: metadataData.data.coverImage,
            coverImage169: metadataData.data.coverImage169,
            coverImage43: metadataData.data.coverImage43,
            platformTips: metadataData.data.platformTips,
            estimatedDuration: speechData.data.estimatedDuration
          })
        });
      } else {
        console.error('生成视频内容失败:', speechData.error || metadataData.error);
        alert('生成失败，请重试');
      }
    } catch (error) {
      console.error('生成视频内容出错:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [selectedPlatform, content, finalContent, title, articleId]);

  // 生成视频内容（强制重新生成）
  const generateVideoContent = useCallback(async () => {
    await loadVideoContent(true);
  }, [loadVideoContent]);

  // 当选择视频平台时自动加载内容
  useEffect(() => {
    if (isVideoPlatform(selectedPlatform) && content.trim() && articleId) {
      loadVideoContent(false);
    } else {
      setVideoMetadata(null);
    }
  }, [selectedPlatform, loadVideoContent, articleId]);

  // 组件卸载时清理旧的状态缓存（可选，防止localStorage积累过多数据）
  useEffect(() => {
    return () => {
      // 清理超过7天的旧状态缓存
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage);
          const now = Date.now();
          const weekMs = 7 * 24 * 60 * 60 * 1000; // 7天

          keys.forEach(key => {
            if (key.startsWith('editor-preview-state-')) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.timestamp && (now - data.timestamp) > weekMs) {
                  localStorage.removeItem(key);
                }
              } catch (e) {
                // 清理无效数据
                localStorage.removeItem(key);
              }
            }
          });
        } catch (error) {
          console.warn('Failed to cleanup old preview states:', error);
        }
      }
    };
  }, []);

  // 加载文章已保存的样式作为初始选择
  useEffect(() => {
    const fetchStyle = async () => {
      if (!articleId) return;
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        const data = await res.json();
        if (data?.success && data.data?.style) {
          setSelectedStyle(data.data.style);
        }
      } catch (e) {
        console.warn('获取文章样式失败，使用默认样式');
      }
    };
    fetchStyle();
  }, [articleId]);

  // 转换预览（仅用于图文平台）
  const handlePreview = useCallback(async (platform: Platform, style: string) => {
    const platformType = getPlatformType(platform);

    // 视频平台不需要调用转换预览
    if (isVideoPlatform(platform)) {
      setPreviewHtml('');
      setPreviewText('');
      setIsConverting(false);
      return;
    }

    const contentToPreview = finalContent || content;

    if (!contentToPreview.trim()) {
      setPreviewHtml('');
      setPreviewText('');
      setShortTextImages([]);
      return;
    }

    // 短图文平台：不走 HTML 转换，直接展示纯文本（或 AI 生成后的文案）
    if (platformType === 'short_text') {
      setIsConverting(false);
      setPreviewHtml('');
      const images = extractImagesFromMarkdown(contentToPreview);
      setShortTextImages(images);
      const cached = shortTextCache[platform];
      setPreviewText((cached?.content || markdownToPlainText(contentToPreview)).trim());
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToPreview,
          // convert API 目前仅支持长文平台；小绿书与公众号同编辑器，统一走 wechat
          platform: platform === 'wechat_xiaolushu' ? 'wechat' : platform,
          style,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 微信公众号预览：用 inlineHtml 渲染，保证预览与最终粘贴到公众号编辑器的效果一致
        const isWechatLike = platform === 'wechat' || platform === 'wechat_xiaolushu';
        const htmlForPreview = isWechatLike ? (data.data.inlineHtml || data.data.html) : data.data.html;
        setPreviewHtml(htmlForPreview);
        setPreviewText('');
      } else {
        console.error('转换失败:', data.error);
      }
    } catch (error) {
      console.error('转换错误:', error);
    } finally {
      setIsConverting(false);
    }
  }, [finalContent, content, markdownToPlainText, shortTextCache]);

  // 自动预览
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePreview(selectedPlatform, selectedStyle);
    }, 500);

    return () => clearTimeout(timer);
  }, [finalContent, selectedPlatform, selectedStyle, handlePreview]);

  // 平台切换时立即预览
  const handlePlatformChange = useCallback(async (platform: Platform) => {
    setSelectedPlatform(platform);

    // 保存状态
    saveState(platform, selectedStyle, appliedSettings);

    // 如果是视频平台且没有articleId，需要先创建草稿
    if (isVideoPlatform(platform) && !articleId) {
      // 检查是否有足够的内容
      if (!title.trim() && !content.trim()) {
        alert('请先输入标题和内容再预览视频效果');
        return;
      }

      try {
        // 自动创建草稿
        const newArticleId = await createDraftArticle();
        // 跳转到编辑页面
        router.push(`/editor/${newArticleId}`);
        return;
      } catch (error) {
        alert('创建草稿失败，请重试');
        return;
      }
    }

    // 正常预览流程
    handlePreview(platform, selectedStyle);
  }, [selectedStyle, handlePreview, articleId, title, content, createDraftArticle, router, saveState, appliedSettings]);

  // 样式切换时立即预览
  const handleStyleChange = useCallback((style: string) => {
    setSelectedStyle(style as any);

    // 保存状态
    saveState(selectedPlatform, style, appliedSettings);

    handlePreview(selectedPlatform, style);
    // 同步保存样式到文章
    if (articleId) {
      fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style })
      }).catch(() => { });
    }
  }, [selectedPlatform, handlePreview, saveState, appliedSettings]);

  // 获取平台发布URL
  const getPlatformUrl = (platform: Platform) => {
    switch (platform) {
      case 'wechat':
        return 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&lang=zh_CN';
      case 'wechat_xiaolushu':
        return 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=8&lang=zh_CN';
      case 'zhihu':
        return 'https://zhuanlan.zhihu.com/write';
      case 'juejin':
        return 'https://juejin.cn/editor/drafts/new?v=2';
      case 'zsxq':
        return 'https://wx.zsxq.com/';
      case 'xiaohongshu_note':
      case 'xiaohongshu':
        return 'https://creator.xiaohongshu.com/publish/publish';
      case 'weibo':
        return 'https://weibo.com/';
      case 'jike':
        return 'https://web.okjike.com/';
      case 'x':
        return 'https://x.com/compose/post';
      case 'video_wechat':
        return 'https://channels.weixin.qq.com/platform/post/create';
      case 'douyin':
        return 'https://creator.douyin.com/creator-micro/content/post/video';
      case 'bilibili':
        return 'https://member.bilibili.com/platform/upload/video/frame';
      case 'youtube':
        return 'https://studio.youtube.com/';
      default:
        return '';
    }
  };

  // 处理发布
  const handlePublish = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    // 如果插件未安装，引导用户安装
    if (!isInstalled) {
      router.push('/extension');
      return;
    }

    setIsPublishing(true);

    try {
      const contentToPublish = finalContent || content;
      const platformType = getPlatformType(selectedPlatform);
      const platformUrl = getPlatformUrl(selectedPlatform);

      // 准备要复制的内容
      let contentToCopy = '';

      if (platformType === 'short_text') {
        const cached = shortTextCache[selectedPlatform];
        const plainBody = (cached?.content || markdownToPlainText(contentToPublish)).trim();
        const finalTitle = (cached?.title || title).trim();

        // 部分短图文平台存在“标题+正文”的概念，复制时同时给出，方便手动兜底
        if (selectedPlatform === 'xiaohongshu_note') {
          contentToCopy = `${finalTitle}\n\n${plainBody}`.trim();
        } else {
          contentToCopy = plainBody;
        }
      } else {
        // 长图文平台：保留 Markdown 标题，方便手动粘贴兜底
        if (title) {
          contentToCopy += `# ${title}\n\n`;
        }
        contentToCopy += contentToPublish;
      }

      // 将当前文章ID与所选样式告知插件，方便插件拉取对应样式
      try {
        if (typeof window !== 'undefined' && (window as any).chrome?.runtime && articleId) {
          (window as any).chrome.runtime.sendMessage({
            action: 'storeContent',
            data: {
              articleId,
              style: selectedStyle,
              platform: selectedPlatform
            }
          }, () => { });
        }
      } catch (e) {
        console.warn('通知插件所选样式失败，不影响发布', e);
      }

      // 复制到剪贴板并打开平台页面
      try {
        await navigator.clipboard.writeText(contentToCopy);
        window.open(platformUrl, '_blank');
      } catch (error) {
        console.error('复制失败:', error);
        window.open(platformUrl, '_blank');
      }
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setIsPublishing(false);
    }
  }, [title, content, finalContent, selectedPlatform, isInstalled, router, articleId, selectedStyle, markdownToPlainText, shortTextCache]);

  return (
    <div className="flex flex-col h-full">
      {/* 预览控制栏 */}
      <div className="p-4 border-b border-white/5 bg-transparent">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white flex items-center">
            {selectedPlatform === 'wechat' ? (
              <Smartphone className="h-4 w-4 mr-2 text-zinc-400" />
            ) : (
              <Monitor className="h-4 w-4 mr-2 text-zinc-400" />
            )}
            预览
          </h3>
          {isConverting && (
            <div className="flex items-center text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              转换中...
            </div>
          )}
        </div>

        {/* 平台选择器 */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm font-medium text-zinc-400">发布平台:</span>
          </div>

          {/* 长图文平台 */}
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-2">长图文平台</div>
            <div className="flex bg-white/5 rounded-xl p-1 gap-1">
              {longTextPlatforms.map((platform) => {
                const platformFeatureId = `${platform.id}-platform`;
                const hasAccess = hasFeature(platformFeatureId);
                const accessResult = checkFeatureAccess(platformFeatureId);

                return (
                  <div key={platform.id} className="relative flex items-center">
                    <button
                      onClick={() => {
                        if (hasAccess) {
                          handlePlatformChange(platform.id);
                        } else {
                          // 锁定平台采用tooltip提示，不再弹窗
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${selectedPlatform === platform.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : hasAccess
                          ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                          : 'text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                      disabled={!hasAccess}
                      title={!hasAccess ? accessResult.reason : platform.description}
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                      {!hasAccess && platform.id !== 'wechat' && (
                        <Crown className="h-3 w-3 text-amber-500 ml-1" />
                      )}
                    </button>
                    {!hasAccess && (
                      <div className="ml-1">
                        <UpgradePrompt scenario="platform-locked" style="tooltip" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 短图文平台 */}
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-2">短图文平台</div>
            <div className="flex bg-white/5 rounded-xl p-1 gap-1 flex-wrap">
              {shortTextPlatforms.map((platform) => {
                const platformFeatureId = `${platform.id}-platform`;
                const hasAccess = hasFeature(platformFeatureId);
                const accessResult = checkFeatureAccess(platformFeatureId);

                return (
                  <div key={platform.id} className="relative flex items-center">
                    <button
                      onClick={() => {
                        if (hasAccess) {
                          handlePlatformChange(platform.id);
                        } else {
                          // 锁定平台采用tooltip提示，不再弹窗
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${selectedPlatform === platform.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : hasAccess
                          ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                          : 'text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                      disabled={!hasAccess}
                      title={!hasAccess ? accessResult.reason : platform.description}
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                      {!hasAccess && platform.id !== 'wechat' && (
                        <Crown className="h-3 w-3 text-amber-500 ml-1" />
                      )}
                    </button>
                    {!hasAccess && (
                      <div className="ml-1">
                        <UpgradePrompt scenario="platform-locked" style="tooltip" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 视频平台 */}
          <div>
            <div className="text-xs text-zinc-500 mb-2">视频平台</div>
            <div className="flex bg-white/5 rounded-xl p-1 gap-1">
              {videoPlatforms.map((platform) => {
                const platformFeatureId = `${platform.id}-platform`;
                const hasAccess = hasFeature(platformFeatureId);
                const accessResult = checkFeatureAccess(platformFeatureId);

                return (
                  <div key={platform.id} className="relative flex items-center">
                    <button
                      onClick={() => {
                        if (hasAccess) {
                          handlePlatformChange(platform.id);
                        } else {
                          // 锁定平台采用tooltip提示，不再弹窗
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${selectedPlatform === platform.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : hasAccess
                          ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                          : 'text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                      disabled={!hasAccess}
                      title={!hasAccess ? accessResult.reason : platform.description}
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                      {!hasAccess && platform.id !== 'wechat' && (
                        <Crown className="h-3 w-3 text-amber-500 ml-1" />
                      )}
                    </button>
                    {!hasAccess && (
                      <div className="ml-1">
                        <UpgradePrompt scenario="platform-locked" style="tooltip" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 长图文/短图文：发布设置 + 去发布 */}
        {!isVideoPlatform(selectedPlatform) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getPlatformType(selectedPlatform) === 'long_text' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-400">样式:</span>
                  </div>
                  <select
                    value={selectedStyle}
                    onChange={(e) => {
                      const newStyle = e.target.value;
                      if (newStyle !== 'default') {
                        const styleAccess = checkFeatureAccess('advanced-styles');
                        if (!styleAccess.hasAccess) {
                          alert(styleAccess.reason || '高级样式需要专业版权限');
                          return;
                        }
                      }
                      handleStyleChange(newStyle);
                    }}
                    className="text-sm border border-white/10 rounded-lg px-3 py-1.5 bg-white/5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent [&>option]:bg-[#020617] [&>option]:text-zinc-200"
                  >
                    <option value="default">默认样式</option>
                    <option value="tech" disabled={!hasFeature('advanced-styles')}>
                      技术风格（Pro） {!hasFeature('advanced-styles') ? '👑' : ''}
                    </option>
                    <option value="minimal" disabled={!hasFeature('advanced-styles')}>
                      简约风格（Pro） {!hasFeature('advanced-styles') ? '👑' : ''}
                    </option>
                    <option value="elegant" disabled={!hasFeature('advanced-styles')}>
                      雅致杂志（Pro） {!hasFeature('advanced-styles') ? '👑' : ''}
                    </option>
                  </select>
                  {!hasFeature('advanced-styles') && (
                    <div className="ml-1">
                      <UpgradePrompt scenario="style-locked" style="tooltip" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-zinc-500">
                    短图文平台：支持提取配图 + AI 适配文案（生成后将用于复制/发布）
                  </div>
                  <button
                    onClick={generateShortTextContent}
                    disabled={
                      isGeneratingShortText || !content.trim() || getPlatformType(selectedPlatform) !== 'short_text'
                    }
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="用AI将正文改写为对应平台的短图文文案"
                  >
                    {isGeneratingShortText ? '生成中...' : 'AI生成文案'}
                  </button>
                  {shortTextImages.length > 0 && (
                    <button
                      onClick={copyShortTextImages}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10"
                      title="复制所有图片链接（每行一个）"
                    >
                      复制图片链接（{shortTextImages.length}）
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* 发布设置 */}
              {hasFeature('publish-presets') ? (
                <PublishSettings
                  platform={selectedPlatform}
                  onApplySettings={(settings) => {
                    console.log('应用发布设置:', settings);
                    setAppliedSettings(settings);

                    // 保存状态
                    saveState(selectedPlatform, selectedStyle, settings);

                    // 立即重新预览
                    setTimeout(() => {
                      handlePreview(selectedPlatform, selectedStyle);
                    }, 100);
                  }}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center space-x-1 px-3 py-2 border border-white/5 rounded-lg text-sm font-medium bg-white/5 text-zinc-600 cursor-not-allowed transition-colors"
                    title="发布设置功能仅限专业版用户使用"
                  >
                    <Settings className="h-4 w-4" />
                    <span>发布设置</span>
                    <Crown className="h-3 w-3 text-amber-500" />
                  </button>
                  <UpgradePrompt scenario="preset-locked" style="tooltip" />
                </div>
              )}

              {/* 去发布按钮 */}
              {isChecking ? (
                <button
                  disabled
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-zinc-500 cursor-not-allowed"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>检测中...</span>
                </button>
              ) : !isInstalled ? (
                <button
                  onClick={() => router.push('/extension')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                  title="需要先安装插件才能发布"
                >
                  <Chrome className="h-4 w-4" />
                  <span>安装插件</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !title.trim() || !content.trim()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isPublishing || !title.trim() || !content.trim()
                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                    }`}
                  title={`复制内容并打开${PLATFORM_CONFIGS[selectedPlatform]?.name || selectedPlatform}`}
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{isPublishing ? '准备中...' : '去平台发布'}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 视频平台操作区 */}
        {isVideoPlatform(selectedPlatform) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isGeneratingVideo ? (
                <div className="flex items-center text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  正在生成视频内容...
                </div>
              ) : (
                <button
                  onClick={generateVideoContent}
                  disabled={!content.trim()}
                  className="flex items-center space-x-2 px-3 py-2 border border-white/10 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>重新生成</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* 去发布按钮 */}
              {isChecking ? (
                <button
                  disabled
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-zinc-500 cursor-not-allowed"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>检测中...</span>
                </button>
              ) : !isInstalled ? (
                <button
                  onClick={() => router.push('/extension')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                  title="需要先安装插件才能发布"
                >
                  <Chrome className="h-4 w-4" />
                  <span>安装插件</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const platformUrl = getPlatformUrl(selectedPlatform);
                    window.open(platformUrl, '_blank');
                  }}
                  disabled={!videoMetadata || isGeneratingVideo}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!videoMetadata || isGeneratingVideo
                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                    }`}
                  title={`去${videoPlatforms.find(p => p.id === selectedPlatform)?.name}发布`}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>去{videoPlatforms.find(p => p.id === selectedPlatform)?.name}发布</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 显示当前应用的设置 */}
        {appliedSettings && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm">
            <div className="text-xs text-green-400 font-medium">
              ✅ 已应用设置: {appliedSettings.name} ({appliedSettings.platform === 'wechat' ? '微信公众号' : appliedSettings.platform})
            </div>
            {appliedSettings.headerContent && (
              <div className="text-xs text-green-400/70 mt-1">
                📝 包含开头内容
              </div>
            )}
            {appliedSettings.footerContent && (
              <div className="text-xs text-green-400/70 mt-1">
                📝 包含结尾内容
              </div>
            )}
          </div>
        )}
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* 长图文平台预览 */}
        {getPlatformType(selectedPlatform) === 'long_text' && (
          <>
            {isConverting || !content ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  {isConverting ? (
                    <div className="flex items-center justify-center space-x-2 text-zinc-400">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">转换中...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-zinc-500">
                      <div className="text-3xl">📝</div>
                      <div className="text-sm">开始输入内容以查看预览</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6">
                <div className="flex-1">
                  {selectedPlatform === 'wechat' && <WechatPreview title={title} content={previewHtml} />}
                  {selectedPlatform === 'zhihu' && <ZhihuPreview title={title} content={previewHtml} />}
                  {selectedPlatform === 'juejin' && <JuejinPreview title={title} content={previewHtml} />}
                  {selectedPlatform === 'zsxq' && <ZsxqPreview title={title} content={previewHtml} />}
                </div>
              </div>
            )}
          </>
        )}

        {/* 短图文平台预览 */}
        {getPlatformType(selectedPlatform) === 'short_text' && (
          <div className="flex-1 flex flex-col p-6">
            {!content.trim() ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2 text-zinc-500">
                  <div className="text-3xl">📝</div>
                  <div className="text-sm">开始输入内容以查看预览</div>
                </div>
              </div>
            ) : (
              <ShortTextPreview
                platform={selectedPlatform}
                title={shortTextCache[selectedPlatform]?.title || title}
                content={previewText}
                tags={shortTextCache[selectedPlatform]?.tags || []}
                images={shortTextImages}
              />
            )}
          </div>
        )}

        {/* 视频平台预览 */}
        {isVideoPlatform(selectedPlatform) && (
          <div className="flex-1 flex flex-col p-6">
            {isGeneratingVideo || !content ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  {isGeneratingVideo ? (
                    <div className="flex items-center justify-center space-x-2 text-zinc-400">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">生成视频内容中...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-zinc-500">
                      <div className="text-3xl">🎬</div>
                      <div className="text-sm">开始输入内容以生成视频素材</div>
                    </div>
                  )}
                </div>
              </div>
            ) : videoMetadata ? (
              <VideoPreview
                platform={selectedPlatform}
                metadata={videoMetadata}
                title={title}
                platformInfo={videoPlatforms.find(p => p.id === selectedPlatform)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2 text-zinc-500">
                  <div className="text-3xl">⚠️</div>
                  <div className="text-sm">生成视频内容失败，请重试</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 视频平台预览
function VideoPreview({ platform, metadata, title, platformInfo }: {
  platform: Platform;
  metadata: any;
  title: string;
  platformInfo?: { id: Platform; name: string; icon: string; color: string; description: string };
}) {
  if (!platformInfo || !metadata) {
    return null;
  }

  // 复制内容到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加toast提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
        {/* 视频平台头部 */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 ${platformInfo.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg ring-1 ring-white/20`}>
              {platformInfo.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{platformInfo.name}发布预览</h2>
              <p className="text-sm text-zinc-400 mt-1">{platformInfo.description}</p>
            </div>
            <div className="text-right bg-white/5 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">预计时长</div>
              <div className="text-lg font-mono font-semibold text-primary">{metadata.estimatedDuration}秒</div>
            </div>
          </div>
        </div>

        {/* 视频内容区域 */}
        <div className="p-6 space-y-6">
          {/* 标题 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
                视频标题
              </h3>
              <button
                onClick={() => copyToClipboard(metadata.title, '标题')}
                className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-md transition-all hover:text-white"
              >
                复制
              </button>
            </div>
            <div className="p-4 bg-black/20 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
              <p className="text-white font-medium text-lg">{metadata.title}</p>
            </div>
          </div>

          {/* 描述 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
                视频描述
              </h3>
              <button
                onClick={() => copyToClipboard(metadata.description, '描述')}
                className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-md transition-all hover:text-white"
              >
                复制
              </button>
            </div>
            <div className="p-4 bg-black/20 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{metadata.description}</p>
            </div>
          </div>

          {/* 标签 */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                  <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
                  标签
                </h3>
                <button
                  onClick={() => copyToClipboard(metadata.tags.map((tag: string) => `#${tag}`).join(' '), '标签')}
                  className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-md transition-all hover:text-white"
                >
                  复制全部
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 封面 */}
          {(metadata.coverImage || metadata.coverImage169 || metadata.coverImage43 || metadata.coverSuggestion) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                  <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
                  视频封面
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platform === 'bilibili' && (metadata.coverImage169 || metadata.coverImage43) ? (
                  <>
                    {metadata.coverImage169 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs text-zinc-500 flex items-center">
                            <Monitor className="w-3 h-3 mr-1" />
                            个人空间封面 (16:9)
                          </span>
                          <button
                            onClick={() => copyToClipboard(metadata.coverImage169, '16:9 封面')}
                            className="text-[10px] px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5 rounded transition-colors"
                          >复制图片数据</button>
                        </div>
                        <div className="p-2 bg-black/40 rounded-xl border border-white/10 group relative overflow-hidden">
                          <img src={metadata.coverImage169} alt="16:9 封面" className="w-full aspect-video rounded-lg object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-[10px] text-white/80 font-medium">B站个人中心展示建议规格</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {metadata.coverImage43 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs text-zinc-500 flex items-center">
                            <Smartphone className="w-3 h-3 mr-1" />
                            首页推荐封面 (4:3)
                          </span>
                          <button
                            onClick={() => copyToClipboard(metadata.coverImage43, '4:3 封面')}
                            className="text-[10px] px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5 rounded transition-colors"
                          >复制图片数据</button>
                        </div>
                        <div className="p-2 bg-black/40 rounded-xl border border-white/10 group relative overflow-hidden">
                          <img src={metadata.coverImage43} alt="4:3 封面" className="w-full aspect-[4/3] rounded-lg object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-[10px] text-white/80 font-medium">B站瀑布流及搜索展示规划</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  metadata.coverImage && (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/10 relative group">
                      <img
                        src={metadata.coverImage}
                        alt="AI生成封面"
                        className="w-full rounded-lg object-cover shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <button
                        onClick={() => copyToClipboard(metadata.coverImage, '封面图片')}
                        className="absolute top-5 right-5 text-[10px] px-2 py-1 bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                      >
                        复制
                      </button>
                    </div>
                  )
                )}

                {metadata.coverSuggestion && (
                  <div className={`p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 ${(!metadata.coverImage && !metadata.coverImage169) ? 'col-span-full' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-400 mb-1">封面设计建议</div>
                        <p className="text-sm text-blue-200/80 leading-relaxed italic">"{metadata.coverSuggestion}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 口播稿 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
                口播稿
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-zinc-500 font-mono">{metadata.speechScript?.length || 0} 字</span>
                <button
                  onClick={() => copyToClipboard(metadata.speechScript, '口播稿')}
                  className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-md transition-all hover:text-white"
                >
                  复制
                </button>
              </div>
            </div>
            <div className="p-4 bg-black/20 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono text-sm opacity-90">
                {metadata.speechScript}
              </p>
            </div>
          </div>

          {/* 平台建议 */}
          {metadata.platformTips && metadata.platformTips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                <span className="w-1 h-4 bg-yellow-500/80 rounded-full mr-2"></span>
                平台发布建议
              </h3>
              <div className="p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                <ul className="space-y-3">
                  {metadata.platformTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-yellow-200/80">
                      <span className="text-yellow-500 mt-0.5">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 短图文平台预览（纯文本）
function ShortTextPreview({ platform, title, content, tags = [], images = [] }: {
  platform: Platform;
  title: string;
  content: string;
  tags?: string[];
  images?: ExtractedImage[];
}) {
  const platformInfo = PLATFORM_CONFIGS[platform];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const limits: Partial<Record<Platform, number>> = {
    xiaohongshu_note: 1000,
    weibo: 2000,
    jike: 2000,
    x: 4000,
  };

  const max = limits[platform];
  const charCount = (content || '').length;
  const isOverLimit = typeof max === 'number' && max > 0 && charCount > max;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{platformInfo.icon}</span>
            <div>
              <div className="text-zinc-200 font-medium">{platformInfo.name} 预览</div>
              <div className="text-xs text-zinc-500 mt-0.5">短图文平台以纯文本为准（实际样式以平台为准）</div>
            </div>
          </div>
          <div className={`text-xs font-medium ${isOverLimit ? 'text-red-400' : 'text-zinc-400'}`}>
            {max ? `${charCount} / ${max} 字` : `${charCount} 字`}
          </div>
        </div>

        {platform === 'xiaohongshu_note' && title?.trim() && (
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-1">标题</div>
            <div className="text-sm text-zinc-200 whitespace-pre-wrap">{title.trim()}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-zinc-500 mb-1">正文</div>
          <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{content}</pre>
        </div>

        {tags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">建议话题</div>
              <button
                onClick={() => copyToClipboard(tags.map(t => `#${t}`).join(' '))}
                className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 rounded"
                title="复制话题到剪贴板"
              >
                复制
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">配图（{images.length}）</div>
              <button
                onClick={() => copyToClipboard(images.map(img => img.url).join('\n'))}
                className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 rounded"
                title="复制图片链接（每行一个）"
              >
                复制链接
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {images.slice(0, 12).map((img, index) => (
                <div key={`${img.url}-${index}`} className="text-xs text-zinc-300 break-all">
                  {index + 1}. {img.alt ? `${img.alt} - ` : ''}{img.url}
                </div>
              ))}
              {images.length > 12 && (
                <div className="text-xs text-zinc-500">
                  仅展示前12张，复制链接可获取全部。
                </div>
              )}
            </div>
          </div>
        )}

        {isOverLimit && (
          <div className="mt-4 text-xs text-red-400">
            当前内容可能超出平台字数限制；建议精简或拆分为多条。
          </div>
        )}
      </div>
    </div>
  );
}

// 微信公众号预览
function WechatPreview({ title, content }: { title: string; content: string }) {
  const [wechatTheme, setWechatTheme] = useState<'day' | 'night'>(() => {
    if (typeof window === 'undefined') return 'day';
    try {
      const saved = localStorage.getItem('wechat-preview-theme');
      if (saved === 'night' || saved === 'day') return saved;
    } catch { }
    return 'night';
  });

  useEffect(() => {
    try {
      localStorage.setItem('wechat-preview-theme', wechatTheme);
    } catch { }
  }, [wechatTheme]);

  const isNight = wechatTheme === 'night';

  return (
    <div
      className={`p-6 flex flex-col items-center justify-center gap-6 min-h-full bg-transparent`}
    >
      {/* 日/夜模式切换（仅影响预览，不影响导出） */}
      <div
        className={`inline-flex items-center rounded-xl border p-1 shadow-sm backdrop-blur ${isNight ? 'bg-black/30 border-white/10' : 'bg-white/80 border-gray-200'
          }`}
      >
        <button
          type="button"
          onClick={() => setWechatTheme('day')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${wechatTheme === 'day'
            ? isNight
              ? 'bg-white/20 text-white'
              : 'bg-gray-900 text-white'
            : isNight
              ? 'text-white/60 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
            }`}
          aria-pressed={wechatTheme === 'day'}
        >
          <Sun className="h-3.5 w-3.5" />
          日间
        </button>
        <button
          type="button"
          onClick={() => setWechatTheme('night')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${wechatTheme === 'night'
            ? isNight
              ? 'bg-white/20 text-white'
              : 'bg-gray-900 text-white'
            : isNight
              ? 'text-white/60 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
            }`}
          aria-pressed={wechatTheme === 'night'}
        >
          <Moon className="h-3.5 w-3.5" />
          夜间
        </button>
      </div>

      {/* iPhone 样机 */}
      <div className="relative">
        <div className="w-[390px] h-[844px] bg-black rounded-[60px] p-2 shadow-2xl">
          <div
            className={`w-full h-full rounded-[48px] overflow-hidden flex flex-col relative ${isNight ? 'bg-[#1c1c1e]' : 'bg-white'
              }`}
          >
            {/* 动态岛 */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black rounded-full z-10"></div>

            {/* 状态栏 */}
            <div className={`h-12 flex items-center justify-between px-6 pt-4 ${isNight ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
              <div className={`text-sm font-semibold ${isNight ? 'text-white' : 'text-black'}`}>9:41</div>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className={`w-1 h-3 rounded-full ${isNight ? 'bg-white' : 'bg-black'}`}></div>
                  <div className={`w-1 h-4 rounded-full ${isNight ? 'bg-white' : 'bg-black'}`}></div>
                  <div className={`w-1 h-5 rounded-full ${isNight ? 'bg-white' : 'bg-black'}`}></div>
                  <div className={`w-1 h-6 rounded-full ${isNight ? 'bg-white' : 'bg-black'}`}></div>
                </div>
                <svg className={`w-4 h-4 ${isNight ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.166 4.999c5.208-5.208 13.651-5.208 18.859 0a.833.833 0 1 1-1.178 1.178c-4.375-4.375-11.471-4.375-15.846 0a.833.833 0 0 1-1.178-1.178z" />
                  <path d="M5.01 7.844c3.125-3.125 8.195-3.125 11.32 0a.833.833 0 1 1-1.178 1.178c-2.292-2.292-6.014-2.292-8.306 0a.833.833 0 0 1-1.178-1.178z" />
                  <path d="M7.854 10.688c1.042-1.042 2.734-1.042 3.776 0a.833.833 0 1 1-1.178 1.178.833.833 0 0 0-1.178 0 .833.833 0 0 1-1.178-1.178z" />
                  <circle cx="10" cy="15" r="1.5" />
                </svg>
                <div className="flex items-center">
                  <div className={`w-6 h-3 border rounded-sm relative ${isNight ? 'border-white/80' : 'border-black'}`}>
                    <div className="w-4 h-1.5 bg-green-500 rounded-sm absolute top-0.5 left-0.5"></div>
                  </div>
                  <div className={`w-0.5 h-1.5 rounded-r-sm ml-0.5 ${isNight ? 'bg-white/80' : 'bg-black'}`}></div>
                </div>
              </div>
            </div>

            {/* 微信公众号头部 */}
            <div
              className={`border-b px-4 py-3 flex items-center ${isNight ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-gray-100'
                }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_14px_36px_-18px_rgba(0,102,255,0.65)]">
                <span className="text-sm font-semibold">Z</span>
              </div>
              <div className="ml-3 flex-1">
                <div className={`text-base font-medium break-words whitespace-normal ${isNight ? 'text-white' : 'text-gray-900'}`}>
                  {title || '字流'}
                </div>
                <div className={`text-xs ${isNight ? 'text-white/60' : 'text-gray-500'}`}>刚刚</div>
              </div>
              <div className="flex items-center space-x-3">
                <svg className={`w-5 h-5 ${isNight ? 'text-white/40' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                </svg>
              </div>
            </div>

            {/* 文章内容区域 */}
            <div className={`flex-1 overflow-auto ${isNight ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
              <div className="px-4 py-4">
                <div
                  className={isNight ? 'wechat-preview text-[#f2f2f7]' : 'wechat-preview text-[#111827]'}
                  data-wechat-theme={wechatTheme}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>

            {/* 底部安全区域 */}
            <div className={`h-8 ${isNight ? 'bg-[#1c1c1e]' : 'bg-white'}`}></div>
          </div>
        </div>

        {/* 手机标签 */}
        <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium ${isNight ? 'text-white/60' : 'text-gray-500'}`}>
          iPhone 14 Pro 预览 · {isNight ? '夜间' : '日间'}
        </div>
      </div>
    </div>
  );
}

// 知乎预览
function ZhihuPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
        {/* 知乎头部 */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              知
            </div>
            <div>
              <div className="font-medium text-white">字流</div>
              <div className="text-sm text-zinc-500">刚刚发布</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{title || '文章标题'}</h1>
        </div>

        {/* 文章内容 */}
        <div className="p-6">
          <div
            className="zhihu-content prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2.61l.69.83L10 18h4m-7-10v2m0-2V9a2 2 0 012-2h2a2 2 0 012 2v1" />
            </svg>
            <span>赞同</span>
          </button>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>评论</span>
          </button>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 掘金预览
function JuejinPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
        {/* 掘金头部 */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-3xl font-bold text-white mb-4">{title || '文章标题'}</h1>
          <div className="flex items-center space-x-4 text-sm text-zinc-500">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                掘
              </div>
              <span className="text-zinc-300">字流</span>
            </div>
            <span>·</span>
            <span>刚刚</span>
            <span>·</span>
            <span>阅读 1</span>
          </div>
        </div>

        {/* 文章内容 */}
        <div className="p-6">
          <div
            className="juejin-content prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-zinc-500 hover:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>点赞</span>
            </button>
            <button className="flex items-center space-x-2 text-zinc-500 hover:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>评论</span>
            </button>
          </div>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// 知识星球预览
function ZsxqPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
        {/* 知识星球头部 */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
              星
            </div>
            <div>
              <div className="font-medium text-white">字流</div>
              <div className="text-sm text-zinc-500">刚刚发布</div>
            </div>
          </div>
          {title && <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>}
        </div>

        {/* 文章内容 */}
        <div className="p-6">
          <div
            className="zsxq-content prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2.61l.69.83L10 18h4m-7-10v2m0-2V9a2 2 0 012-2h2a2 2 0 012 2v1" />
            </svg>
            <span>点赞</span>
          </button>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>评论</span>
          </button>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}
