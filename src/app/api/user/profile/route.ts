import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 更新用户个人资料
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的昵称' },
        { status: 400 }
      );
    }

    // 验证长度
    if (name.trim().length > 50) {
      return NextResponse.json(
        { success: false, error: '昵称长度不能超过50个字符' },
        { status: 400 }
      );
    }

    // 更新数据库
    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({
      success: true,
      message: '个人资料更新成功'
    });

  } catch (error) {
    console.error('更新个人资料失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请重试' },
      { status: 500 }
    );
  }
}

// 获取用户个人资料
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 从数据库获取最新的用户信息
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        planExpiredAt: users.planExpiredAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user[0]
    });

  } catch (error) {
    console.error('获取个人资料失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请重试' },
      { status: 500 }
    );
  }
}