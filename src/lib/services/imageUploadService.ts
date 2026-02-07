'use client';

import { useUserPlan } from '../subscription/hooks/useUserPlan';

export interface ImageUploadResult {
  success: boolean;
  data?: {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadPath: string;
  };
  error?: string;
  upgradeRequired?: boolean;
  featureId?: string;
}

export interface ImageUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (result: ImageUploadResult) => void;
  onError?: (error: string, upgradeRequired?: boolean) => void;
}

/**
 * 统一的图片上传服务
 * 处理所有图片上传场景：组件上传、拖拽、粘贴等
 */
export class ImageUploadService {
  private checkFeatureAccess: (featureId: string) => { hasAccess: boolean; reason?: string };

  constructor(checkFeatureAccess: (featureId: string) => { hasAccess: boolean; reason?: string }) {
    this.checkFeatureAccess = checkFeatureAccess;
  }

  /**
   * 上传单个图片文件
   */
  async uploadImage(file: File, options?: ImageUploadOptions): Promise<ImageUploadResult> {
    try {
      // 1. 前端权限预检查（用于用户体验）
      const cloudAccess = this.checkFeatureAccess('cloud-images');
      if (!cloudAccess.hasAccess) {
        const result: ImageUploadResult = {
          success: false,
          error: cloudAccess.reason || '当月图片使用量已达上限',
          upgradeRequired: true,
          featureId: 'cloud-images'
        };
        
        if (result.error) {
          options?.onError?.(result.error, result.upgradeRequired);
        }
        return result;
      }

      // 2. 文件格式和大小检查
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        const result: ImageUploadResult = {
          success: false,
          error: validationResult.error
        };
        
        if (result.error) {
          options?.onError?.(result.error);
        }
        return result;
      }

      // 3. 上传到服务器
      const formData = new FormData();
      formData.append('file', file);

      options?.onProgress?.(0);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      options?.onProgress?.(100);

      // 4. 处理服务器响应
      if (result.success) {
        options?.onSuccess?.(result);
        return result;
      } else {
        // 服务器端权限检查失败
        const uploadResult: ImageUploadResult = {
          success: false,
          error: result.error,
          upgradeRequired: result.upgradeRequired || false,
          featureId: result.featureId
        };
        
        if (uploadResult.error) {
          options?.onError?.(uploadResult.error, uploadResult.upgradeRequired);
        }
        return uploadResult;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      const result: ImageUploadResult = {
        success: false,
        error: errorMessage
      };
      
      options?.onError?.(errorMessage);
      return result;
    }
  }

  /**
   * 批量上传图片
   */
  async uploadMultipleImages(files: File[], options?: ImageUploadOptions): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileOptions: ImageUploadOptions = {
        ...options,
        onProgress: (progress) => {
          const overallProgress = ((i * 100) + progress) / totalFiles;
          options?.onProgress?.(overallProgress);
        }
      };

      const result = await this.uploadImage(file, fileOptions);
      results.push(result);

      // 如果遇到权限问题，停止后续上传
      if (!result.success && result.upgradeRequired) {
        break;
      }
    }

    return results;
  }

  /**
   * 从拖拽事件上传图片
   */
  async uploadFromDrop(event: DragEvent, options?: ImageUploadOptions): Promise<ImageUploadResult[]> {
    const files = Array.from(event.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      const result: ImageUploadResult = {
        success: false,
        error: '请拖拽图片文件'
      };
      if (result.error) {
        options?.onError?.(result.error);
      }
      return [result];
    }

    return this.uploadMultipleImages(imageFiles, options);
  }

  /**
   * 从粘贴事件上传图片
   */
  async uploadFromPaste(event: ClipboardEvent, options?: ImageUploadOptions): Promise<ImageUploadResult[]> {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) {
      return [];
    }

    const files = imageItems
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (files.length === 0) {
      const result: ImageUploadResult = {
        success: false,
        error: '无法获取粘贴的图片'
      };
      if (result.error) {
        options?.onError?.(result.error);
      }
      return [result];
    }

    return this.uploadMultipleImages(files, options);
  }

  /**
   * 文件验证
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB（受 Vercel Serverless 4.5MB body 限制）

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: '不支持的文件格式，仅支持 JPEG、PNG、GIF、WebP'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: '文件大小超过限制（最大 4MB），建议先压缩图片再上传'
      };
    }

    return { valid: true };
  }
}

/**
 * React Hook：获取图片上传服务实例
 */
export function useImageUploadService(): ImageUploadService {
  const { checkFeatureAccess } = useUserPlan();
  
  // 每次渲染都创建新实例，确保权限检查是最新的
  return new ImageUploadService(checkFeatureAccess);
}