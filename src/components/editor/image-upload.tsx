'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useImageUploadService, ImageUploadResult } from '@/lib/services/imageUploadService';

interface ImageUploadProps {
  onUpload: (url: string, fileName: string) => void;
  onError?: (error: string, upgradeRequired?: boolean) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export function ImageUpload({ onUpload, onError, disabled = false, className = '' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用统一的图片上传服务
  const imageUploadService = useImageUploadService();

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      onError?.('请选择图片文件');
      return;
    }

    // 初始化上传进度
    const newUploads: UploadProgress[] = imageFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // 使用统一上传服务
    const results = await imageUploadService.uploadMultipleImages(imageFiles, {
      onProgress: (overallProgress) => {
        // 这里可以更新整体进度，暂时简化
      },
      onSuccess: (result) => {
        if (result.data) {
          // 找到对应文件并更新状态
          setUploads(prev => prev.map(upload => 
            upload.fileName === result.data!.fileName
              ? { ...upload, status: 'success', progress: 100, url: result.data!.url }
              : upload
          ));

          // 调用回调函数
          onUpload(result.data.url, result.data.fileName);

          // 2秒后移除成功的上传项
          setTimeout(() => {
            setUploads(prev => prev.filter(upload => upload.fileName !== result.data!.fileName));
          }, 2000);
        }
      },
      onError: (error, upgradeRequired) => {
        onError?.(error, upgradeRequired);
      }
    });

    // 处理失败的上传
    results.forEach((result, index) => {
      if (!result.success) {
        const fileName = imageFiles[index].name;
        
        setUploads(prev => prev.map(upload => 
          upload.fileName === fileName
            ? { ...upload, status: 'error', error: result.error }
            : upload
        ));

        // 如果需要升级，触发错误回调
        if (result.upgradeRequired) {
          onError?.(result.error || '上传失败', result.upgradeRequired);
        }

        // 5秒后移除失败的上传项
        setTimeout(() => {
          setUploads(prev => prev.filter(upload => upload.fileName !== fileName));
        }, 5000);
      }
    });
  }, [disabled, onUpload, onError, imageUploadService]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [disabled, handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  }, [handleFileUpload]);

  const handleButtonClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removeUpload = useCallback((fileName: string) => {
    setUploads(prev => prev.filter(upload => upload.fileName !== fileName));
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 上传按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled}
        title="上传图片"
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      {/* 拖拽区域（当有文件拖拽时显示） */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-lg p-8 shadow-lg border border-blue-200">
            <div className="text-center">
              <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-blue-700">释放以上传图片</p>
              <p className="text-sm text-blue-500 mt-1">支持 JPEG、PNG、GIF、WebP 格式</p>
            </div>
          </div>
        </div>
      )}

      {/* 上传进度列表 */}
      {uploads.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
          {uploads.map((upload) => (
            <div key={upload.fileName} className="p-3 border-b last:border-b-0 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {upload.status === 'success' && (
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  {upload.status === 'error' && (
                    <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="h-2 w-2 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{upload.fileName}</span>
                </div>
                {upload.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                )}
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}
                {upload.status === 'success' && (
                  <p className="text-xs text-green-500 mt-1">上传成功</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUpload(upload.fileName)}
                className="ml-2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
