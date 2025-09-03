'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { CustomerSupportButton } from "@/components/ui/customer-support-button";
import { StructuredData } from "@/components/seo/structured-data";

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-lg">字</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              字流
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">定价</Button>
            </Link>
            {status === 'loading' ? (
              <div className="flex items-center space-x-3">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  欢迎，{session.user?.name || session.user?.email}
                </span>
                <Link href="/dashboard">
                  <Button size="sm">进入工作台</Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">免费注册</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              让文字如
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              流水
            </span>
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              般顺畅
            </span>
          </h1>

          <div className="mb-12">
            <p className="text-2xl md:text-3xl text-gray-600 mb-6 leading-relaxed max-w-4xl mx-auto font-light">
              AI 驱动的多平台内容发布工具
            </p>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">
              一次创作，智能适配
              <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mx-2">
                公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书
              </span>
              等平台格式
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-20">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    进入工作台
                  </Button>
                </Link>
                <Link href="/editor/new">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    开始创作
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    立即免费使用
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 rounded-xl"
                  >
                    已有账户？登录
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-blue-200/50 hover:-translate-y-1 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 mx-auto shadow-lg shadow-blue-500/25">
                ✍️
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">一次创作</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Markdown 编辑器，实时预览多平台效果，让创作更加流畅自然</p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-green-200/50 hover:-translate-y-1 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 mx-auto shadow-lg shadow-green-500/25">
                🎨
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">智能适配</h3>
              <p className="text-gray-600 leading-relaxed text-lg">AI 自动转换各平台格式，无需手动调整，完美适配每个平台</p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:border-purple-200/50 hover:-translate-y-1 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-105 transition-transform duration-300 mx-auto shadow-lg shadow-purple-500/25">
                🚀
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">多平台发布</h3>
              <p className="text-gray-600 leading-relaxed text-lg">支持公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等主流内容平台</p>
              <Link href="/extension">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                >
                  🔌 安装浏览器插件
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/70 backdrop-blur-md border-t border-white/30 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">字</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                  字流
                </span>
                <p className="text-sm text-gray-600">让文字如流水般顺畅</p>
              </div>
            </div>
            <div className="text-gray-500 text-center md:text-right">
              <p>&copy; 2025 字流. 专注于内容创作的美好体验.</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* 全局浮动客服按钮 */}
      <CustomerSupportButton />
      
      {/* 结构化数据 */}
      <StructuredData type="WebApplication" />
    </div>
  );
}
