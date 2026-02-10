import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/middleware/api-key-auth';
import { uploadImageToR2 } from '@/lib/services/image-service';

export async function POST(request: NextRequest) {
  try {
    // 检查用户认证（支持 API Key 和 Session）
    const user = await getAuthUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 使用公共服务上传图片
    const result = await uploadImageToR2(file, file.name, user.email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          fileType: result.fileType,
          uploadPath: result.uploadPath,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败，请重试' 
      },
      { status: 500 }
    );
  }
}
