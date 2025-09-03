import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "浏览器插件",
  description: "下载字流Chrome浏览器插件，一键填充内容到公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等平台编辑器。支持智能检测平台，自动适配格式，让多平台发布更加高效便捷。",
  keywords: ["字流插件", "Chrome插件", "浏览器扩展", "公众号填充", "知乎插件", "掘金插件", "视频号插件", "抖音插件", "B站插件", "小红书插件", "自动填充", "多平台发布插件"],
  openGraph: {
    title: "字流Chrome插件 - 一键多平台内容填充",
    description: "智能检测平台，自动填充内容，支持公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等主流平台。",
    url: "https://ziliu.online/extension",
    images: [
      {
        url: "/extension-og.jpg",
        width: 1200,
        height: 630,
        alt: "字流Chrome插件",
      },
    ],
  },
  twitter: {
    title: "字流Chrome插件 - 一键多平台内容填充",
    description: "智能检测平台，自动填充内容，让多平台发布更高效。",
  },
  alternates: {
    canonical: "https://ziliu.online/extension",
  },
};

export default function ExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}