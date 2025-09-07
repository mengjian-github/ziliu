'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Loader2, Plus, Star, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Platform, PlatformSettings, PLATFORM_CONFIGS, getDefaultPlatformConfig } from '@/types/platform-settings';
import { PlatformConfigForm } from './platform-config-forms';

// 使用统一的PlatformSettings类型

interface PublishSettingsProps {
  platform: Platform;
  onApplySettings: (settings: PlatformSettings) => void;
}

export function PublishSettings({ platform, onApplySettings }: PublishSettingsProps) {
  // 状态持久化key
  const storageKey = `publish-settings-ui-state-${platform}`;
  
  // 从localStorage获取保存的UI状态
  const getSavedUIState = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load publish settings UI state:', error);
      return null;
    }
  };

  const savedUIState = getSavedUIState();
  
  const [settings, setSettings] = useState<PlatformSettings[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSettings, setEditingSettings] = useState<PlatformSettings | null>(null);
  const [showHeaderPreview, setShowHeaderPreview] = useState(false);
  const [showFooterPreview, setShowFooterPreview] = useState(false);

  // 保存编辑中的内容到localStorage
  const saveEditingContent = useCallback((settings: PlatformSettings | null) => {
    if (typeof window === 'undefined') return;
    
    try {
      const state = {
        editingSettings: settings,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save editing content:', error);
    }
  }, [storageKey]);

  // 恢复编辑中的内容
  useEffect(() => {
    if (savedUIState?.editingSettings && showCreateForm) {
      setEditingSettings(savedUIState.editingSettings);
    }
  }, [savedUIState, showCreateForm]);

  // 获取平台图标
  const getPlatformIcon = (platform: Platform) => {
    const icons = {
      wechat: '📱',
      zhihu: '🔵',
      juejin: '⚡',
      zsxq: '🌟',
      video_wechat: '📹',
      douyin: '🎵',
      bilibili: '📺',
      xiaohongshu: '📖'
    };
    return icons[platform] || '📄';
  };

  // 获取平台名称
  const getPlatformName = (platform: Platform) => {
    const names = {
      wechat: '公众号',
      zhihu: '知乎',
      juejin: '掘金',
      zsxq: '知识星球',
      video_wechat: '微信视频号',
      douyin: '抖音',
      bilibili: 'B站',
      xiaohongshu: '小红书'
    };
    return names[platform] || platform;
  };

  // 简单的Markdown渲染函数
  const renderMarkdown = (text: string) => {
    if (!text) return '';

    return text
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
      // 换行
      .replace(/\n/g, '<br>');
  };

  // 加载平台特定的发布设置
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // 添加平台过滤参数
      const response = await fetch(`/api/presets?platform=${platform}`);
      const data = await response.json();

      if (data.success) {
        // 数据已经是正确的格式，直接使用
        const platformSettings: PlatformSettings[] = data.data;
        setSettings(platformSettings);

        // 自动选择默认设置
        const defaultSetting = platformSettings.find(s => s.isDefault);
        if (defaultSetting) {
          setSelectedSettingId(defaultSetting.id);
        } else if (platformSettings.length > 0) {
          setSelectedSettingId(platformSettings[0].id);
        }
      } else {
        console.error('加载发布设置失败:', data.error);
      }
    } catch (error) {
      console.error('加载发布设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [platform]);

  // 应用设置
  const handleApplySettings = async () => {
    const setting = settings.find(s => s.id === selectedSettingId);
    if (!setting) {
      alert('请选择一个发布设置');
      return;
    }

    try {
      onApplySettings(setting);
      setShowDropdown(false);
    } catch (error) {
      console.error('应用设置失败:', error);
      alert('应用设置失败，请重试');
    }
  };

  // 创建新设置
  const handleCreateSettings = () => {
    const newSettings: PlatformSettings = {
      id: '',
      name: '',
      platform,
      isDefault: false,
      authorName: '',
      headerContent: '',
      footerContent: '',
      platformConfig: getDefaultPlatformConfig(platform)
    };
    setEditingSettings(newSettings);
    setShowCreateForm(true);
  };

  useEffect(() => {
    loadSettings();
  }, [platform]); // 只依赖platform，当平台改变时重新加载

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-purple-700 border-purple-200 hover:bg-purple-50"
      >
        <Settings className="h-4 w-4 mr-1" />
        发布设置
      </Button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                {getPlatformIcon(platform)}
                <span className="ml-2">{getPlatformName(platform)}发布设置</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdown(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">加载中...</span>
              </div>
            ) : settings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">⚙️</div>
                <p className="text-sm text-gray-500 mb-3">暂无发布设置</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateSettings}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  创建设置
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 设置列表 */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {settings.map((setting) => (
                    <div
                      key={setting.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSettingId === setting.id
                          ? 'border-purple-200 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSettingId(setting.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-sm text-gray-900">
                            {setting.name}
                          </div>
                          {setting.isDefault && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSettings(setting);
                              setShowCreateForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('确定要删除这个设置吗？')) {
                                try {
                                  const response = await fetch(`/api/presets/${setting.id}`, {
                                    method: 'DELETE',
                                  });
                                  const data = await response.json();

                                  if (data.success) {
                                    // 重新加载设置列表
                                    await loadSettings();
                                    // 如果删除的是当前选中的设置，清空选择
                                    if (selectedSettingId === setting.id) {
                                      setSelectedSettingId('');
                                    }
                                  } else {
                                    alert('删除失败：' + data.error);
                                  }
                                } catch (error) {
                                  console.error('删除设置失败:', error);
                                  alert('删除失败，请重试');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* 显示设置摘要 */}
                      <div className="text-xs text-gray-500 mt-1">
                        {platform === 'wechat' && setting.authorName && `作者: ${setting.authorName}`}
                        {(platform === 'zhihu' || platform === 'juejin') && '支持开头和结尾内容设置'}
                        {platform === 'zsxq' && '知识星球一键发布，自动识别所有星球'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateSettings}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    新建设置
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleApplySettings}
                    disabled={!selectedSettingId}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    应用设置
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 创建/编辑设置表单 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingSettings?.id ? '编辑' : '创建'}{getPlatformName(platform)}发布设置
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingSettings(null);
                  saveEditingContent(null);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  设置名称
                </label>
                <Input
                  value={editingSettings?.name || ''}
                  onChange={(e) => {
                    const newSettings = editingSettings ? {...editingSettings, name: e.target.value} : null;
                    setEditingSettings(newSettings);
                    saveEditingContent(newSettings);
                  }}
                  placeholder="输入设置名称"
                />
              </div>

              {/* 平台特定字段 */}
              {platform === 'wechat' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      作者名称
                    </label>
                    <Input
                      value={editingSettings?.authorName || ''}
                      onChange={(e) => {
                        const newSettings = editingSettings ? {...editingSettings, authorName: e.target.value} : null;
                        setEditingSettings(newSettings);
                        saveEditingContent(newSettings);
                      }}
                      placeholder="输入作者名称"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        开头内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHeaderPreview(!showHeaderPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showHeaderPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showHeaderPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(editingSettings?.headerContent || '') || '<span class="text-gray-400">预览内容将在这里显示...</span>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.headerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, headerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章开头的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        结尾内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFooterPreview(!showFooterPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showFooterPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showFooterPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(editingSettings?.footerContent || '') || '<span class="text-gray-400">预览内容将在这里显示...</span>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.footerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, footerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章结尾的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                </>
              )}

              {/* 知识星球平台特定字段 */}
              {platform === 'zsxq' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        开头内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHeaderPreview(!showHeaderPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showHeaderPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showHeaderPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(editingSettings?.headerContent || '') || '<span class="text-gray-400">预览内容将在这里显示...</span>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.headerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, headerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章开头的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        结尾内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFooterPreview(!showFooterPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showFooterPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showFooterPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(editingSettings?.footerContent || '') || '<span class="text-gray-400">预览内容将在这里显示...</span>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.footerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, footerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章结尾的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                </>
              )}

              {/* 知乎和掘金平台特定字段 */}
              {(platform === 'zhihu' || platform === 'juejin') && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        开头内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHeaderPreview(!showHeaderPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showHeaderPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showHeaderPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: editingSettings?.headerContent || '<p class="text-gray-400">暂无开头内容</p>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.headerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, headerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章开头的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        结尾内容
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFooterPreview(!showFooterPreview)}
                        className="h-6 w-6 p-0"
                      >
                        {showFooterPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {showFooterPreview ? (
                      <div className="border rounded-md p-3 bg-gray-50 min-h-[80px] text-sm">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: editingSettings?.footerContent || '<p class="text-gray-400">暂无结尾内容</p>'
                          }}
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={editingSettings?.footerContent || ''}
                        onChange={(e) => {
                          const newSettings = editingSettings ? {...editingSettings, footerContent: e.target.value} : null;
                          setEditingSettings(newSettings);
                          saveEditingContent(newSettings);
                        }}
                        placeholder="输入文章结尾的固定内容（支持Markdown）"
                        rows={3}
                      />
                    )}
                  </div>
                </>
              )}

              {/* 平台特定配置 */}
              <div className="border-t pt-4">
                <PlatformConfigForm
                  platform={platform}
                  config={editingSettings?.platformConfig || getDefaultPlatformConfig(platform)}
                  onChange={(config) => setEditingSettings(prev => prev ? {...prev, platformConfig: config} : null)}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSettings(null);
                    saveEditingContent(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingSettings?.name.trim()) {
                      alert('请输入预设名称');
                      return;
                    }

                    try {
                      const isEditing = !!editingSettings.id;
                      const url = isEditing ? `/api/presets/${editingSettings.id}` : '/api/presets';
                      const method = isEditing ? 'PUT' : 'POST';

                      const response = await fetch(url, {
                        method,
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          name: editingSettings.name,
                          platform: editingSettings.platform,
                          authorName: editingSettings.authorName || '',
                          headerContent: editingSettings.headerContent || '',
                          footerContent: editingSettings.footerContent || '',
                          isDefault: editingSettings.isDefault || false,
                          platformConfig: editingSettings.platformConfig || null,
                        }),
                      });

                      const data = await response.json();

                      if (data.success) {
                        // 重新加载设置列表
                        await loadSettings();
                        setShowCreateForm(false);
                        setEditingSettings(null);
                        saveEditingContent(null);
                      } else {
                        alert('保存失败：' + data.error);
                      }
                    } catch (error) {
                      console.error('保存设置失败:', error);
                      alert('保存失败，请重试');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
