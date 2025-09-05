import { NextRequest, NextResponse } from 'next/server';
import { previewConversion, getAvailableStyles, WECHAT_STYLES } from '@/lib/converter';
import { z } from 'zod';

// 请求验证schema
const convertSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  platform: z.enum(['wechat', 'zhihu', 'juejin', 'zsxq']).default('wechat'),
  style: z.enum(['default', 'tech', 'minimal', 'elegant']).default('default'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platform, style } = convertSchema.parse(body);

    // 所有平台都使用相同的转换逻辑，只是样式不同
    const result = previewConversion(content, style as keyof typeof WECHAT_STYLES);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Convert error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
      error: error.issues?.[0]?.message || '参数错误',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '转换失败',
    }, { status: 500 });
  }
}

// 获取可用样式
export async function GET() {
  try {
    const styles = getAvailableStyles();

    return NextResponse.json({
      success: true,
      data: {
        styles,
        platforms: ['wechat', 'zhihu', 'juejin', 'zsxq'],
      },
    });
  } catch (error) {
    console.error('Get styles error:', error);

    return NextResponse.json({
      success: false,
      error: '获取样式失败',
    }, { status: 500 });
  }
}
