'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Gift, ArrowRight, Zap, Sparkles, Shield, Flame } from 'lucide-react';
import { FEATURES, PRICING_CONFIG } from '@/lib/subscription/config/features';
import { RedeemCodeDialog } from '@/components/ui/redeem-code-dialog';
import { WechatGuideDialog } from '@/components/ui/wechat-guide-dialog';
import { CustomerSupportButton } from '@/components/ui/customer-support-button';

const featureList = {
  free: [
    { name: '基础编辑器', included: true },
    { name: '本地存储', included: true },
    { name: '文章数量', limit: '最多 5 篇' },
    { name: '公众号发布', included: true },
    { name: '云端图片存储', limit: '20张/月' },
    { name: '基础样式', included: true },
  ],
  pro: [
    { name: '无限文章存储', included: true },
    { name: '多平台发布', description: '知乎、掘金、知识星球、视频号、抖音、B站、小红书' },
    { name: '专业样式模板', description: '技术风格、简约风格' },
    { name: '发布预设', description: '保存常用配置' },
    { name: '云端图片存储', description: '500张/月' },
    { name: '优先客服支持', included: true },
  ]
};

export default function PricingPage() {
  const { data: session } = useSession();
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showWechatGuide, setShowWechatGuide] = useState(false);

  const handleRedeemSuccess = (data: any) => {
    alert(data.message);
    // 可以添加更多成功处理逻辑
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,255,0.12),transparent_40%),radial-gradient(circle_at_82%_10%,rgba(0,212,255,0.12),transparent_36%),radial-gradient(120%_90%_at_60%_90%,rgba(0,26,77,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),transparent_36%),linear-gradient(240deg,rgba(255,255,255,0.18),transparent_32%)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/40 bg-white/75 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_18px_40px_-18px_rgba(0,102,255,0.75)]">
                  <span className="text-sm font-semibold">Z</span>
                </div>
                <p className="text-lg font-semibold text-foreground">Ziliu · 字流</p>
              </Link>

              <div className="flex items-center space-x-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="shadow-sm">
                      返回工作台
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <Button variant="ghost" size="sm">登录</Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button size="sm" className="shadow-md">免费注册</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-12 text-center relative">
          <div className="max-w-4xl mx-auto">

            <Badge className="mb-8 px-6 py-2 text-sm font-medium">
              🎯 选择适合你的计划
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-foreground text-balance">
              简单定价，
              <span className="text-primary">
                强大功能
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              从免费开始，随时升级解锁完整分发、模板、团队与云端能力。价格透明、随时取消。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="#plans" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 shadow-[0_18px_45px_-24px_rgba(0,102,255,0.65)]">
                  立即购买专业版
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              {session ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-primary/30">
                    返回工作台
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-primary/30">
                    先免费体验
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>数据与凭据加密存储</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-border" />
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>开通后即刻生效</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section id="plans" className="container mx-auto px-6 pb-12">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto mt-6">
            {/* Free Plan */}
            <Card className="relative border-primary/12 bg-white/85 hover:border-primary/25 transition-all duration-300 hover:shadow-[0_24px_80px_-46px_rgba(0,26,77,0.6)] rounded-2xl overflow-hidden group">
              <CardHeader className="text-center pb-4 pt-8 relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">免费版</CardTitle>
                <p className="text-muted-foreground text-base mb-6">开启你的创作之旅</p>
                <div className="space-y-2">
                  <div className="text-5xl font-bold text-foreground">¥0</div>
                  <div className="text-muted-foreground text-base font-medium">/月 · 永久免费</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-8 relative z-10">
                {featureList.free.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground font-semibold text-base">{feature.name}</div>
                      {feature.limit && (
                        <div className="text-muted-foreground text-sm mt-1">{feature.limit}</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-6">
                  {session ? (
                    <Link href="/dashboard">
                      <Button
                        className="w-full py-6 rounded-xl text-lg"
                        size="lg"
                        variant="outline"
                      >
                        进入工作台
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/signup">
                      <Button
                        className="w-full py-6 rounded-xl text-lg shadow-sm"
                        size="lg"
                        variant="outline"
                      >
                        免费开始使用
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-primary/20 bg-white/90 hover:border-primary/35 transition-all duration-300 hover:shadow-[0_28px_90px_-50px_rgba(0,26,77,0.65)] rounded-2xl overflow-hidden group shadow-md">

              <CardHeader className="text-center pb-4 pt-8 relative z-10">
                <div className="relative inline-block mx-auto mb-6">
                  <Badge variant="outline" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/10 text-primary border-primary/30 shadow-sm">
                    🔥 最受欢迎
                  </Badge>
                  <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Crown className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">专业版</CardTitle>
                <p className="text-primary font-semibold text-base mb-6">🚀 释放全部创作潜能</p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Monthly Plan */}
                  <div className="bg-muted/60 rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-foreground font-semibold text-lg">月付方案</div>
                        <div className="text-muted-foreground text-sm">灵活订阅，随时取消</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">¥{PRICING_CONFIG.monthly.price}</div>
                        <div className="text-muted-foreground text-sm">/月</div>
                      </div>
                    </div>
                  </div>

                  {/* Yearly Plan - Enhanced */}
                  <div className="bg-primary/5 rounded-xl p-4 border-2 border-primary/20 relative shadow-sm hover:shadow-md transition-all duration-300">
                    {/* Savings Badge - Fixed positioning */}
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white font-bold text-xs px-3 py-1 shadow-sm">
                        省¥{PRICING_CONFIG.yearly.savings}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-left">
                        <div className="text-foreground font-bold text-lg">年付方案 ⚡</div>
                        <div className="text-primary font-semibold text-sm">最超值选择</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">¥{PRICING_CONFIG.yearly.price}</div>
                        <div className="text-muted-foreground text-sm">/年</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-6 pb-8 relative z-10">
                {featureList.pro.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-muted-foreground text-sm mt-1">{feature.description}</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => setShowWechatGuide(true)}
                    className="w-full py-6 rounded-xl text-lg shadow-lg shadow-primary/20"
                    size="lg"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    立即购买 / 联系客服开通
                  </Button>

                  <div className="text-center text-muted-foreground text-sm bg-muted/40 border border-border rounded-xl py-3 px-4">
                    💡 支持月付 / 年付 · 开通后即刻生效 · 随时取消
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="container mx-auto px-6 py-16 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 px-6 py-2 text-sm font-medium rounded-full shadow-sm">
                专业版核心功能
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                为创作者量身定制的
                <span className="text-primary"> 超能力工具</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                每个功能都经过精心打磨，让你的创作过程更加高效、专业
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(FEATURES).map(([key, feature]) => (
                <Card key={key} className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl">
                        {key.includes('platform') ? '🚀' :
                          key.includes('style') ? '🎨' :
                            key.includes('article') ? '📝' :
                              key.includes('preset') ? '⚙️' :
                                key.includes('image') ? '🖼️' : '✨'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {feature.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    {feature.plans.includes('pro') && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Crown className="h-3 w-3 mr-1" />
                        专业版特权
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-6 pb-16 relative">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-primary/15 bg-white/85 backdrop-blur shadow-[0_24px_80px_-48px_rgba(0,26,77,0.45)] px-6 py-10 md:px-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-semibold mb-4">
                <Sparkles className="h-4 w-4" />
                准备好升级了吗？
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">专业版，一键开通</h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6">
                无需再看长篇对比，直接开通即可解锁多平台分发、模板、团队与云端图片存储。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-2xl mx-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 shadow-[0_18px_45px_-24px_rgba(0,102,255,0.65)]" onClick={() => setShowWechatGuide(true)}>
                  立即购买专业版
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                {session ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-primary/30">
                      返回工作台
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-primary/30">
                      先免费体验
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 微信引导和兑换码对话框 */}
        <WechatGuideDialog
          isOpen={showWechatGuide}
          onClose={() => setShowWechatGuide(false)}
          onProceedToRedeem={() => {
            setShowWechatGuide(false);
            setShowRedeemDialog(true);
          }}
        />

        <RedeemCodeDialog
          isOpen={showRedeemDialog}
          onClose={() => setShowRedeemDialog(false)}
          onSuccess={handleRedeemSuccess}
        />

        {/* 全局浮动客服按钮 */}
        <CustomerSupportButton />
      </div>
    </div>
  );
}
