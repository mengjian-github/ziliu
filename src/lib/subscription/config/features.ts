// 功能权限配置
export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  plans: ('free' | 'pro')[];
  limits?: {
    free?: number;
    pro?: number;
  };
}

export const FEATURES: Record<string, FeatureConfig> = {
  // 文章管理
  'unlimited-articles': {
    id: 'unlimited-articles',
    name: '无限文章存储',
    description: '保存无限数量的文章',
    plans: ['free', 'pro'],
    limits: {
      free: 5, // 免费版最多5篇
      pro: -1, // 专业版无限
    }
  },

  // 平台支持
  'multi-platform': {
    id: 'multi-platform', 
    name: '多平台发布',
    description: '支持知乎、掘金、知识星球平台',
    plans: ['pro']
  },

  'wechat-platform': {
    id: 'wechat-platform',
    name: '微信公众号',
    description: '发布到微信公众号',
    plans: ['free', 'pro']
  },

  'zhihu-platform': {
    id: 'zhihu-platform',
    name: '知乎平台',
    description: '发布到知乎专栏',
    plans: ['pro']
  },

  'juejin-platform': {
    id: 'juejin-platform',
    name: '掘金平台', 
    description: '发布到掘金社区',
    plans: ['pro']
  },

  'zsxq-platform': {
    id: 'zsxq-platform',
    name: '知识星球',
    description: '发布到知识星球',
    plans: ['pro']
  },

  // 视频平台支持
  'video_wechat-platform': {
    id: 'video_wechat-platform',
    name: '微信视频号',
    description: '发布到微信视频号',
    plans: ['pro']
  },

  'douyin-platform': {
    id: 'douyin-platform',
    name: '抖音平台',
    description: '发布到抖音短视频',
    plans: ['pro']
  },

  'bilibili-platform': {
    id: 'bilibili-platform',
    name:'B站平台',
    description: '发布到B站视频',
    plans: ['pro']
  },

  'xiaohongshu-platform': {
    id: 'xiaohongshu-platform',
    name: '小红书平台',
    description: '发布到小红书视频',
    plans: ['pro']
  },

  // 样式功能
  'advanced-styles': {
    id: 'advanced-styles',
    name: '专业样式',
    description: '使用技术风格和简约风格模板',
    plans: ['pro']
  },

  // 预设功能
  'publish-presets': {
    id: 'publish-presets',
    name: '发布预设',
    description: '创建和管理发布模板',
    plans: ['pro']
  },

  // 图片功能
  'cloud-images': {
    id: 'cloud-images',
    name: '云端图片存储',
    description: '图片云端存储和管理',
    plans: ['free', 'pro'],
    limits: {
      free: 20, // 免费版20张/月
      pro: 500, // 专业版500张/月
    }
  },

  // 自定义R2存储
  'custom-r2': {
    id: 'custom-r2',
    name: '自定义R2存储',
    description: '使用您自己的Cloudflare R2存储，无限制上传图片',
    plans: ['pro']
  }
};

// 升级提示场景配置
export interface UpgradePromptConfig {
  title: string;
  description: string;
  features: string[];
  cta: string;
  style: 'card' | 'modal' | 'inline' | 'tooltip';
}

export const UPGRADE_PROMPTS: Record<string, UpgradePromptConfig> = {
  'article-limit': {
    title: '文章存储已达上限',
    description: '免费版最多保存5篇文章，升级专业版获得无限存储空间',
    features: ['unlimited-articles', 'multi-platform', 'advanced-styles'],
    cta: '立即升级专业版',
    style: 'card'
  },

  'platform-locked': {
    title: '解锁更多平台',
    description: '升级专业版，一键发布到知乎、掘金、知识星球',
    features: ['zhihu-platform', 'juejin-platform', 'zsxq-platform'],
    cta: '解锁全平台发布',
    style: 'modal'
  },

  'style-locked': {
    title: '使用专业样式',
    description: '技术风格和简约风格让你的文章更出彩',
    features: ['advanced-styles'],
    cta: '解锁专业样式',
    style: 'inline'
  },

  'preset-locked': {
    title: '创建发布预设',
    description: '保存常用的发布配置，让发布更高效',
    features: ['publish-presets'],
    cta: '解锁预设功能', 
    style: 'tooltip'
  },

  'cloud-images-limit': {
    title: '图片存储已达上限',
    description: '免费版每月可使用20张图片，升级专业版获得500张/月额度',
    features: ['cloud-images'],
    cta: '升级获得更多图片额度',
    style: 'inline'
  },

  'dashboard-upgrade': {
    title: '升级到专业版',
    description: '解锁全平台发布、无限存储、专业样式等功能',
    features: ['multi-platform', 'unlimited-articles', 'advanced-styles'],
    cta: '兑换专业版',
    style: 'card'
  }
};

// 定价配置
export const PRICING_CONFIG = {
  monthly: {
    price: 19.9,
    duration: 1, // 月数
    label: '月付',
    description: '灵活订阅，随时取消',
    savings: null
  },
  yearly: {
    price: 199,
    duration: 12,
    label: '年付', 
    description: '一次付费，全年无忧',
    savings: 40 // 相比月付节省的金额
  }
};