'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Copy, Check, X, Gift, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface WechatGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToRedeem: () => void;
  title?: string;
  description?: string;
}

export function WechatGuideDialog({ 
  isOpen, 
  onClose, 
  onProceedToRedeem,
  title = "获取专业版兑换码",
  description = "扫描微信二维码，联系客服获取兑换码，立即升级专业版"
}: WechatGuideDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const wechatId = "mjcoding3";
  
  if (!isOpen) return null;

  const copyWechatId = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur border border-primary/10 shadow-[0_24px_80px_-48px_rgba(0,26,77,0.45)] rounded-2xl">
        <CardHeader className="text-center border-b border-border/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-5">
          {/* 二维码区域 */}
          <div className="text-center">
            <div className="inline-block p-4 bg-primary/5 rounded-2xl shadow-inner border border-primary/10 mb-4">
              <Image
                src="/wx.jpg"
                alt="微信二维码"
                width={192}
                height={192}
                className="w-48 h-48 rounded-xl border border-primary/20 object-cover bg-white"
                priority
              />
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary mb-1">扫码添加客服微信</p>
              <p className="text-xs text-muted-foreground">获取帮助、反馈问题或加入用户群</p>
            </div>
          </div>

          {/* 微信号 */}
          <div className="bg-muted/60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">微信号</p>
                <p className="font-mono font-semibold text-foreground">{wechatId}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyWechatId}
                className="ml-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-green-600">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 获取流程 */}
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-primary mb-2">获取步骤</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start space-x-2">
                <span className="inline-block w-4 h-4 bg-primary/15 text-primary rounded-full text-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                <span>扫码或搜索微信号添加客服</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="inline-block w-4 h-4 bg-primary/15 text-primary rounded-full text-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                <span>说明需求（问题咨询 / 反馈 / 购买专业版）</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="inline-block w-4 h-4 bg-primary/15 text-primary rounded-full text-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                <span>有兑换码可直接兑换，或让客服为你开通</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              稍后联系
            </Button>
            <Button
              onClick={onProceedToRedeem}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Gift className="h-4 w-4 mr-2" />
              已有兑换码
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* 底部提示 */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              🔒 安全提醒：请认准官方客服，谨防诈骗
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
