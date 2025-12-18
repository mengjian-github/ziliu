'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, User, Crown, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      <div className="pb-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">个人资料</h2>
        <p className="text-zinc-400 mt-2">管理您的基本信息和账户状态</p>
      </div>

      <div className="space-y-6">
        {/* 账户状态 */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
              isPro
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-orange-500/30'
                : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/30'
            )}>
              {isPro ? (
                <Crown className="h-5 w-5 text-white" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className={cn(
                "text-base font-medium",
                isPro ? "text-orange-300" : "text-blue-300"
              )}>
                {isPro ? '专业版用户' : '免费版用户'}
              </p>
              {isPro && planExpiredAt ? (
                <p className="text-sm text-zinc-400 mt-0.5">
                  有效期至 {formatExpiredDate(planExpiredAt)}
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-0.5">
                  升级专业版解锁更多功能
                </p>
              )}
            </div>
          </div>
          {!isPro && (
            <a href="/pricing">
              <Button variant="outline" size="sm" className="bg-primary/10 border-primary/30 text-blue-300 hover:bg-primary/20 hover:text-white hover:border-primary/50">
                <Crown className="h-4 w-4 mr-2" />
                升级专业版
              </Button>
            </a>
          )}
        </div>

        {/* 基本信息表单 */}
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-300">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-white/5 border-white/5 text-zinc-400 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600">
              邮箱地址不可更改，如需修改请联系客服
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-300">昵称 <span className="text-red-400">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的昵称"
              maxLength={50}
              className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-primary/50"
            />
            <p className="text-xs text-zinc-500">
              昵称将显示在您的个人资料中，最多50个字符
            </p>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="text-sm text-zinc-500">
            * 必填字段
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || name === session?.user?.name}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
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
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="backdrop-blur-sm">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}