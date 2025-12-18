'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Chrome,
  Settings,
  FolderOpen,
  RefreshCw,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function ExtensionPage() {
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'installed' | 'not-installed'>('checking');
  const [isDownloading, setIsDownloading] = useState(false);
  const [latest, setLatest] = useState<{ version?: string; url?: string } | null>(null);

  // 加载最新插件包信息
  useEffect(() => {
    fetch('/extension-latest.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setLatest(data))
      .catch(() => setLatest(null));
  }, []);

  // 检测插件是否已安装
  useEffect(() => {
    const checkExtension = () => {
      console.log('🔍 检测插件是否已安装...');

      // 发送检测消息到插件
      window.postMessage({
        type: 'ZILIU_EXTENSION_DETECT',
        source: 'ziliu-website'
      }, '*');

      // 设置超时，如果2秒内没有响应则认为未安装
      const timeout = setTimeout(() => {
        console.log('⏰ 插件检测超时，可能未安装');
        setExtensionStatus('not-installed');
      }, 2000);

      // 监听插件响应
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'ZILIU_EXTENSION_RESPONSE') {
          console.log('✅ 检测到插件已安装:', event.data);
          clearTimeout(timeout);
          setExtensionStatus('installed');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
      };
    };

    // 延迟一点时间再检测，确保页面完全加载
    const delayedCheck = setTimeout(checkExtension, 500);

    return () => clearTimeout(delayedCheck);
  }, []);

  // 重新检测插件
  const recheckExtension = () => {
    setExtensionStatus('checking');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // 下载插件文件
  const downloadExtension = async () => {
    setIsDownloading(true);
    try {
      // 创建下载链接
      const link = document.createElement('a');
      const href = latest?.url || '/ziliu-extension-v1.2.0.zip';
      link.href = href; // 默认回退
      link.download = href.split('/').pop() || 'ziliu-extension.zip';
      link.click();
    } catch (error) {
      console.error('下载失败:', error);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,255,0.15),transparent_45%),radial-gradient(circle_at_82%_10%,rgba(0,212,255,0.15),transparent_38%),radial-gradient(120%_90%_at_60%_90%,rgba(0,26,77,0.5),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.2),transparent_36%),linear-gradient(245deg,rgba(0,0,0,0.2),transparent_40%)]" />

      <main className="relative z-10">
        <section className="container mx-auto px-6 pt-12 pb-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300 shadow-[0_0_15px_rgba(0,102,255,0.2)] backdrop-blur-sm">
            浏览器插件 · 字流助手
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-semibold text-white">
            一键填充，多平台发布更顺畅
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-3xl mx-auto">
            通过 Chrome / Edge 插件，直接把已适配的内容填充到目标平台，省去复制粘贴与格式修正。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="gap-2 border-primary/30 text-blue-300 bg-primary/10 backdrop-blur-sm">
              <Chrome size={14} /> 支持 Chrome / Edge
            </Badge>
            <Badge variant="outline" className="gap-2 border-primary/30 text-blue-300 bg-primary/10 backdrop-blur-sm">
              <Shield size={14} /> 只读权限，安全可控
            </Badge>
            <Badge variant="outline" className="gap-2 border-primary/30 text-blue-300 bg-primary/10 backdrop-blur-sm">
              <Sparkles size={14} /> 智能填充
            </Badge>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {extensionStatus === 'installed' ? (
              <Button size="lg" className="rounded-xl px-6 py-3 shadow-[0_0_30px_rgba(0,102,255,0.4)] bg-primary hover:bg-primary/90 text-white border border-primary/20" onClick={() => window.open('/editor/new', '_blank')}>
                已安装 · 去工作台体验
                <ExternalLink className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-xl px-6 py-3 shadow-[0_0_30px_rgba(0,102,255,0.4)] bg-primary hover:bg-primary/90 text-white border border-primary/20"
                onClick={downloadExtension}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" />
                    下载插件 {latest?.version ? `(v${latest.version})` : ''}
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="lg" className="rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white backdrop-blur-sm" onClick={recheckExtension} disabled={extensionStatus === 'checking'}>
              <RefreshCw size={16} className="mr-2" />
              重新检测
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-10 max-w-5xl">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-base font-medium text-white">当前状态</p>
                {extensionStatus === 'checking' && (
                  <Badge variant="secondary" className="flex items-center gap-2 bg-white/10 text-zinc-300 hover:bg-white/20">
                    <Loader2 className="animate-spin" size={14} />
                    检测中…
                  </Badge>
                )}
                {extensionStatus === 'installed' && (
                  <Badge className="flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 size={14} />
                    已安装
                  </Badge>
                )}
                {extensionStatus === 'not-installed' && (
                  <Badge variant="destructive" className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertCircle size={14} />
                    未检测到插件
                  </Badge>
                )}
              </div>

              {extensionStatus === 'installed' ? (
                <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                  已检测到插件，刷新编辑器即可使用一键填充。
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-blue-300">
                    <p className="font-semibold text-white mb-1">还没安装？</p>
                    点击上方“下载插件”，按照下方步骤加载即可。
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                    <p className="font-semibold text-white mb-1">已安装但未识别？</p>
                    请在扩展管理里确保插件启用，再点击“重新检测”。
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-6 pb-10 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="text-primary" />
                  下载 / 安装插件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-400">
                <p>插件体积小（约 50KB），适配 Chrome / Edge。</p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={downloadExtension}
                    disabled={isDownloading}
                    className="rounded-xl px-4 py-2 shadow-sm bg-primary hover:bg-primary/90 text-white"
                  >
                    {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    立即下载
                  </Button>
                  <Button variant="outline" className="rounded-xl px-4 py-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white" onClick={recheckExtension} disabled={extensionStatus === 'checking'}>
                    <RefreshCw size={16} className="mr-2" />
                    重新检测
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="text-primary" />
                  安装步骤
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  '下载并解压 zip 包到任意文件夹',
                  '打开 chrome://extensions 并开启开发者模式',
                  '点击“加载已解压的扩展程序”选择解压目录',
                  '返回本页点击“重新检测”确认安装状态',
                ].map((step, idx) => (
                  <div key={step} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-blue-300 border border-primary/30 flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-zinc-400">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-16 max-w-5xl">
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="text-primary" />
                功能亮点
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-zinc-400">
              {[
                { title: '多平台支持', desc: '微信公众平台、知乎、掘金、视频号、抖音、B站、小红书等主流渠道。' },
                { title: '智能检测', desc: '自动检测剪贴板与当前页面，判断目标平台并提示填充。' },
                { title: '一键填充', desc: '在字流编辑器完成适配后，点击插件即可一键带格式填充。' },
                { title: '格式适配', desc: '自动处理标题、段落、代码块与图片链接，减少人工修正。' },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-6 pb-16 max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300 mb-3">READY</p>
              <h2 className="text-3xl font-semibold text-white mb-4">现在安装，立刻加速分发流程</h2>
              <p className="text-base text-zinc-400 mb-6">不到 1 分钟完成安装，开启一键填充的顺滑体验。</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="rounded-xl px-6 py-3 shadow-[0_0_30px_rgba(0,102,255,0.4)] bg-primary hover:bg-primary/90 text-white border border-primary/20"
                  onClick={downloadExtension}
                  disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                  立即下载
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl px-6 py-3 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white" onClick={recheckExtension} disabled={extensionStatus === 'checking'}>
                  <RefreshCw size={16} className="mr-2" />
                  已安装？重新检测
                </Button>
                <Link href="/dashboard">
                  <Button variant="ghost" size="lg" className="rounded-xl px-6 py-3 text-zinc-400 hover:text-white hover:bg-white/10">
                    返回工作台
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
