'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Gift, ArrowRight, Zap, Sparkles, Star, Users, TrendingUp, Shield, Flame } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Global background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-pink-500/3"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/8 to-pink-400/8 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">字</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  字流
                </h1>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="hover:shadow-lg transition-all duration-300">
                    返回工作台
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-all duration-300">登录</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">免费注册</Button>
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
          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>3000+ 创作者信赖</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.9 用户评分</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>100万+ 文章发布</span>
            </div>
          </div>

          <Badge className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200/50 px-6 py-2 text-sm font-medium rounded-full shadow-lg">
            🎯 选择适合你的计划
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              简单定价，
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              强大功能
            </span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            从免费开始，体验专业级内容创作工具。<br />
            <span className="text-blue-600 font-semibold">随时升级解锁更多功能</span>
          </p>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-green-500" />
              <span>数据安全</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>即刻生效</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <ArrowRight className="h-4 w-4 text-blue-500" />
              <span>随时取消</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto mt-8">
          {/* Free Plan */}
          <Card className="relative bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="text-center pb-4 pt-8 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
                <Zap className="h-8 w-8 text-gray-600 group-hover:text-gray-700 transition-colors duration-300" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">免费版</CardTitle>
              <p className="text-gray-600 text-base mb-6">开启你的创作之旅</p>
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">¥0</div>
                <div className="text-gray-500 text-base font-medium">/月 · 永久免费</div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 px-6 pb-8 relative z-10">
              {featureList.free.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-semibold text-base">{feature.name}</div>
                    {feature.limit && (
                      <div className="text-gray-500 text-sm mt-1">{feature.limit}</div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-6">
                {session ? (
                  <Link href="/dashboard">
                    <Button
                      className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      size="lg"
                    >
                      进入工作台
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button
                      className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      size="lg"
                    >
                      免费开始使用
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-white/70 backdrop-blur-sm border-2 border-blue-200/30 hover:bg-white/80 hover:border-blue-300/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden group shadow-lg">
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>

            <CardHeader className="text-center pb-4 pt-8 relative z-10">
              <div className="relative inline-block mx-auto mb-6">
                {/* Popular Badge on top-right of icon */}
                <div className="absolute -top-3 -right-4 z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-full shadow-lg font-bold text-xs animate-pulse">
                    🔥 最受欢迎
                  </div>
                </div>
                
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">专业版</CardTitle>
              <p className="text-blue-600 font-semibold text-base mb-6">🚀 释放全部创作潜能</p>

              {/* Pricing Options */}
              <div className="space-y-4">
                {/* Monthly Plan */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-gray-900 font-semibold text-lg">月付方案</div>
                      <div className="text-gray-600 text-sm">灵活订阅，随时取消</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">¥{PRICING_CONFIG.monthly.price}</div>
                      <div className="text-gray-600 text-sm">/月</div>
                    </div>
                  </div>
                </div>

                {/* Yearly Plan - Enhanced */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-300 relative shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Savings Badge - Fixed positioning */}
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs px-3 py-1 shadow-lg">
                      省¥{PRICING_CONFIG.yearly.savings}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-left">
                      <div className="text-gray-900 font-bold text-lg">年付方案 ⚡</div>
                      <div className="text-blue-600 font-semibold text-sm">最超值选择</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">¥{PRICING_CONFIG.yearly.price}</div>
                      <div className="text-gray-600 text-sm">/年</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-6 pb-8 relative z-10">
              {featureList.pro.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{feature.name}</div>
                    {feature.description && (
                      <div className="text-gray-500 text-sm mt-1">{feature.description}</div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => setShowWechatGuide(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  size="lg"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  🎯 立即兑换升级专业版
                </Button>

                <div className="text-center text-gray-600 text-sm bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl py-3 px-4">
                  💡 <span className="font-semibold text-orange-600">没有兑换码？联系客服获取专业版权限</span>
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
            <Badge className="mb-8 bg-blue-50 text-blue-700 border-blue-200 px-6 py-2 text-sm font-medium rounded-full">
              专业版核心功能
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              为创作者量身定制的
              <span className="text-blue-600"> 超能力工具</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              每个功能都经过精心打磨，让你的创作过程更加高效、专业
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(FEATURES).map(([key, feature]) => (
              <Card key={key} className="bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">
                      {key.includes('platform') ? '🚀' :
                       key.includes('style') ? '🎨' :
                       key.includes('article') ? '📝' :
                       key.includes('preset') ? '⚙️' :
                       key.includes('image') ? '🖼️' : '✨'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  {feature.plans.includes('pro') && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
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
      <section className="container mx-auto px-6 py-16 relative">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-10 shadow-2xl border border-blue-300/20 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                🚀 开启你的
                <span className="text-yellow-300">专业创作之旅</span>
              </h2>

              <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
                3000+ 创作者的选择，立即加入专业内容创作者行列
              </p>

              <div className="flex items-center justify-center space-x-6 text-blue-100 mb-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>30秒注册</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>立即使用</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>专业体验</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto">
                {session ? (
                  <Link href="/dashboard" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      🎯 进入工作台
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signup" className="flex-1">
                      <Button
                        size="lg"
                        className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        ✨ 免费开始创作
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/auth/signin" className="flex-1">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-white/30 text-white hover:bg-white/10 font-semibold py-4 rounded-xl transition-all duration-300"
                      >
                        🔓 已有账户？登录
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-6 text-blue-100 text-sm">
                🛡️ 数据安全保护 · ⚡ 即开即用 · 🏆 专业级体验
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