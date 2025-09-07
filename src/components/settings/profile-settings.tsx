'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, User, Crown, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const { isPro, planExpiredAt } = useUserPlan();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: '请输入昵称' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        // 更新session - 触发JWT callback重新获取用户信息
        await update();
        setMessage({ type: 'success', text: '个人信息更新成功' });
      } else {
        setMessage({ type: 'error', text: result.error || '更新失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const formatExpiredDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold text-gray-900">
          个人资料
        </CardTitle>
        <CardDescription className="text-gray-600">
          管理您的基本信息和账户状态
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 账户状态 */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isPro 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
            }`}>
              {isPro ? (
                <Crown className="h-4 w-4 text-white" />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isPro ? '专业版用户' : '免费版用户'}
              </p>
              {isPro && planExpiredAt ? (
                <p className="text-xs text-yellow-600">
                  有效期至 {formatExpiredDate(planExpiredAt)}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  升级专业版解锁更多功能
                </p>
              )}
            </div>
          </div>
          {!isPro && (
            <a href="/pricing">
              <Button variant="outline" size="sm">
                <Crown className="h-4 w-4 mr-2" />
                升级专业版
              </Button>
            </a>
          )}
        </div>

        {/* 基本信息表单 */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-gray-50/50 text-sm"
            />
            <p className="text-xs text-gray-500">
              邮箱地址不可更改，如需修改请联系客服
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">昵称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的昵称"
              maxLength={50}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              昵称将显示在您的个人资料中，最多50个字符
            </p>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * 必填字段
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || !name.trim() || name === session?.user?.name}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存更改
              </>
            )}
          </Button>
        </div>

        {/* 消息提示 */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}