'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, FileText, LogOut, Crown, Gift, Settings, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { RedeemCodeDialog } from '@/components/ui/redeem-code-dialog';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';
import { UpgradePrompt } from '@/lib/subscription/components/UpgradePrompt';
import { ArticleCreationGuard } from '@/lib/subscription/components/FeatureGuard';
import { CustomerSupportButton } from '@/components/ui/customer-support-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const articlesPerPage = 5;

  // 使用新的订阅Hook，已包含文章数量管理
  const { plan, planExpiredAt, isPro, totalArticles, getFeatureLimit, refreshPlan, refreshUsage } = useUserPlan();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // 获取文章列表
    fetchArticles();
  }, [session, status, router]);

  const fetchArticles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles?page=${page}&limit=${articlesPerPage}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data.articles);
        setTotalPages(Math.ceil(data.data.total / articlesPerPage));
        setCurrentPage(page);
        // 如果文章数量有变化，更新使用统计
        if (data.data.total !== totalArticles) {
          refreshUsage();
        }
      } else {
        console.error('获取文章列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchArticles(page);
    }
  };

  const handleRedeemSuccess = (data: any) => {
    // 刷新订阅信息
    refreshPlan();

    // 显示成功提示
    alert(data.message);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // 格式化过期时间
  const formatExpiredDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 检查文章限制
  const articleLimit = getFeatureLimit('unlimited-articles');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] pointer-events-none rounded-full mix-blend-screen opacity-20" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 blur-[120px] pointer-events-none rounded-full mix-blend-screen opacity-20" />

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-[#2a80ff] to-secondary rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_-5px_rgba(0,136,255,0.6)]">
                  <span className="text-sm font-bold">Z</span>
                </div>
                <h1 className="text-xl font-bold text-white">
                  字流
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* 升级提示 - 仅在非专业版时显示 */}
              {!isPro && (
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/40"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    升级专业版
                  </Button>
                </Link>
              )}

              {/* 用户头像下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 px-3 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-sm rounded-full">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-7 w-7 ring-2 ring-white/10">
                        <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || "用户头像"} />
                        <AvatarFallback className={`text-xs font-medium text-white ${isPro
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-br from-primary to-blue-600'
                          }`}>
                          {isPro ? (
                            <Crown className="h-3 w-3" />
                          ) : (
                            session.user?.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[120px]">
                          {session.user?.name}
                        </span>
                        {isPro ? (
                          <span className="text-xs text-yellow-500 flex items-center">
                            <Crown className="h-3 w-3 mr-1" />
                            专业版
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">
                            免费版 · {articleLimit > 0 && `${totalArticles}/${articleLimit}`}
                          </span>
                        )}
                      </div>

                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64 mr-4 bg-black/80 backdrop-blur-xl border-white/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5">
                      <p className="text-sm font-medium leading-none text-white">{session.user?.name}</p>
                      <p className="text-xs leading-none text-zinc-400">
                        {session.user?.email}
                      </p>
                      {isPro && planExpiredAt && (
                        <div className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20 mt-1">
                          <Crown className="h-3 w-3 mr-1" />
                          专业版至 {formatExpiredDate(planExpiredAt)}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <Link href="/dashboard/settings">
                    <DropdownMenuItem className="group focus:bg-white/10 cursor-pointer">
                      <Settings className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-white" />
                      <span className="text-zinc-200 group-hover:text-white transition-colors">设置</span>
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuItem onClick={() => setShowRedeemDialog(true)} className="group focus:bg-white/10 cursor-pointer">
                    <Gift className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-white" />
                    <span className="text-zinc-200 group-hover:text-white transition-colors">兑换码</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10 group cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="inline-flex items-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium mb-4">
            ✨ 欢迎回来，{session.user?.name}
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
            开始创作
          </h2>
          <p className="text-zinc-400 text-lg">
            让文字如流水般顺畅，一键发布到多个平台
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card className="group hover:bg-white/10 transition-all duration-200 cursor-pointer border border-white/5 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-[#2a80ff] to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-[0_0_20px_-5px_rgba(0,136,255,0.4)]">
                  <PlusCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">新建文章</h3>
                  <p className="text-sm text-zinc-400">开始创作新的内容</p>
                </div>
              </div>
              <ArticleCreationGuard>
                <Link href="/editor/new">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20">
                    开始创作
                  </Button>
                </Link>
              </ArticleCreationGuard>
            </CardContent>
          </Card>

          <Card className="group hover:bg-white/10 transition-all duration-200 cursor-pointer border border-white/5 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">文章管理</h3>
                  <p className="text-sm text-zinc-400">管理您的所有文章</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 font-medium py-6 rounded-xl transition-all duration-200"
                onClick={() => {
                  document.getElementById('recent-articles')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                查看文章
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles */}
        <div className="mb-8" id="recent-articles">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">我的文章</h3>
            <p className="text-zinc-400">管理和编辑您的创作内容</p>
          </div>

          {loading ? (
            <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-500">加载中...</p>
              </CardContent>
            </Card>
          ) : articles.length === 0 ? (
            <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <FileText className="h-10 w-10 text-zinc-500" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">还没有文章</h4>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  创建您的第一篇文章，开始您的内容创作之旅
                </p>
                <Link href="/editor/new">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 rounded-xl transition-all duration-200">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    创建第一篇文章
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {articles.map((article) => (
                  <Card key={article.id} className="group hover:border-primary/30 transition-all duration-300 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-zinc-100 mb-2 truncate group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          <div className="flex items-center space-x-3 text-sm text-zinc-500 mb-3">
                            <span>{new Date(article.updatedAt).toLocaleDateString('zh-CN')}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-600" />
                            <span>{article.wordCount} 字</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-600" />
                            <span>{article.readingTime} 分钟</span>
                          </div>
                          <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed opacity-80">
                            {article.content.replace(/[#*`]/g, '').substring(0, 120)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${article.status === 'published'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            }`}>
                            {article.status === 'published' ? '已发布' : '草稿'}
                          </span>
                          <Link href={`/editor/${article.id}`}>
                            <Button variant="outline" size="sm" className="mt-2 border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20">
                              继续编辑
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 p-0 rounded-lg ${currentPage === page
                          ? 'bg-primary hover:bg-primary/90 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400'
                          }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 升级提示 - 只在达到限制时显示 */}
        {!isPro && totalArticles > 0 && (
          <div className="mt-12">
            <UpgradePrompt scenario="dashboard-upgrade" />
          </div>
        )}

      </main>

      {/* 兑换码对话框 */}
      <RedeemCodeDialog
        isOpen={showRedeemDialog}
        onClose={() => setShowRedeemDialog(false)}
        onSuccess={handleRedeemSuccess}
      />

      {/* 全局浮动客服按钮 */}
      <CustomerSupportButton />
    </div>
  );
}
