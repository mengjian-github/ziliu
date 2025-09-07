import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getUserR2Config, 
  saveUserR2Config, 
  canUseCustomR2,
  UserR2Config 
} from '@/lib/services/custom-r2-service';

// 获取用户R2配置
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查用户权限
    const hasPermission = await canUseCustomR2(session.user.email);
    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: '自定义R2存储仅限专业版用户使用',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // 获取配置（不返回敏感信息）
    const config = await getUserR2Config(session.user.email);
    
    if (config) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          accountId: config.accountId,
          bucketName: config.bucketName,
          publicUrl: config.publicUrl,
          // 不返回密钥
          hasAccessKey: !!config.accessKeyId,
          hasSecretKey: !!config.secretAccessKey,
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          enabled: false,
          accountId: '',
          bucketName: '',
          publicUrl: '',
          hasAccessKey: false,
          hasSecretKey: false,
        }
      });
    }

  } catch (error) {
    console.error('获取R2配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// 保存用户R2配置
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查用户权限
    const hasPermission = await canUseCustomR2(session.user.email);
    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: '自定义R2存储仅限专业版用户使用',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } = body;

    // 验证必填字段
    if (enabled && (!accountId || !accessKeyId || !secretAccessKey || !bucketName)) {
      return NextResponse.json(
        { success: false, error: '请填写完整的R2配置信息' },
        { status: 400 }
      );
    }

    const config: UserR2Config & { enabled: boolean } = {
      enabled: !!enabled,
      accountId: accountId || '',
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
      bucketName: bucketName || '',
      publicUrl: publicUrl || undefined,
    };

    const result = await saveUserR2Config(session.user.email, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: enabled ? 'R2配置保存成功' : 'R2配置已禁用'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('保存R2配置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存失败，请重试' },
      { status: 500 }
    );
  }
}

// 测试R2连接
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查用户权限
    const hasPermission = await canUseCustomR2(session.user.email);
    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: '自定义R2存储仅限专业版用户使用' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } = body;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json(
        { success: false, error: '请填写完整的R2配置信息' },
        { status: 400 }
      );
    }

    // 动态导入避免在不需要时加载
    const { CustomR2Service } = await import('@/lib/services/custom-r2-service');
    
    const r2Service = new CustomR2Service({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl: publicUrl || undefined,
    });

    const testResult = await r2Service.testConnection();

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: 'R2连接测试成功'
      });
    } else {
      return NextResponse.json(
        { success: false, error: `连接测试失败：${testResult.error}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('R2连接测试失败:', error);
    return NextResponse.json(
      { success: false, error: '连接测试失败，请检查配置' },
      { status: 500 }
    );
  }
}