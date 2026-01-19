'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Calendar, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface RedeemCode {
  id: string;
  code: string;
  type: 'monthly' | 'yearly';
  duration: number;
  isUsed: boolean;
  usedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  usedAt?: string;
  note: string;
  createdAt: string;
}

export default function AdminRedeemCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [generateType, setGenerateType] = useState<'monthly' | 'yearly'>('monthly');
  const [generateNote, setGenerateNote] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadCodes();
  }, [session, status, router]);

  const loadCodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/redeem-codes');
      const data = await response.json();
      
      if (data.success) {
        setCodes(data.data.codes);
      } else if (data.error === '权限不足') {
        alert('你没有管理员权限');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('加载兑换码失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/redeem-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: generateType,
          count: generateCount,
          note: generateNote || `${generateType === 'monthly' ? '月卡' : '年卡'}-${new Date().toLocaleDateString()}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setGenerateCount(1);
        setGenerateNote('');
        loadCodes(); // 重新加载列表
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('生成兑换码失败:', error);
      alert('生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('兑换码已复制到剪贴板');
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString('zh-CN') : '';

  if (status === 'loading') {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-5 py-5 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">兑换码管理</h1>
              <p className="text-sm text-slate-600 sm:text-base">生成与管理专业版兑换码</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">未使用可直接复制</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">已使用会显示用户信息</span>
          </div>
        </div>

        {/* 生成兑换码 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Gift className="h-5 w-5 text-blue-600" />
              生成兑换码
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  类型
                </label>
                <select
                  value={generateType}
                  onChange={(e) => setGenerateType(e.target.value as 'monthly' | 'yearly')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="monthly">月卡 (1个月)</option>
                  <option value="yearly">年卡 (12个月)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  数量
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                  className="border-slate-200 text-sm text-slate-900 focus-visible:ring-blue-200"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注
                </label>
                <Input
                  placeholder="可选：批次备注信息"
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  className="border-slate-200 text-sm text-slate-900 focus-visible:ring-blue-200"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 sm:text-sm">
                建议：手机端生成后直接复制，批量发放更高效。
              </p>
              <Button
                onClick={generateCodes}
                disabled={isLoading}
                className="h-10 w-full bg-blue-600 text-sm hover:bg-blue-700 sm:w-auto"
              >
                <Gift className="h-4 w-4 mr-2" />
                生成 {generateCount} 个{generateType === 'monthly' ? '月卡' : '年卡'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 兑换码列表 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">兑换码列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">加载中...</p>
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                暂无兑换码
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className={`rounded-xl border px-4 py-4 shadow-sm transition ${
                      code.isUsed
                        ? 'border-slate-200 bg-white'
                        : 'border-emerald-200 bg-emerald-50/60'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          code.type === 'yearly'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {code.type === 'yearly' ? (
                            <>
                              <Calendar className="h-3 w-3" />
                              年卡
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              月卡
                            </>
                          )}
                        </div>

                        <div>
                          <div className="font-mono text-base font-semibold text-slate-900 sm:text-lg">
                            {code.code}
                          </div>
                          <div className="text-xs text-slate-500 sm:text-sm">
                            {code.note} · 创建于 {formatDate(code.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        {code.isUsed ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <div>
                              <div className="font-medium text-slate-600">已使用</div>
                              {code.usedByUser && (
                                <div>用户: {code.usedByUser.name}</div>
                              )}
                              {code.usedAt && (
                                <div>{formatDate(code.usedAt)}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCode(code.code)}
                            className="h-9 w-full border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-600 sm:w-auto"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            复制
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
