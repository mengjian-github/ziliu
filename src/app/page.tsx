'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { CustomerSupportButton } from "@/components/ui/customer-support-button";
import { StructuredData } from "@/components/seo/structured-data";
import { WechatGuideDialog } from "@/components/ui/wechat-guide-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "多平台同步发布",
    description: "一次创作，自动匹配排版规则，一键分发公众号、知乎、视频号、抖音、B站、小红书等主流渠道。",
    tone: "primary",
    icon: FlowIcon,
  },
  {
    title: "智能格式转换",
    description: "AI 识别段落、标题、引用与代码块，避免手动调整格式，保持品牌一致性。",
    tone: "secondary",
    icon: MagicIcon,
  },
  {
    title: "Markdown 专业体验",
    description: "所见即所得预览、大纲导航、快捷片段与实时校对，让内容更快、更稳定地定稿。",
    tone: "accent",
    icon: MarkdownIcon,
  },
  {
    title: "云端存储与安全",
    description: "版本回溯、团队协作、权限与审阅流，全程加密传输，保证数据可追踪更安心。",
    tone: "navy",
    icon: ShieldIcon,
  },
];

const steps = [
  {
    label: "STEP 01",
    title: "创作 & 导入",
    description: "直接写作或导入 Markdown/文档，自动提取结构与素材。",
  },
  {
    label: "STEP 02",
    title: "智能适配",
    description: "AI 调整标题、摘要、封面与格式，生成多平台最佳版本。",
  },
  {
    label: "STEP 03",
    title: "一键分发",
    description: "批量定时发布，浏览器插件支持跨平台快速登录与推送。",
  },
  {
    label: "STEP 04",
    title: "数据回收",
    description: "实时查看发布结果，回流评论与数据，优化下一篇内容。",
  },
];

const platforms = [
  { name: "微信公众号", slug: "wechat", bg: "bg-[#e8f4ff]" },
  { name: "知乎", slug: "zhihu", bg: "bg-[#eef2ff]" },
  { name: "掘金", slug: "juejin", bg: "bg-[#e5f4ff]" },
  { name: "小红书", slug: "xiaohongshu", bg: "bg-[#fff0f3]" },
  { name: "抖音", slug: "tiktok", bg: "bg-[#f4f6ff]" },
  { name: "B站", slug: "bilibili", bg: "bg-[#f0f7ff]" },
  { name: "微博", slug: "weibo", bg: "bg-[#fff6f0]" },
];

const highlights = [
  "无需手动排版",
  "所见即所得预览",
  "浏览器插件",
  "团队协作 & 审阅",
];

function FlowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10 text-primary", className)} fill="none">
      <rect x="6" y="10" width="14" height="10" rx="3" className="fill-primary/10" />
      <rect x="28" y="6" width="14" height="10" rx="3" className="fill-secondary/20" />
      <rect x="18" y="28" width="14" height="12" rx="3" className="fill-primary/10" />
      <path d="M13 20c0 8 8 6 10 6s12-2 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M35 16c0 6-6 6-10 6s-12 0-12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MagicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10 text-secondary", className)} fill="none">
      <path d="M11 30 30 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M15 33c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3Zm24-15c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3Z" className="fill-current" />
      <path d="M26 38c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3Z" className="fill-[#00e581]" />
      <rect x="22" y="14" width="4" height="10" rx="1.6" className="fill-current" />
      <rect x="30" y="22" width="4" height="10" rx="1.6" className="fill-[#00e581]" />
    </svg>
  );
}

function MarkdownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10 text-primary", className)} fill="none">
      <rect x="8" y="10" width="32" height="24" rx="4" className="fill-primary/10" />
      <path d="M14 30V18h4l3 4 3-4h4v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m30 26 4 4 4-4" stroke="#00d4ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10 text-[#001a4d]", className)} fill="none">
      <path d="M24 8 12 12v10c0 7.2 4.4 13.9 12 18 7.6-4.1 12-10.8 12-18V12L24 8Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18 24.5 22 28l8-10" stroke="#00e581" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [supportOpen, setSupportOpen] = useState(false);
  const { data: session, status } = useSession();

  const primaryHref = session ? "/dashboard" : "/auth/signup";
  const secondaryHref = session ? "/editor/new" : "/auth/signin";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Global Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-flow-bg.png"
          alt="Flow Background"
          fill
          className="object-cover opacity-80 mix-blend-screen -z-10"
          priority
        />
        <div className="absolute inset-0 bg-[#020617]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-6 py-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-[#3b82f6] to-secondary text-white shadow-[0_0_20px_-5px_rgba(0,136,255,0.6)] transition-transform group-hover:scale-105">
                <span className="text-lg font-bold">Z</span>
              </div>
              <div className="flex flex-col">
                <p className="text-lg font-bold tracking-tight text-foreground">Ziliu · 字流</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Content Distribution</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <Link className="transition hover:text-white" href="#features">功能</Link>
              <Link className="transition hover:text-white" href="/pricing">定价</Link>
              <Link className="transition hover:text-white" href="/dashboard">工作台</Link>
              <Link className="transition hover:text-white" href="/extension">插件</Link>
              <Link className="transition hover:text-white" href="https://my.feishu.cn/wiki/MCBVwctYYiqO6rkz5iAcRYN0nEU?from=from_copylink" target="_blank">指南</Link>
            </nav>

            <div className="flex items-center gap-3">
              {status === "loading" ? (
                <div className="flex gap-2">
                  <div className="h-9 w-16 animate-pulse rounded-full bg-white/5" />
                  <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
                </div>
              ) : session ? (
                <>
                  <span className="hidden text-sm text-zinc-400 md:inline-block">
                    {session.user?.name || session.user?.email}
                  </span>
                  <Link href="/dashboard">
                    <Button size="sm" variant="ghost" className="rounded-full px-4 hover:bg-white/10">
                      进入工作台
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="rounded-full px-4 text-zinc-400 hover:text-white hover:bg-white/5">
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="rounded-full px-5 shadow-[0_0_20px_-5px_rgba(0,136,255,0.5)]">
                      免费开始
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Release Announcement Banner */}
        <div className="bg-primary/20 border-b border-primary/30 backdrop-blur-md">
          <div className="container mx-auto px-6 py-3 flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-blue-300">新版本 v2.0.3 已发布！</span>
            </span>
            <span className="hidden md:inline text-zinc-400">修复了一些已知 bug，提升了插件的稳定性。</span>
            <Link href="/extension" className="text-primary hover:underline font-medium">
              立即更新插件 →
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="relative mx-auto w-full px-0 pb-20 pt-16 md:pt-28 lg:pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,136,255,0.15),transparent_60%)] pointer-events-none blur-3xl opacity-60" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.1),transparent_60%)] pointer-events-none blur-3xl opacity-50" />

          <div className="container relative mx-auto px-6">
            <div className="grid items-center gap-12 lg:min-h-[600px] lg:grid-cols-2 xl:gap-20">
              <div className="space-y-8 lg:max-w-xl xl:max-w-2xl relative z-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary shadow-[0_0_15px_-5px_rgba(0,136,255,0.5)] backdrop-blur-sm">
                  AI 内容分发 · 新版上线
                </div>

                <div className="space-y-6">
                  <h1 className="text-4xl font-bold leading-[1.1] text-foreground md:text-6xl lg:text-7xl tracking-tight">
                    让文字如流水般
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#5eead4] to-secondary animate-[glow_4s_ease-in-out_infinite_alternate]">
                      顺畅流向每个平台
                    </span>
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
                    一站式创作，智能适配公众号、知乎、抖音等全渠道。
                    <br className="hidden md:block" />
                    减少重复排版，让内容更快、更漂亮地抵达读者。
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {highlights.map((item) => (
                      <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,136,255,0.8)]" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link href={primaryHref}>
                    <Button size="lg" className="h-14 rounded-2xl px-8 text-lg font-semibold shadow-[0_0_30px_-5px_rgba(0,136,255,0.5)] hover:shadow-[0_0_40px_-5px_rgba(0,136,255,0.7)] hover:scale-[1.02] transition-all">
                      {session ? "进入工作台" : "立即免费使用"}
                    </Button>
                  </Link>
                  <Link href={secondaryHref}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 text-lg text-white backdrop-blur hover:bg-white/10"
                    >
                      {session ? "新建创作" : "登录账号"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side Visual - Abstract Representation */}
              <div className="relative h-[400px] sm:h-[500px] lg:h-[640px] w-full flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-[500px] aspect-square animate-[float_6s_ease-in-out_infinite]">
                  {/* Abstract Glowing Rings/Orbs representing "Flow" */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 rounded-full blur-[80px]" />

                  {/* Glass Card Container (Simulating the 3D element container) */}
                  <div className="absolute inset-4 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

                    {/* The "Center" Visual - Replacing the image with a CSS composition for now */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-secondary drop-shadow-[0_0_30px_rgba(0,136,255,0.5)] leading-none select-none">
                        字
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-md">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="text-sm font-medium text-white/90">AI 内容流转引擎运行中</span>
                      </div>
                    </div>

                    {/* Orbiting Elements */}
                    <div className="absolute top-10 right-10 p-3 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-xl animate-pulse">
                      <div className="h-2 w-12 bg-white/20 rounded mb-2" />
                      <div className="h-2 w-8 bg-white/20 rounded" />
                    </div>
                    <div className="absolute bottom-20 left-10 p-3 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-xl animate-bounce delay-700">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {[
                { label: "支持平台", value: "16+", sub: "持续扩展", icon: "🔥" },
                { label: "平均省时", value: "85%", sub: "格式自动适配", icon: "⚡" },
                { label: "团队协作", value: "多角色", sub: "权限与审阅流", icon: "👥" },
                { label: "发布效率", value: "7 倍", sub: "减少 80% 重复排版", icon: "🚀" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 group-hover:text-primary/80 transition-colors">{item.label}</p>
                      <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                    </div>
                    <p className="text-3xl md:text-3xl font-bold text-white tracking-tight">{item.value}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed mt-1 group-hover:text-zinc-400 transition-colors">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 py-20 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">CORE FEATURES</p>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl tracking-tight">
                核心功能，
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                  覆盖内容全链路
                </span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl">
                从创作、适配到分发与回收，确保每一篇内容都拥有一致的质感与表现力。
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="ghost" className="rounded-full px-6 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5">
                查看定价
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, description, tone, icon: Icon }) => (
              <div
                key={title}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0A0E17] p-8 transition-all hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_0_50px_-20px_rgba(0,136,255,0.15)]",
                  tone === "primary" && "hover:shadow-[0_0_50px_-20px_rgba(0,136,255,0.2)]",
                  tone === "secondary" && "hover:shadow-[0_0_50px_-20px_rgba(0,212,255,0.2)]",
                )}
              >
                {/* Hover Gradient Background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100",
                    tone === "primary" && "bg-[radial-gradient(circle_at_top_right,rgba(0,136,255,0.1),transparent_70%)]",
                    tone === "secondary" && "bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.1),transparent_70%)]",
                    tone === "accent" && "bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,0.1),transparent_70%)]",
                    tone === "navy" && "bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_70%)]"
                  )}
                />

                <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/20 shadow-[0_0_20px_-5px_rgba(0,136,255,0.3)] backdrop-blur-md group-hover:scale-110 transition-all duration-300 group-hover:shadow-[0_0_30px_-5px_rgba(0,136,255,0.5)] group-hover:ring-primary/50">
                  <Icon className="h-8 w-8 drop-shadow-[0_0_10px_rgba(0,136,255,0.5)]" />
                </div>

                <h3 className="relative text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="relative text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="container mx-auto px-6 py-20 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-6 mb-16 relative z-10">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">FLOW</p>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl tracking-tight">
                内容流水线，
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                  自动完成每一步
                </span>
              </h2>
              <p className="text-lg text-zinc-400">将创作、适配、发布和反馈串联成流动的体验。</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md transition-all hover:bg-white/[0.04] hover:border-white/10"
              >
                <div className="relative flex items-center justify-between mb-8">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-primary transition-colors">{step.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-zinc-400 ring-1 ring-white/10 group-hover:bg-primary group-hover:text-white group-hover:ring-primary transition-all">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="relative text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="relative text-sm leading-relaxed text-zinc-400">{step.description}</p>

                {/* Progress Line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-secondary transition-all duration-700 group-hover:w-full opacity-50" />
              </div>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="container mx-auto px-6 py-20">
          <div className="rounded-[40px] border border-white/5 bg-white/[0.02] p-8 md:p-12 backdrop-blur-xl shadow-[0_0_80px_-40px_rgba(0,136,255,0.2)]">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">PLATFORMS</p>
                <h2 className="text-3xl font-bold text-foreground md:text-4xl">全面支持的内容矩阵</h2>
                <p className="text-lg text-zinc-400">覆盖主流长短内容平台，并可通过插件/导出链接拓展更多渠道。</p>
              </div>
              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary border border-primary/20">持续新增</div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {platforms.map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/10 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 group-hover:bg-white/20 transition-colors">
                      <Image
                        src={`/logos/${item.slug}.svg`}
                        alt={`${item.name} logo`}
                        width={24}
                        height={24}
                        className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-zinc-700 group-hover:bg-primary transition-colors duration-500 shadow-[0_0_10px_rgba(0,136,255,0)] group-hover:shadow-[0_0_10px_rgba(0,136,255,0.5)]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value / CTA */}
        <section className="container mx-auto px-6 pb-32">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[40px] border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary ring-1 ring-white/10">
                  <ShieldIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SECURITY & GOVERNANCE</p>
                  <h3 className="text-2xl font-bold text-white mt-1">安全、稳定、可审计的内容管线</h3>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "权限与审阅", desc: "多角色流程，避免误发与越权。" },
                  { title: "版本留存", desc: "自动快照与回滚，记录每次修改。" },
                  { title: "数据加密", desc: "全程 TLS，加密存储敏感凭据。" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-bold text-zinc-200">{item.title}</p>
                    <p className="mt-2 text-sm text-zinc-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-gradient-to-br from-primary/20 via-primary/5 to-background p-10 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] pointer-events-none" />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary relative z-10">READY TO FLOW</p>
              <h3 className="mt-4 text-3xl font-bold text-white relative z-10">把内容交给字流，让创作回归本身</h3>
              <p className="mt-4 text-base leading-relaxed text-zinc-400 relative z-10">
                无论是个人创作者还是团队品牌，都能用同一套流程完成创作、适配、发布与复盘。
              </p>

              <div className="mt-8 flex flex-wrap gap-4 relative z-10">
                <Link href={primaryHref}>
                  <Button className="rounded-xl px-8 py-6 text-base font-semibold shadow-[0_0_30px_-10px_rgba(0,136,255,0.6)] hover:shadow-[0_0_40px_-10px_rgba(0,136,255,0.8)] hover:scale-105 transition-all">
                    立即开始
                  </Button>
                </Link>
                <Link href="/extension">
                  <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 px-6 py-6 text-base text-zinc-300 hover:bg-white/10 hover:text-white backdrop-blur">
                    安装插件
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#020617]/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-16">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-[#3b82f6] to-secondary text-white shadow-[0_0_20px_-5px_rgba(0,136,255,0.5)]">
                    <span className="text-sm font-bold">Z</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">字流 Ziliu</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Content Distribution</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                  AI 驱动的多平台内容分发工具，一次创作，智能适配并分发到公众号、知乎、B站、抖音等全渠道。
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-white">产品</p>
                <div className="flex flex-col gap-3 text-sm text-zinc-500">
                  <Link href="#features" className="hover:text-primary transition-colors">功能概览</Link>
                  <Link href="/pricing" className="hover:text-primary transition-colors">定价</Link>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">工作台</Link>
                  <Link href="/extension" className="hover:text-primary transition-colors">浏览器插件</Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-white">资源</p>
                <div className="flex flex-col gap-3 text-sm text-zinc-500">
                  <Link href="/blog" className="hover:text-primary transition-colors">博客 / 更新</Link>
                  <Link href="https://my.feishu.cn/wiki/MCBVwctYYiqO6rkz5iAcRYN0nEU?from=from_copylink" target="_blank" className="hover:text-primary transition-colors">使用指南</Link>
                  <Link href="/faq" className="hover:text-primary transition-colors">常见问题</Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-white">支持</p>
                <div className="flex flex-col gap-3 text-sm text-zinc-500">
                  <Link href="/auth/signup" className="hover:text-primary transition-colors">开始试用</Link>
                  <button onClick={() => setSupportOpen(true)} className="text-left hover:text-primary transition-colors">
                    联系客服
                  </button>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-left hover:text-primary transition-colors">
                    返回顶部
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-xs text-zinc-600">
              <p>© 2025 字流 Ziliu. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span className="cursor-pointer hover:text-zinc-400">隐私政策</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="cursor-pointer hover:text-zinc-400">服务条款</span>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <CustomerSupportButton useExternalDialog onOpenExternal={() => setSupportOpen(true)} />
      <WechatGuideDialog
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        onProceedToRedeem={() => setSupportOpen(false)}
        title="联系客服"
        description="扫码添加官方客服，获取帮助、反馈或开通专业版"
      />
      <StructuredData type="WebApplication" />
    </div>
  );
}
