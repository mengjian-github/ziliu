'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, LogOut, User, ChevronLeft, ChevronRight, Crown, Gift, Settings, ChevronDown } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,255,0.12),transparent_38%),radial-gradient(circle_at_82%_10%,rgba(0,212,255,0.12),transparent_36%),radial-gradient(120%_90%_at_60%_90%,rgba(0,26,77,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),transparent_38%),linear-gradient(240deg,rgba(255,255,255,0.18),transparent_32%)]" />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-[#2a80ff] to-secondary rounded-2xl flex items-center justify-center text-white shadow-[0_18px_40px_-18px_rgba(0,102,255,0.75)]">
                  <span className="text-sm font-semibold">Z</span>
                </div>
                <h1 className="text-xl font-semibold text-foreground">
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
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700 hover:from-yellow-100 hover:to-orange-100 hover:border-yellow-300"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    升级专业版
                  </Button>
                </Link>
              )}

              {/* 用户头像下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 px-3 bg-white/60 border border-white/40 hover:bg-white/80 backdrop-blur-sm rounded-full">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || "用户头像"} />
                        <AvatarFallback className={`text-xs font-medium text-white ${
                          isPro 
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                        }`}>
                          {isPro ? (
                            <Crown className="h-3 w-3" />
                          ) : (
                            session.user?.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                          {session.user?.name}
                        </span>
                        {isPro ? (
                          <span className="text-xs text-yellow-600 flex items-center">
                            <Crown className="h-3 w-3 mr-1" />
                            专业版
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            免费版 · {articleLimit > 0 && `${totalArticles}/${articleLimit}`}
                          </span>
                        )}
                      </div>
                      
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-64 mr-4" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5">
                      <p className="text-sm font-medium leading-none text-gray-900">{session.user?.name}</p>
                      <p className="text-xs leading-none text-gray-500">
                        {session.user?.email}
                      </p>
                      {isPro && planExpiredAt && (
                        <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
                          <Crown className="h-3 w-3 mr-1" />
                          专业版至 {formatExpiredDate(planExpiredAt)}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem className="group">
                      <Settings className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      <span>设置</span>
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuItem onClick={() => setShowRedeemDialog(true)} className="group">
                    <Gift className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    <span>兑换码</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 group"
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
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-100/60 text-blue-700 rounded-full text-sm font-medium mb-4">
            ✨ 欢迎回来，{session.user?.name}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            开始创作
          </h2>
          <p className="text-gray-600 text-lg">
            让文字如流水般顺畅，一键发布到多个平台
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">新建文章</h3>
                  <p className="text-sm text-gray-600">开始创作新的内容</p>
                </div>
              </div>
              <ArticleCreationGuard>
                <Link href="/editor/new">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200">
                    开始创作
                  </Button>
                </Link>
              </ArticleCreationGuard>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">文章管理</h3>
                  <p className="text-sm text-gray-600">管理您的所有文章</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium py-2.5 rounded-lg transition-all duration-200"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">我的文章</h3>
            <p className="text-gray-600">管理和编辑您的创作内容</p>
          </div>

          {loading ? (
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </CardContent>
            </Card>
          ) : articles.length === 0 ? (
            <Card className="border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">还没有文章</h4>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  创建您的第一篇文章，开始您的内容创作之旅
                </p>
                <Link href="/editor/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    创建第一篇文章
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {articles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-all duration-200 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                            {article.title}
                          </h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                            <span>{new Date(article.updatedAt).toLocaleDateString('zh-CN')}</span>
                            <span>·</span>
                            <span>{article.wordCount} 字</span>
                            <span>·</span>
                            <span>{article.readingTime} 分钟</span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                            {article.content.replace(/[#*`]/g, '').substring(0, 120)}...
                          </p>
                        </div>
                        <div className="flex ml-6">
                          <Link href={`/editor/${article.id}`}>
                            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
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
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-200 hover:bg-gray-50"
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
                        className={`w-9 h-9 p-0 ${
                          currentPage === page
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'border-gray-200 hover:bg-gray-50'
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
                    className="border-gray-200 hover:bg-gray-50"
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
          <div className="mt-8">
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
