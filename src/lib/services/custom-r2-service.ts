import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// 用户自定义R2配置接口
export interface UserR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

// R2存储服务类
export class CustomR2Service {
  private client: S3Client | null = null;
  private config: UserR2Config | null = null;

  constructor(config: UserR2Config) {
    this.config = config;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
      tls: true,
    });
  }

  /**
   * 上传图片到用户自定义R2存储
   */
  async uploadImage(
    file: File | Blob, 
    fileName: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!this.client || !this.config) {
        return { success: false, error: 'R2配置错误' };
      }

      // 生成唯一文件名
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `images/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

      // 将文件转换为 Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 上传到用户的R2存储
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: filePath,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
        ContentLength: buffer.length,
        Metadata: {
          'upload-time': new Date().toISOString(),
          'original-name': Buffer.from(fileName, 'utf8').toString('base64'),
        },
      });

      await this.client.send(uploadCommand);

      // 构建公开访问 URL
      const publicUrl = this.config.publicUrl 
        ? `${this.config.publicUrl}/${filePath}`
        : `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${filePath}`;

      return {
        success: true,
        url: publicUrl
      };

    } catch (error) {
      console.error('自定义R2上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 测试R2连接
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client || !this.config) {
        return { success: false, error: 'R2配置错误' };
      }

      // 尝试列出存储桶内容（限制1个对象）
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1
      });

      await this.client.send(command);
      return { success: true };

    } catch (error) {
      console.error('R2连接测试失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '连接失败'
      };
    }
  }
}

/**
 * 获取用户的自定义R2配置
 */
export async function getUserR2Config(userEmail: string): Promise<UserR2Config | null> {
  try {
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    console.log(`[R2配置] 查询用户 ${userEmail} 配置:`, user.length > 0 ? {
      useCustomR2: user[0].useCustomR2,
      hasAccountId: !!user[0].customR2AccountId,
      hasAccessKey: !!user[0].customR2AccessKeyId,
      hasSecretKey: !!user[0].customR2SecretAccessKey,
      hasBucketName: !!user[0].customR2BucketName
    } : '用户不存在');
    
    if (!user.length || !user[0].useCustomR2) {
      console.log(`[R2配置] 用户 ${userEmail} 未启用自定义R2或用户不存在`);
      return null;
    }

    const userData = user[0];
    if (!userData.customR2AccountId || !userData.customR2AccessKeyId || 
        !userData.customR2SecretAccessKey || !userData.customR2BucketName) {
      console.log(`[R2配置] 用户 ${userEmail} 的R2配置信息不完整`);
      return null;
    }

    console.log(`[R2配置] 用户 ${userEmail} 的R2配置有效，返回配置`);
    return {
      accountId: userData.customR2AccountId,
      accessKeyId: userData.customR2AccessKeyId,
      secretAccessKey: userData.customR2SecretAccessKey,
      bucketName: userData.customR2BucketName,
      publicUrl: userData.customR2PublicUrl || undefined,
    };

  } catch (error) {
    console.error('获取用户R2配置失败:', error);
    return null;
  }
}

/**
 * 保存用户的自定义R2配置
 */
export async function saveUserR2Config(
  userEmail: string, 
  config: UserR2Config & { enabled: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 验证配置
    if (config.enabled) {
      if (!config.accountId || !config.accessKeyId || 
          !config.secretAccessKey || !config.bucketName) {
        return { success: false, error: '请填写完整的R2配置信息' };
      }

      // 测试连接
      const r2Service = new CustomR2Service(config);
      const testResult = await r2Service.testConnection();
      if (!testResult.success) {
        return { success: false, error: `R2配置测试失败：${testResult.error}` };
      }
    }

    // 保存到数据库
    await db
      .update(users)
      .set({
        useCustomR2: config.enabled,
        customR2AccountId: config.enabled ? config.accountId : null,
        customR2AccessKeyId: config.enabled ? config.accessKeyId : null,
        customR2SecretAccessKey: config.enabled ? config.secretAccessKey : null,
        customR2BucketName: config.enabled ? config.bucketName : null,
        customR2PublicUrl: config.enabled ? config.publicUrl : null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, userEmail));

    return { success: true };

  } catch (error) {
    console.error('保存R2配置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存失败'
    };
  }
}

/**
 * 检查用户是否可以使用自定义R2（专业版权限）
 */
export async function canUseCustomR2(userEmail: string): Promise<boolean> {
  try {
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user.length) return false;

    const userData = user[0];
    const userPlan = userData.plan || 'free';
    const planExpiredAt = userData.planExpiredAt;

    // 检查是否是有效的专业版用户
    return userPlan === 'pro' && (!planExpiredAt || new Date(planExpiredAt) > new Date());
  } catch (error) {
    console.error('检查用户权限失败:', error);
    return false;
  }
}