'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { WechatGuideDialog } from './wechat-guide-dialog';

interface CustomerSupportButtonProps {
  className?: string;
  useExternalDialog?: boolean;
  onOpenExternal?: () => void;
}

export function CustomerSupportButton({
  className = '',
  useExternalDialog = false,
  onOpenExternal,
}: CustomerSupportButtonProps) {
  const [showWechatGuide, setShowWechatGuide] = useState(false);

  const handleClick = () => {
    if (useExternalDialog && onOpenExternal) {
      onOpenExternal();
      return;
    }
    setShowWechatGuide(true);
  };

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-40 group ${className}`}>
        <Button
          onClick={handleClick}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0066ff] via-[#2a80ff] to-[#00d4ff] hover:shadow-[0_20px_60px_-24px_rgba(0,102,255,0.8)] shadow-[0_14px_44px_-24px_rgba(0,26,77,0.5)] transition-all duration-300 relative overflow-hidden"
          size="lg"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-secondary/30">
            <span className="text-white text-xs font-bold">?</span>
          </div>

          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 text-foreground text-xs px-2 py-1 rounded-xl whitespace-nowrap opacity-90 border border-primary/10 shadow-sm">
            客服
          </div>
        </Button>

        <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-white text-foreground text-sm px-3 py-2 rounded-xl shadow-[0_14px_40px_-24px_rgba(0,26,77,0.45)] whitespace-nowrap border border-primary/10 relative">
            💬 联系客服获取帮助
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        </div>

        <div className="absolute -top-2 -left-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="text-xs text-muted-foreground bg-white px-2 py-1 rounded-lg shadow-sm whitespace-nowrap border border-primary/10">
            问题反馈・用户群・兑换码
          </div>
        </div>
      </div>

      {!useExternalDialog && (
        <WechatGuideDialog
          isOpen={showWechatGuide}
          onClose={() => setShowWechatGuide(false)}
          onProceedToRedeem={() => setShowWechatGuide(false)}
          title="联系客服"
          description="扫描微信二维码联系客服，获取帮助、问题反馈或加入用户群"
        />
      )}
    </>
  );
}

