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
    { name: '专业样式模板', description: '极简、杂志、极客、卡片、书刊、夜间' },
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
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,255,0.15),transparent_40%),radial-gradient(circle_at_82%_10%,rgba(0,212,255,0.15),transparent_36%),radial-gradient(120%_90%_at_60%_90%,rgba(0,26,77,0.5),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.2),transparent_36%),linear-gradient(240deg,rgba(0,0,0,0.2),transparent_32%)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_0_20px_rgba(0,102,255,0.4)]">
                  <span className="text-sm font-semibold">Z</span>
                </div>
                <p className="text-lg font-semibold text-white">Ziliu · 字流</p>
              </Link>

              <div className="flex items-center space-x-4">
                {session ? (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white shadow-sm backdrop-blur-sm">
                      返回工作台
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">登录</Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">免费注册</Button>
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

            <Badge className="mb-8 px-6 py-2 text-sm font-medium bg-primary/20 text-blue-300 border-primary/30 backdrop-blur-sm">
              🎯 选择适合你的计划
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white text-balance">
              简单定价，
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                强大功能
              </span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              从免费开始，随时升级解锁完整分发、模板、团队与云端能力。价格透明、随时取消。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="#plans" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(0,102,255,0.3)] hover:shadow-[0_0_40px_rgba(0,102,255,0.4)] transition-all duration-300 border border-primary/20">
                  立即购买专业版
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              {session ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm">
                    返回工作台
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm">
                    先免费体验
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span>数据与凭据加密存储</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <span>开通后即刻生效</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section id="plans" className="container mx-auto px-6 pb-12">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto mt-6">
            {/* Free Plan */}
            <Card className="relative border-white/5 bg-white/[0.03] hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden group backdrop-blur-xl">
              <CardHeader className="text-center pb-4 pt-8 relative z-10">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                  <Zap className="h-8 w-8 text-zinc-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-2">免费版</CardTitle>
                <p className="text-zinc-400 text-base mb-6">开启你的创作之旅</p>
                <div className="space-y-2">
                  <div className="text-5xl font-bold text-white">¥0</div>
                  <div className="text-zinc-500 text-base font-medium">/月 · 永久免费</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-8 relative z-10">
                {featureList.free.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/20">
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-zinc-200 font-medium text-base">{feature.name}</div>
                      {feature.limit && (
                        <div className="text-zinc-500 text-sm mt-1">{feature.limit}</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-6">
                  {session ? (
                    <Link href="/dashboard">
                      <Button
                        className="w-full py-6 rounded-xl text-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                        size="lg"
                        variant="outline"
                      >
                        进入工作台
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/signup">
                      <Button
                        className="w-full py-6 rounded-xl text-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
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
            <Card className="relative border-2 border-primary/30 bg-black/40 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,102,255,0.15)] rounded-2xl overflow-hidden group shadow-xl backdrop-blur-xl">

              <CardHeader className="text-center pb-4 pt-8 relative z-10">
                <div className="relative inline-block mx-auto mb-6">
                  <Badge variant="outline" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/20 text-blue-300 border-primary/30 shadow-sm backdrop-blur-sm">
                    🔥 最受欢迎
                  </Badge>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.5)] border border-white/10">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-2">专业版</CardTitle>
                <p className="text-blue-300 font-semibold text-base mb-6">🚀 释放全部创作潜能</p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Monthly Plan */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300 cursor-default group/monthly">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-zinc-200 font-semibold text-lg group-hover/monthly:text-white transition-colors">月付方案</div>
                        <div className="text-zinc-500 text-sm">灵活订阅，随时取消</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">¥{PRICING_CONFIG.monthly.price}</div>
                        <div className="text-zinc-500 text-sm">/月</div>
                      </div>
                    </div>
                  </div>

                  {/* Yearly Plan - Enhanced */}
                  <div className="bg-primary/10 rounded-xl p-4 border-2 border-primary/20 relative shadow-inner hover:bg-primary/15 transition-all duration-300 cursor-default">
                    {/* Savings Badge - Fixed positioning */}
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white font-bold text-xs px-3 py-1 shadow-md border-none">
                        省¥{PRICING_CONFIG.yearly.savings}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-left">
                        <div className="text-white font-bold text-lg">年付方案 ⚡</div>
                        <div className="text-blue-300 font-semibold text-sm">最超值选择</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-300">¥{PRICING_CONFIG.yearly.price}</div>
                        <div className="text-blue-400/70 text-sm">/年</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 px-6 pb-8 relative z-10">
                {featureList.pro.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/30">
                      <Check className="h-3 w-3 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <div className="text-zinc-200 font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-zinc-500 text-sm mt-1">{feature.description}</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => setShowWechatGuide(true)}
                    className="w-full py-6 rounded-xl text-lg shadow-[0_0_25px_rgba(0,102,255,0.3)] bg-primary hover:bg-primary/90 text-white border border-primary/20"
                    size="lg"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    立即购买 / 联系客服开通
                  </Button>

                  <div className="text-center text-zinc-500 text-sm bg-black/20 border border-white/5 rounded-xl py-3 px-4 backdrop-blur-sm">
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
              <Badge className="mb-8 bg-primary/10 text-blue-300 border-primary/20 px-6 py-2 text-sm font-medium rounded-full shadow-[0_0_15px_rgba(0,102,255,0.15)] backdrop-blur-sm">
                专业版核心功能
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                为创作者量身定制的
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300"> 超能力工具</span>
              </h2>
              <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                每个功能都经过精心打磨，让你的创作过程更加高效、专业
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(FEATURES).map(([key, feature]) => (
                <Card key={key} className="bg-white/5 border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,102,255,0.1)] rounded-xl overflow-hidden backdrop-blur-md group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:border-primary/20 transition-colors">
                      <span className="text-xl">
                        {key.includes('platform') ? '🚀' :
                          key.includes('style') ? '🎨' :
                            key.includes('article') ? '📝' :
                              key.includes('preset') ? '⚙️' :
                                key.includes('image') ? '🖼️' : '✨'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                      {feature.name}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    {feature.plans.includes('pro') && (
                      <Badge className="bg-primary/10 text-blue-300 border-primary/20 backdrop-blur-sm">
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
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] px-6 py-10 md:px-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 text-blue-300 px-4 py-2 text-sm font-semibold mb-4 border border-primary/20">
                  <Sparkles className="h-4 w-4" />
                  准备好升级了吗？
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">专业版，一键开通</h2>
                <p className="text-base md:text-lg text-zinc-300 mb-6 max-w-2xl mx-auto">
                  无需再看长篇对比，直接开通即可解锁多平台分发、模板、团队与云端图片存储。
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-2xl mx-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(0,102,255,0.4)] border border-primary/20" onClick={() => setShowWechatGuide(true)}>
                    立即购买专业版
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  {session ? (
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white">
                        返回工作台
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/signup" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white">
                        先免费体验
                      </Button>
                    </Link>
                  )}
                </div>
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
