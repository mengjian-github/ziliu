import { NextRequest, NextResponse } from 'next/server';

// 统一设置 CORS，供插件在第三方站点调用 /api/config
function setCorsHeaders(response: NextResponse, request?: NextRequest) {
  const origin = request?.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const allowedOrigins = [
    appUrl,
    'https://mp.weixin.qq.com',
    'https://channels.weixin.qq.com',
    'https://juejin.cn',
    'https://zhuanlan.zhihu.com',
    'https://wx.zsxq.com'
  ];

  if (origin?.startsWith('chrome-extension://')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // 默认允许来自站点本身（开发时直接访问）
    response.headers.set('Access-Control-Allow-Origin', appUrl);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return setCorsHeaders(new NextResponse(null, { status: 200 }), request);
}

export async function GET(request: NextRequest) {
  // 返回当前配置信息（用于插件运行时发现）
  const config = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  const response = NextResponse.json({ success: true, data: config });
  return setCorsHeaders(response, request);
}
