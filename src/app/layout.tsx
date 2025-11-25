import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientSessionProvider } from "@/components/providers/session-provider";
import { UserPlanProvider } from "@/lib/subscription/hooks/useUserPlan";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "字流 - AI驱动的多平台内容发布工具",
    template: "%s | 字流"
  },
  description: "字流是一款AI驱动的多平台内容发布工具，支持一次创作，智能适配公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等平台格式。让文字如流水般顺畅流向每个平台，提升内容创作效率。",
  keywords: ["内容发布", "多平台发布", "AI写作", "公众号编辑", "知乎", "掘金", "知识星球", "视频号", "抖音", "B站", "小红书", "Markdown编辑器", "自媒体工具", "内容创作"],
  authors: [{ name: "字流团队" }],
  creator: "字流团队",
  publisher: "字流团队",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://ziliu.online",
    siteName: "字流",
    title: "字流 - AI驱动的多平台内容发布工具",
    description: "让文字如流水般顺畅流向每个平台，一次创作，智能适配公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等多个内容平台。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "字流 - AI驱动的多平台内容发布工具",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ZiliuApp",
    creator: "@ZiliuApp",
    title: "字流 - AI驱动的多平台内容发布工具",
    description: "让文字如流水般顺畅流向每个平台，一次创作，智能适配多个内容平台。",
    images: ["/twitter-image.jpg"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://ziliu.online",
  },
  category: "productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientSessionProvider>
          <UserPlanProvider>
            {children}
          </UserPlanProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
