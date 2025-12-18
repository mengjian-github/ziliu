'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedeemCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function RedeemCodeDialog({ isOpen, onClose, onSuccess }: RedeemCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('请输入兑换码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data);
        onClose();
        setCode('');
      } else {
        setError(data.error || '兑换失败');
      }
    } catch (error) {
      console.error('兑换失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.5)] rounded-3xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle className="text-white">兑换码</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-zinc-400">
            输入兑换码来获得专业版权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label htmlFor="redeem-code" className="text-sm font-medium text-zinc-300">
              兑换码
            </label>
            <Input
              id="redeem-code"
              type="text"
              placeholder="请输入12位兑换码，如：ABCD-EFGH-IJKL"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              className={cn(
                "bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50",
                error ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''
              )}
              maxLength={15}
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="text-sm text-primary/80">
              <div className="font-bold mb-2 text-primary">兑换说明：</div>
              <ul className="text-xs space-y-1.5 opacity-80">
                <li>• 月卡：获得1个月专业版权限</li>
                <li>• 年卡：获得12个月专业版权限</li>
                <li>• 可与现有订阅时间叠加</li>
                <li>• 每个兑换码只能使用一次</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleRedeem}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  兑换中...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  立即兑换
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}