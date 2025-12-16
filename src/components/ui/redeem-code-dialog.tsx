'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Loader2, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-blue-600" />
              <CardTitle>兑换码</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            输入兑换码来获得专业版权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="redeem-code" className="text-sm font-medium text-gray-700">
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
              className={error ? 'border-red-300' : ''}
              maxLength={15}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">兑换说明：</div>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• 月卡：获得1个月专业版权限</li>
                <li>• 年卡：获得12个月专业版权限</li>
                <li>• 可与现有订阅时间叠加</li>
                <li>• 每个兑换码只能使用一次</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleRedeem}
              className="flex-1"
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