import Script from 'next/script';

interface StructuredDataProps {
  type?: 'WebApplication' | 'SoftwareApplication' | 'Organization';
}

export function StructuredData({ type = 'WebApplication' }: StructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type,
    "name": "字流",
    "description": "字流是一款AI驱动的多平台内容发布工具，支持一次创作，智能适配公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等平台格式。",
    "url": "https://ziliu.online",
    "logo": "https://ziliu.online/logo.png",
    "image": "https://ziliu.online/og-image.jpg",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "19.9",
      "priceCurrency": "CNY",
      "priceValidUntil": "2025-12-31",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "多平台内容发布",
      "AI智能格式转换", 
      "Markdown编辑器",
      "实时预览",
      "Chrome插件集成",
      "云端图片存储"
    ],
    "publisher": {
      "@type": "Organization",
      "name": "字流团队",
      "url": "https://ziliu.online"
    },
    "softwareVersion": "1.0.0",
    "requirements": "Web浏览器",
    "permissions": "读写权限",
    "downloadUrl": "https://ziliu.online/extension",
    "screenshot": "https://ziliu.online/screenshot.jpg",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "156",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "字流团队"
    }
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}