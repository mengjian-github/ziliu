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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,255,0.10),transparent_45%),radial-gradient(circle_at_82%_8%,rgba(0,212,255,0.10),transparent_42%),radial-gradient(100%_60%_at_60%_90%,rgba(0,26,77,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.24),transparent_36%),linear-gradient(245deg,rgba(255,255,255,0.22),transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_18px_40px_-18px_rgba(0,102,255,0.75)]">
                <span className="text-lg font-semibold">Z</span>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">Ziliu · 字流</p>
                <p className="text-xs text-muted-foreground">Content Distribution Platform</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <Link className="transition hover:text-foreground" href="#features">功能</Link>
              <Link className="transition hover:text-foreground" href="/pricing">定价</Link>
              <Link className="transition hover:text-foreground" href="/dashboard">工作台</Link>
              <Link className="transition hover:text-foreground" href="/extension">插件</Link>
            </nav>

            <div className="flex items-center gap-3">
              {status === "loading" ? (
                <div className="flex gap-2">
                  <div className="h-10 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
                </div>
              ) : session ? (
                <>
                  <span className="hidden text-sm text-muted-foreground md:inline-block">
                    你好，{session.user?.name || session.user?.email}
                  </span>
                  <Link href="/dashboard">
                    <Button size="sm" variant="ghost" className="rounded-full px-4">
                      进入工作台
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="rounded-full px-4">
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="rounded-full px-5">
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
        {/* Hero */}
        <section className="relative mx-auto w-full px-0 pb-20 pt-12 md:pt-20 lg:pb-28">
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_20%,rgba(0,102,255,0.12),transparent_55%),radial-gradient(80%_60%_at_85%_15%,rgba(0,212,255,0.12),transparent_50%),radial-gradient(120%_100%_at_55%_80%,rgba(0,26,77,0.08),transparent_60%)] pointer-events-none" />
          <div className="container relative mx-auto px-6">
            <div className="grid items-center gap-12 lg:min-h-[540px] lg:grid-cols-2 xl:gap-16">
              <div className="space-y-8 lg:max-w-xl xl:max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary shadow-[0_6px_20px_-14px_rgba(0,102,255,0.8)]">
                  AI 内容分发 · 新版
                </div>
                <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-[1.05] text-foreground md:text-5xl lg:text-6xl">
                  让文字如流水般顺畅
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#2a80ff] to-secondary">
                    流向每个平台
                  </span>
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  一次创作，智能适配各主流平台排版规范，自动生成标题、摘要与封面，减少重复劳动，让内容更快、更漂亮、更稳定地抵达读者。
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {highlights.map((item) => (
                    <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-foreground shadow-[0_10px_30px_-18px_rgba(0,26,77,0.4)] ring-1 ring-white/50 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <Link href={primaryHref}>
                  <Button size="lg" className="rounded-xl px-7 py-3 text-base shadow-[0_20px_50px_-20px_rgba(0,102,255,0.75)]">
                    {session ? "进入工作台" : "立即免费试用"}
                  </Button>
                </Link>
                <Link href={secondaryHref}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-primary/25 bg-white/60 px-6 py-3 text-base text-foreground backdrop-blur"
                  >
                    {session ? "新建创作" : "查看体验演示"}
                  </Button>
                </Link>
              </div>
              </div>

              <div className="relative h-[340px] sm:h-[460px] md:h-[520px] lg:h-[580px] xl:h-[640px] w-full flex items-center justify-center self-center overflow-visible">
                <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_50%,rgba(0,102,255,0.16),transparent_60%),radial-gradient(80%_70%_at_40%_70%,rgba(0,212,255,0.12),transparent_60%)] blur-3xl" />
                <Image
                  src="/banner-hero.png"
                  alt="字流多平台流水插图"
                  fill
                  priority
                  className="object-contain object-center drop-shadow-[0_40px_120px_rgba(0,102,255,0.35)] scale-[1.22] lg:scale-[1.3]"
                />
                <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-2 text-xs font-semibold text-primary shadow-[0_14px_40px_-26px_rgba(0,26,77,0.45)] backdrop-blur">
                    实时同步
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/8 px-4 py-2 text-xs font-semibold text-foreground shadow-[0_14px_40px_-26px_rgba(0,26,77,0.45)] backdrop-blur">
                    一键分发进行中 · 92%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {[
                { label: "支持平台", value: "16+", sub: "持续扩展" },
                { label: "平均省时", value: "85%", sub: "格式自动适配" },
                { label: "团队协作", value: "多角色", sub: "权限与审阅流" },
                { label: "发布效率", value: "7 倍", sub: "减少 80% 重复排版" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/60 bg-white/75 px-6 py-5 shadow-[0_18px_50px_-30px_rgba(0,26,77,0.45)] backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p>
                  <p className="text-3xl md:text-4xl font-semibold text-foreground">{item.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 pb-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CORE FEATURES</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">核心功能，覆盖内容全链路</h2>
              <p className="mt-2 text-base text-muted-foreground">
                从创作、适配到分发与回收，确保每一篇内容都拥有一致的质感与表现力。
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                查看定价
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, description, tone, icon: Icon }) => (
              <div
                key={title}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white/80 p-6 shadow-[0_20px_60px_-36px_rgba(0,26,77,0.55)] backdrop-blur",
                  tone === "primary" && "border-primary/15",
                  tone === "secondary" && "border-secondary/20",
                  tone === "accent" && "border-[#00e581]/20",
                  tone === "navy" && "border-[#001a4d]/18"
                )}
              >
                <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" />
                <div
                  className={cn(
                    "absolute inset-0 transition duration-500 opacity-0 group-hover:opacity-100",
                    tone === "primary" && "bg-gradient-to-br from-primary/10 via-transparent to-secondary/10",
                    tone === "secondary" && "bg-gradient-to-br from-secondary/12 via-transparent to-primary/10",
                    tone === "accent" && "bg-gradient-to-br from-[#00e581]/12 via-transparent to-primary/8",
                    tone === "navy" && "bg-gradient-to-br from-[#001a4d]/12 via-transparent to-primary/10"
                  )}
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold text-foreground">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <div className="relative mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  了解更多
                  <span className="h-1 w-6 rounded-full bg-gradient-to-r from-primary to-secondary" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="container mx-auto px-6 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FLOW</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">内容流水线，自动完成每一步</h2>
              <p className="mt-2 text-base text-muted-foreground">将创作、适配、发布和反馈串联成流动的体验。</p>
            </div>
            <div className="rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur">
              即时同步 · 无需复制粘贴
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className="group relative overflow-hidden rounded-2xl border border-primary/12 bg-white/85 p-6 shadow-[0_18px_50px_-36px_rgba(0,26,77,0.55)] backdrop-blur"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-br from-primary/8 via-transparent to-secondary/10" />
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.12em] text-primary">{step.label}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">0{idx + 1}</span>
                </div>
                <h3 className="relative mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="container mx-auto px-6 pb-20">
          <div className="rounded-3xl border border-primary/10 bg-white/80 p-8 shadow-[0_30px_120px_-70px_rgba(0,26,77,0.6)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">PLATFORMS</p>
                <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">全面支持的内容矩阵</h2>
                <p className="mt-2 text-base text-muted-foreground">覆盖主流长短内容平台，并可通过插件/导出链接拓展更多渠道。</p>
              </div>
              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">持续新增</div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {platforms.map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-primary/10 bg-white/90 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_14px_40px_-30px_rgba(0,26,77,0.5)]",
                    item.bg
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 ring-1 ring-primary/10">
                      <Image
                        src={`/logos/${item.slug}.svg`}
                        alt={`${item.name} logo`}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value / CTA */}
        <section className="container mx-auto px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-white to-secondary/10 p-8 shadow-[0_30px_120px_-70px_rgba(0,26,77,0.65)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <ShieldIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">SECURITY & GOVERNANCE</p>
                  <h3 className="text-2xl font-semibold text-foreground">安全、稳定、可审计的内容管线</h3>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { title: "权限与审阅", desc: "多角色流程，避免误发与越权。" },
                  { title: "版本留存", desc: "自动快照与回滚，记录每次修改。" },
                  { title: "数据加密", desc: "全程 TLS，加密存储敏感凭据。" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-[0_14px_40px_-32px_rgba(0,26,77,0.5)] backdrop-blur">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-white/85 p-8 shadow-[0_24px_90px_-60px_rgba(0,26,77,0.6)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">READY TO FLOW</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">把内容交给字流，让创作回归本身</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                无论是个人创作者还是团队品牌，都能用同一套流程完成创作、适配、发布与复盘。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={primaryHref}>
                  <Button className="rounded-xl px-6 py-3 text-base shadow-[0_20px_50px_-22px_rgba(0,102,255,0.7)]">
                    立即开始
                  </Button>
                </Link>
                <Link href="/extension">
                  <Button variant="outline" className="rounded-xl border-primary/25 bg-white/70 px-6 py-3 text-base text-foreground">
                    安装浏览器插件
                  </Button>
                </Link>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
                提示：今天是 {new Date().toLocaleDateString()}，新版 UI 已上线，立即体验焕然一新的分发流程。
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/50 bg-white/60 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-10">
            <div className="grid gap-8 md:gap-10 lg:gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_14px_36px_-18px_rgba(0,102,255,0.65)]">
                    <span className="text-sm font-semibold">Z</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">字流 Ziliu</p>
                    <p className="text-xs text-muted-foreground">让文字如流水般顺畅</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  AI 驱动的多平台内容分发工具，一次创作，智能适配并分发到公众号、知乎、B站、抖音等全渠道。
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">产品</p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <Link href="#features" className="hover:text-foreground block">功能概览</Link>
                  <Link href="/pricing" className="hover:text-foreground block">定价</Link>
                  <Link href="/dashboard" className="hover:text-foreground block">工作台</Link>
                  <Link href="/extension" className="hover:text-foreground block">浏览器插件</Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">资源</p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <Link href="/blog" className="hover:text-foreground block">博客 / 更新</Link>
                  <Link href="/docs" className="hover:text-foreground block">使用指南</Link>
                  <Link href="/faq" className="hover:text-foreground block">常见问题</Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">支持</p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <Link href="/auth/signup" className="hover:text-foreground block">开始试用</Link>
                  <button
                    onClick={() => setSupportOpen(true)}
                    className="text-left hover:text-foreground block"
                  >
                    联系客服
                  </button>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="text-left hover:text-foreground block"
                  >
                    返回顶部
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
              <p>© 2025 字流 Ziliu. All rights reserved.</p>
              <div className="flex items-center justify-center sm:justify-end flex-wrap gap-4 sm:gap-5">
                <span>隐私政策</span>
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                <span>服务条款</span>
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
