'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { EditorToolbar } from './editor-toolbar';
import { useImageUploadService } from '@/lib/services/imageUploadService';
import { UpgradePrompt } from '@/lib/subscription/components/UpgradePrompt';
import { useEditorHistory } from '@/hooks/use-editor-history';


interface EditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export function MultiPlatformEditor({
  title,
  content,
  onTitleChange,
  onContentChange
}: EditorProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });
  const [showImageUpgradePrompt, setShowImageUpgradePrompt] = useState(false);
  const [isConvertingMarkdownImages, setIsConvertingMarkdownImages] = useState(false);
  
  // 使用统一的图片上传服务
  const imageUploadService = useImageUploadService();

  // 历史记录管理
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { canUndo, canRedo, undo, redo, pushState } = useEditorHistory(
    { title, content },
    useCallback((state) => {
      onTitleChange(state.title);
      onContentChange(state.content);
    }, [onTitleChange, onContentChange])
  );

  // 防抖保存历史记录
  const debouncePushState = useCallback((newTitle: string, newContent: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      pushState({ title: newTitle, content: newContent });
    }, 500); // 500ms 防抖
  }, [pushState]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };





  // 处理图片上传成功
  const handleImageUpload = useCallback((url: string, fileName: string) => {
    const markdownImage = `![${fileName}](${url})`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    let newContent: string;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newContent = content.slice(0, start) + markdownImage + content.slice(end);
      onContentChange(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(start + markdownImage.length, start + markdownImage.length);
        textarea.focus();
      }, 0);
    } else {
      newContent = content + '\n\n' + markdownImage;
      onContentChange(newContent);
    }
    
    debouncePushState(title, newContent);
  }, [content, onContentChange, title, debouncePushState]);

  // 处理图片上传错误
  const handleImageUploadError = useCallback((error: string, upgradeRequired?: boolean) => {
    console.error('图片上传失败:', error);
    if (upgradeRequired) {
      // 显示专业的订阅引导弹窗
      setShowImageUpgradePrompt(true);
    } else {
      showToast(error, 'error');
    }
  }, [showToast]);

  // 插入文本到编辑器
  const handleInsertText = useCallback((text: string, cursorOffset?: number) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + text + content.slice(end);
      onContentChange(newContent);
      debouncePushState(title, newContent);

      setTimeout(() => {
        const newCursorPos = cursorOffset !== undefined
          ? start + cursorOffset
          : start + text.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    } else {
      const newContent = content + text;
      onContentChange(newContent);
      debouncePushState(title, newContent);
    }
  }, [content, onContentChange, title, debouncePushState]);



  // 处理拖拽文件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    // 使用统一的图片上传服务
    const results = await imageUploadService.uploadFromDrop(e.nativeEvent, {
      onSuccess: (result) => {
        if (result.data) {
          handleImageUpload(result.data.url, result.data.fileName);
        }
      },
      onError: (error, upgradeRequired) => {
        handleImageUploadError(error, upgradeRequired);
      }
    });

    // 处理批量结果
    results.forEach(result => {
      if (result.success && result.data) {
        handleImageUpload(result.data.url, result.data.fileName);
      } else if (!result.success) {
        handleImageUploadError(result.error || '上传失败', result.upgradeRequired);
      }
    });
  }, [imageUploadService, handleImageUpload, handleImageUploadError]);

  // 检测是否为飞书内容
  const isFeishuContent = (content: string): boolean => {
    const feishuIndicators = [
      'data-lake-id',
      'lark-record-data',
      'feishu.cn',
      'larksuite.com',
      'data-card-value'
    ];
    return feishuIndicators.some(indicator => content.includes(indicator));
  };

  // 处理粘贴内容（图片和飞书内容）
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const htmlContent = clipboardData.getData('text/html');
    const textContent = clipboardData.getData('text/plain');
    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    // 优先处理飞书HTML内容
    if (htmlContent && isFeishuContent(htmlContent)) {
      e.preventDefault();

      try {
        showToast('正在处理飞书内容...', 'info');

        const response = await fetch('/api/parse-feishu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: htmlContent }),
        });

        const data = await response.json();

        if (data.success) {
          // 直接替换编辑器内容
          onContentChange(data.markdown);
          
          // 检查是否有图片警告
          if (data.imageWarning) {
            showToast(`飞书内容导入成功！${data.imageWarning}`, 'info');
          } else {
            showToast('飞书内容导入成功！', 'success');
          }
        } else {
          throw new Error(data.error || '解析失败');
        }
      } catch (error) {
        console.error('飞书内容解析失败:', error);
        showToast('飞书内容解析失败，请重试', 'error');
      }
      return;
    }

    // 处理图片粘贴
    if (imageItems.length > 0) {
      e.preventDefault();

      // 使用统一的图片上传服务
      const results = await imageUploadService.uploadFromPaste(e.nativeEvent, {
        onSuccess: (result) => {
          if (result.data) {
            handleImageUpload(result.data.url, result.data.fileName);
          }
        },
        onError: (error, upgradeRequired) => {
          handleImageUploadError(error, upgradeRequired);
        }
      });

      // 处理批量结果
      results.forEach(result => {
        if (result.success && result.data) {
          handleImageUpload(result.data.url, result.data.fileName);
        } else if (!result.success) {
          handleImageUploadError(result.error || '上传失败', result.upgradeRequired);
        }
      });
    }
  }, [handleImageUpload, handleImageUploadError, onContentChange, imageUploadService]);

  const handleConvertMarkdownImages = useCallback(async () => {
    const markdownImagePattern = /!\[[^\]]*\]\([^)]*\)/;
    if (!markdownImagePattern.test(content)) {
      showToast('当前内容没有可转换的Markdown图片', 'info');
      return;
    }

    setIsConvertingMarkdownImages(true);

    try {
      const response = await fetch('/api/markdown/convert-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown: content }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '图片批量转换失败');
      }

      if (data.processedImages > 0) {
        onContentChange(data.markdown);
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        pushState({ title, content: data.markdown });

        if (data.imageWarning) {
          showToast(data.imageWarning, 'info');
        } else {
          showToast(`已成功上传 ${data.processedImages} 张图片到图床`, 'success');
        }
      } else {
        showToast(data.imageWarning || '没有需要处理的图片', 'info');
      }
    } catch (error) {
      console.error('Markdown图片转换失败:', error);
      const message = error instanceof Error ? error.message : '图片批量转换失败，请稍后重试';
      showToast(message, 'error');
    } finally {
      setIsConvertingMarkdownImages(false);
    }
  }, [content, onContentChange, pushState, showToast, title]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);




  return (
    <div className="h-full flex flex-col bg-white">
      {/* 编辑器区域 */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* 拖拽覆盖层 */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-10 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-lg border border-blue-200">
              <div className="text-center">
                <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700">释放以上传图片</p>
              </div>
            </div>
          </div>
        )}

        {/* 标题输入 */}
        <div className="p-6 border-b border-gray-100">
          <Input
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              onTitleChange(newTitle);
              debouncePushState(newTitle, content);
            }}
            placeholder="请输入文章标题..."
            className="text-xl font-semibold border-none px-0 focus-visible:ring-0 placeholder:text-gray-400"
          />
        </div>

        {/* 编辑器工具栏 */}
        <EditorToolbar
          onInsertText={handleInsertText}
          onImageUpload={handleImageUpload}
          onImageUploadError={handleImageUploadError}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onConvertMarkdownImages={handleConvertMarkdownImages}
          isConvertingMarkdownImages={isConvertingMarkdownImages}
        />

        {/* 内容编辑器 */}
        <div
          className="flex-1 p-6"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Textarea
            value={content}
            onChange={(e) => {
              const newContent = e.target.value;
              onContentChange(newContent);
              debouncePushState(title, newContent);
            }}
            onPaste={handlePaste}
            placeholder={`请输入Markdown内容...

# 示例标题

这是一个段落示例。

## 二级标题

- 列表项1
- 列表项2

\`\`\`javascript
console.log('代码示例');
\`\`\`

> 这是一个引用块

💡 提示：
- 可以直接拖拽图片到编辑器
- 可以粘贴剪贴板中的图片
- 点击工具栏的「上传图片」按钮选择文件`}
            className="h-full resize-none border-none px-0 focus-visible:ring-0 font-mono text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Toast 通知 */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`
            flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border
            ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}>
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="h-4 w-4 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 图片超限订阅引导弹窗 */}
      {showImageUpgradePrompt && (
        <UpgradePrompt 
          scenario="cloud-images-limit" 
          style="modal"
          onClose={() => setShowImageUpgradePrompt(false)}
        />
      )}
    </div>
  );
}
