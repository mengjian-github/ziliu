/**
 * 各平台发布规则与最佳实践
 * 包括：最佳发布时间、内容规范、违禁词检查、引流安全等级等
 */

import { Platform } from '@/types/platform-settings';

// ============================================================
// 最佳发布时间
// ============================================================

interface TimeSlot {
  start: number; // 小时 (0-23)
  end: number;   // 小时 (0-23)
  label: string;
}

interface PlatformSchedule {
  best: TimeSlot[];
  good: TimeSlot[];
}

const PUBLISH_SCHEDULES: Partial<Record<Platform, PlatformSchedule>> = {
  wechat: {
    best: [
      { start: 20, end: 22, label: '晚间黄金时段' },
    ],
    good: [
      { start: 7, end: 9, label: '通勤时段' },
      { start: 12, end: 13, label: '午休时段' },
    ],
  },
  zhihu: {
    best: [
      { start: 10, end: 12, label: '上午活跃期' },
      { start: 20, end: 22, label: '晚间活跃期' },
    ],
    good: [],
  },
  juejin: {
    best: [
      { start: 9, end: 11, label: '上午工作前' },
      { start: 14, end: 16, label: '下午摸鱼期' },
    ],
    good: [],
  },
  xiaohongshu_note: {
    best: [
      { start: 12, end: 14, label: '午休刷手机' },
      { start: 18, end: 20, label: '下班放松' },
    ],
    good: [
      { start: 10, end: 12, label: '周末上午' },
    ],
  },
  wechat_xiaolushu: {
    best: [
      { start: 12, end: 14, label: '午休刷手机' },
      { start: 18, end: 20, label: '下班放松' },
    ],
    good: [],
  },
  weibo: {
    best: [
      { start: 12, end: 14, label: '午间热搜高峰' },
      { start: 22, end: 23, label: '深夜冲浪' },
    ],
    good: [
      { start: 18, end: 20, label: '下班时段' },
    ],
  },
  jike: {
    best: [
      { start: 8, end: 9, label: '早起打卡' },
      { start: 12, end: 13, label: '午休分享' },
    ],
    good: [
      { start: 22, end: 24, label: '深夜思考' },
    ],
  },
  video_wechat: {
    best: [
      { start: 20, end: 22, label: '微信活跃高峰' },
    ],
    good: [],
  },
  douyin: {
    best: [
      { start: 12, end: 13, label: '午间刷视频' },
      { start: 21, end: 23, label: '晚间黄金档' },
    ],
    good: [
      { start: 17, end: 19, label: '下班路上' },
    ],
  },
  bilibili: {
    best: [
      { start: 17, end: 19, label: '工作日下午' },
    ],
    good: [
      { start: 10, end: 12, label: '周末上午' },
    ],
  },
  xiaohongshu: {
    best: [
      { start: 12, end: 14, label: '午休刷手机' },
      { start: 18, end: 20, label: '下班放松' },
    ],
    good: [],
  },
};

export type PublishTimeStatus = 'best' | 'good' | 'low';

export interface PublishTimeInfo {
  status: PublishTimeStatus;
  label: string;
  suggestion: string;
}

/**
 * 获取当前时间对于指定平台的发布时间评估
 * @param platform 目标平台
 * @param hour 当前小时 (0-23)，默认使用 UTC+8
 */
export function getPublishTimeInfo(platform: Platform, hour?: number): PublishTimeInfo {
  const schedule = PUBLISH_SCHEDULES[platform];
  if (!schedule) {
    return { status: 'good', label: '', suggestion: '该平台暂无时间建议' };
  }

  // 默认使用北京时间
  const h = hour ?? new Date(Date.now() + 8 * 3600000).getHours();

  // 检查最佳时段
  for (const slot of schedule.best) {
    if (h >= slot.start && h < slot.end) {
      return {
        status: 'best',
        label: slot.label,
        suggestion: `🟢 现在是最佳发布时间（${slot.label}）`,
      };
    }
  }

  // 检查次佳时段
  for (const slot of schedule.good) {
    if (h >= slot.start && h < slot.end) {
      return {
        status: 'good',
        label: slot.label,
        suggestion: `🟡 当前可以发（${slot.label}）`,
      };
    }
  }

  // 找到下一个最佳时段
  const allBest = schedule.best.map(s => s.start).sort((a, b) => a - b);
  let nextBest = allBest.find(s => s > h);
  if (!nextBest && allBest.length > 0) nextBest = allBest[0]; // 明天的第一个
  const nextLabel = nextBest !== undefined ? `建议 ${nextBest}:00 发布` : '';

  return {
    status: 'low',
    label: '',
    suggestion: `🔴 当前是低流量时段${nextLabel ? '，' + nextLabel : ''}`,
  };
}

// ============================================================
// 违禁词 / 合规检查
// ============================================================

interface ComplianceIssue {
  type: 'forbidden' | 'warning' | 'info';
  keyword: string;
  message: string;
  platform: Platform | 'all';
}

// 小红书违禁词（绝对化用语 + 敏感词）
const XIAOHONGSHU_FORBIDDEN = [
  '最好', '最佳', '第一', '唯一', '顶级', '极致', '史上最',
  '100%', '百分百', '绝对', '肯定有效', '万能', '神器',
  '秒杀', '吊打', '碾压',
  // 医疗/功效类
  '治疗', '治愈', '药效', '根治', '特效',
  // 金融类
  '保本', '稳赚', '零风险', '高收益',
];

// 全平台通用敏感词
const UNIVERSAL_FORBIDDEN = [
  // 导流相关（小红书/抖音等严查）
  '加微信', '加我微信', '微信号', 'vx:', 'VX:',
  '加群', '进群', '扫码加',
  // 绝对化承诺
  '假一赔十', '无效退款',
];

// 各平台引流敏感词
const TRAFFIC_SENSITIVE: Record<string, string[]> = {
  xiaohongshu_note: ['微信', 'wx', '公众号', '淘宝', 'tb', '链接在', '看我主页', '评论区留'],
  douyin: ['微信', 'wx', '公众号', '淘宝'],
  weibo: [],
  zhihu: [],
  bilibili: [],
  jike: [],
};

/**
 * 检查内容合规性
 */
export function checkCompliance(
  content: string,
  platform: Platform,
  options?: { checkTitle?: boolean }
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const textToCheck = content.toLowerCase();

  // 1. 全平台通用检查
  for (const word of UNIVERSAL_FORBIDDEN) {
    if (textToCheck.includes(word.toLowerCase())) {
      issues.push({
        type: 'forbidden',
        keyword: word,
        message: `含有敏感词"${word}"，多数平台会限流或删除`,
        platform: 'all',
      });
    }
  }

  // 2. 小红书特有违禁词
  if (platform === 'xiaohongshu_note' || platform === 'xiaohongshu' || platform === 'wechat_xiaolushu') {
    for (const word of XIAOHONGSHU_FORBIDDEN) {
      if (textToCheck.includes(word.toLowerCase())) {
        issues.push({
          type: 'forbidden',
          keyword: word,
          message: `小红书违禁词"${word}"，使用会导致限流`,
          platform,
        });
      }
    }
  }

  // 3. 平台特定引流敏感词
  const trafficWords = TRAFFIC_SENSITIVE[platform] || [];
  for (const word of trafficWords) {
    if (textToCheck.includes(word.toLowerCase())) {
      issues.push({
        type: 'warning',
        keyword: word,
        message: `含有引流敏感词"${word}"，在${getPlatformName(platform)}可能触发限流`,
        platform,
      });
    }
  }

  // 4. 二维码检查（通过文字提示）
  if (textToCheck.includes('二维码') || textToCheck.includes('扫码')) {
    issues.push({
      type: 'warning',
      keyword: '二维码/扫码',
      message: '提到二维码，请确保不在图片中放入二维码（多数平台会限流）',
      platform,
    });
  }

  // 5. AI写作检测提醒
  const aiPatterns = ['总而言之', '综上所述', '值得注意的是', '不言而喻', '在当今'];
  const aiHits = aiPatterns.filter(p => textToCheck.includes(p));
  if (aiHits.length >= 2) {
    issues.push({
      type: 'info',
      keyword: aiHits.join('、'),
      message: 'AI写作痕迹较明显，知乎等平台可能限流AI比例>30%的内容',
      platform,
    });
  }

  return issues;
}

function getPlatformName(platform: Platform): string {
  const names: Partial<Record<Platform, string>> = {
    xiaohongshu_note: '小红书',
    xiaohongshu: '小红书',
    wechat_xiaolushu: '小绿书',
    douyin: '抖音',
    bilibili: 'B站',
    weibo: '微博',
    zhihu: '知乎',
    jike: '即刻',
    video_wechat: '视频号',
    wechat: '公众号',
    juejin: '掘金',
  };
  return names[platform] || platform;
}

// ============================================================
// 封面尺寸规范
// ============================================================

export interface CoverSpec {
  width: number;
  height: number;
  ratio: string;
  label: string;
}

export const COVER_SPECS: Partial<Record<Platform, CoverSpec | CoverSpec[]>> = {
  wechat: { width: 900, height: 383, ratio: '2.35:1', label: '公众号头图' },
  xiaohongshu_note: { width: 1080, height: 1440, ratio: '3:4', label: '小红书竖版' },
  xiaohongshu: { width: 1080, height: 1440, ratio: '3:4', label: '小红书视频' },
  wechat_xiaolushu: { width: 1080, height: 1440, ratio: '3:4', label: '小绿书' },
  douyin: { width: 1080, height: 1920, ratio: '9:16', label: '抖音竖版' },
  bilibili: [
    { width: 1920, height: 1080, ratio: '16:9', label: 'B站个人空间' },
    { width: 1440, height: 1080, ratio: '4:3', label: 'B站首页推荐' },
  ],
  video_wechat: { width: 1080, height: 1260, ratio: '6:7', label: '视频号' },
  youtube: { width: 1280, height: 720, ratio: '16:9', label: 'YouTube' },
  zhihu: { width: 690, height: 388, ratio: '16:9', label: '知乎专栏' },
  weibo: { width: 1080, height: 1080, ratio: '1:1', label: '微博方图' },
};

// ============================================================
// 内容长度规范
// ============================================================

export interface ContentLimits {
  titleMin?: number;
  titleMax?: number;
  contentMin?: number;
  contentMax?: number;
  /** 视频口播稿推荐字数 */
  speechMin?: number;
  speechMax?: number;
  /** 视频推荐秒数 */
  durationMin?: number;
  durationMax?: number;
}

export const CONTENT_LIMITS: Partial<Record<Platform, ContentLimits>> = {
  wechat: { titleMax: 64, contentMin: 800, contentMax: 4000 },
  xiaohongshu_note: { titleMin: 6, titleMax: 20, contentMin: 300, contentMax: 1000 },
  wechat_xiaolushu: { titleMin: 6, titleMax: 20, contentMax: 1000 },
  zhihu: { contentMin: 1500, contentMax: 8000 },
  juejin: { contentMin: 1500, contentMax: 5000 },
  weibo: { contentMax: 2000 },
  jike: { contentMax: 2000 },
  x: { contentMax: 4000 },
  douyin: { speechMin: 200, speechMax: 400, durationMin: 60, durationMax: 120 },
  bilibili: { speechMin: 500, speechMax: 4500, durationMin: 180, durationMax: 900 },
  video_wechat: { speechMin: 200, speechMax: 500, durationMin: 60, durationMax: 300 },
  xiaohongshu: { speechMin: 200, speechMax: 400, durationMin: 60, durationMax: 120 },
  youtube: { speechMin: 500, speechMax: 2000, durationMin: 180, durationMax: 480 },
};

// ============================================================
// 安全引流模板库
// ============================================================

export interface TrafficTemplate {
  method: string;       // 引流方式名称
  template: string;     // 可直接使用的文案模板
  risk: 'safe' | 'moderate' | 'risky';  // 风险等级
  note: string;         // 注意事项
}

export const TRAFFIC_TEMPLATES: Partial<Record<Platform, TrafficTemplate[]>> = {
  xiaohongshu_note: [
    {
      method: '主页置顶笔记',
      template: '想了解更多干货？看我主页置顶笔记，整理好了完整攻略 📌',
      risk: 'safe',
      note: '确保置顶笔记不含违规内容，适合引导到自己其他笔记',
    },
    {
      method: '评论区回复引导',
      template: '需要的姐妹评论区扣"要"，我一个个私信发给你们～',
      risk: 'safe',
      note: '通过评论互动引导私信，增加笔记互动权重',
    },
    {
      method: '小红书群聊',
      template: '我建了一个交流群，感兴趣的宝子点我头像进群聊，每天分享实用技巧 🎯',
      risk: 'safe',
      note: '小红书群聊是平台自有功能，不会被判为站外引流',
    },
    {
      method: '搜索同名账号',
      template: '全网同名哦～其他平台搜"XXX"就能找到我，内容更全 ✨',
      risk: 'moderate',
      note: '不要直接提及具体平台名称，只说"全网同名"即可',
    },
    {
      method: '首字母缩写',
      template: '资料包在我的 gzh：X X X（首字母），回复"666"自动获取',
      risk: 'moderate',
      note: '使用首字母缩写降低被检测概率，但仍有风险，不宜高频使用',
    },
    {
      method: '直接提及微信（高风险）',
      template: '加V：XXXXX，备注小红书',
      risk: 'risky',
      note: '⚠️ 极易被限流/删帖/封号，强烈不建议在正文和评论中使用',
    },
  ],
  xiaohongshu: [
    {
      method: '视频口播引导主页',
      template: '更多教程看我主页，置顶笔记有完整合集 📌',
      risk: 'safe',
      note: '视频口播中自然提及，比文字更难被审核检测',
    },
    {
      method: '评论区互动',
      template: '有问题评论区问我，我会一一回复～也可以私信我领资料包 📦',
      risk: 'safe',
      note: '引导到私信是平台内行为，相对安全',
    },
    {
      method: '小红书群聊',
      template: '点我头像，加入粉丝群，群里有独家分享和答疑 🔥',
      risk: 'safe',
      note: '利用小红书群聊功能，官方支持的引流方式',
    },
    {
      method: '全网同名搜索',
      template: '全网同名"XXX"，各平台都能找到我，更多内容等你发现 🌐',
      risk: 'moderate',
      note: '适合视频结尾口播，不直接提及其他平台名称',
    },
  ],
  douyin: [
    {
      method: '主页联系方式',
      template: '想合作/咨询的朋友，主页有联系方式，直接点我头像就能看到 👆',
      risk: 'safe',
      note: '抖音允许在主页简介放联系方式（需开通企业号效果更好）',
    },
    {
      method: '评论区扣关键词',
      template: '想要同款教程的家人们，评论区扣"1"，我私信发你 🎁',
      risk: 'safe',
      note: '高互动评论有利于视频推荐，扣1是抖音常见引流手法',
    },
    {
      method: '粉丝群',
      template: '加入我的粉丝群，群里每天更新独家内容，点我头像"粉丝群"按钮进入 🔥',
      risk: 'safe',
      note: '抖音粉丝群是平台功能，安全且有利于粉丝粘性',
    },
    {
      method: '全平台同名搜索',
      template: '全网同名搜索"XXX"，完整版内容在那边～',
      risk: 'moderate',
      note: '口播时自然带过，不要刻意强调，避免被审核标记',
    },
    {
      method: '直接引导加微信（高风险）',
      template: 'V我：XXXXX',
      risk: 'risky',
      note: '⚠️ 抖音对微信引流零容忍，极大概率限流/封号/重置账号',
    },
  ],
  weibo: [
    {
      method: '置顶微博',
      template: '详细内容整理在置顶微博了，去我主页看置顶，一篇说清楚 📌',
      risk: 'safe',
      note: '置顶微博是微博自有功能，引导查看不会触发审核',
    },
    {
      method: '头条文章链接',
      template: '完整版写成了头条文章，点我主页"文章"栏就能看到全文 📖',
      risk: 'safe',
      note: '微博头条文章支持长篇内容，适合深度引流',
    },
    {
      method: '超话社区',
      template: '我在#XXX超话#里发了更详细的教程，关注超话不迷路 🏠',
      risk: 'safe',
      note: '超话是微博生态内容，引导用户进入自己管理的超话非常安全',
    },
    {
      method: '评论区放链接',
      template: '链接放评论区了～点开评论第一条就是 ⬇️',
      risk: 'moderate',
      note: '微博对外链有一定限制，淘口令/短链有时会被吞，建议用微博自有功能',
    },
    {
      method: '粉丝群',
      template: '想持续获取分享，加我的微博粉丝群，群里干货更多 🤝',
      risk: 'safe',
      note: '微博粉丝群是平台功能，运营维护群聊可增强粉丝粘性',
    },
  ],
  zhihu: [
    {
      method: '文末引用来源',
      template: '以上内容整理自我的专栏文章，更多系列内容可以关注专栏「XXX」持续更新中 📚',
      risk: 'safe',
      note: '知乎鼓励原创内容引用，文末自然引导到自己的专栏非常安全',
    },
    {
      method: '个人简介引导',
      template: '想看更多干货？欢迎关注我，个人简介有完整资源汇总 📋',
      risk: 'safe',
      note: '知乎个人简介可以放站外链接（需达到一定创作等级）',
    },
    {
      method: '专栏引导关注',
      template: '这是我「XXX系列」的第N篇，关注专栏可以看到完整系列，持续更新 ✍️',
      risk: 'safe',
      note: '用系列内容制造连续阅读需求，自然引导关注',
    },
    {
      method: '文中自然提及',
      template: '关于这个话题，我之前在公号写过一篇深度分析，感兴趣的可以搜一下"XXX"',
      risk: 'moderate',
      note: '在文中自然提及即可，不要过于频繁，知乎对软广有一定容忍度',
    },
    {
      method: '好物推荐卡片',
      template: '我常用的工具都整理在"想法"里了，可以看看有没有适合你的 💡',
      risk: 'safe',
      note: '利用知乎"想法"功能发布轻量内容，引导查看',
    },
  ],
  bilibili: [
    {
      method: '简介区链接',
      template: '相关资源和工具链接放在视频简介区了，展开就能看到 ⬇️',
      risk: 'safe',
      note: 'B站简介区可以放外部链接，是最安全的引流位置',
    },
    {
      method: '置顶评论',
      template: '视频提到的所有工具/资源，我整理到置顶评论了，自取 📦',
      risk: 'safe',
      note: 'UP主可以置顶自己的评论，放链接或引导信息非常自然',
    },
    {
      method: '动态发布',
      template: '详细的图文教程发在我的动态了，配合视频食用效果更佳 ✨',
      risk: 'safe',
      note: 'B站动态支持图文，适合补充视频内容',
    },
    {
      method: '口播提醒关注',
      template: '觉得有用的话，一键三连支持一下，关注我不迷路，下期更精彩 🔔',
      risk: 'moderate',
      note: '口播引导关注是B站常见做法，但频率不宜过高，自然带过即可',
    },
    {
      method: '充电/粉丝装扮',
      template: '充电的同学可以加入专属粉丝群，群里有独家资源分享 💎',
      risk: 'safe',
      note: 'B站官方变现渠道，引导充电同时提供增值服务',
    },
  ],
  wechat: [
    {
      method: '阅读原文链接',
      template: '完整资料/工具链接，请点击文末「阅读原文」获取 👇',
      risk: 'safe',
      note: '阅读原文是公众号官方功能，可以放任何外链',
    },
    {
      method: '公众号菜单',
      template: '进入公众号主页，点击底部菜单「免费领取」获取完整资料包 📁',
      risk: 'safe',
      note: '公众号菜单是官方功能，适合放常用引流入口',
    },
    {
      method: '引导关注',
      template: '觉得有用的话，点个关注不迷路 ⭐ 后续还会持续更新同系列干货',
      risk: 'safe',
      note: '引导关注公众号是完全合规的，可以配合文末二维码',
    },
    {
      method: '文末卡片/小程序',
      template: '👇 点击下方卡片，即可跳转使用（或扫码体验）',
      risk: 'safe',
      note: '公众号支持插入小程序卡片、话题标签等，形式丰富且安全',
    },
    {
      method: '历史消息引导',
      template: '这是「XXX系列」第N篇，之前的内容可以在公众号发送"目录"获取合集 📖',
      risk: 'safe',
      note: '利用自动回复关键词引导阅读历史内容，增加粉丝粘性',
    },
  ],
  jike: [
    {
      method: '个人简介',
      template: '我的其他平台账号和联系方式都在个人简介里啦，点我头像就能看到 🏠',
      risk: 'safe',
      note: '即刻个人简介支持填写多个社交链接，社区对此非常宽容',
    },
    {
      method: '评论互动引导',
      template: '对这个话题感兴趣的朋友，欢迎评论讨论 💬 会一一回复～',
      risk: 'safe',
      note: '即刻社区鼓励互动，通过评论建立信任后再引导私信更自然',
    },
    {
      method: '关联链接分享',
      template: '相关的深度文章我写在了博客/公众号，链接附在评论区 📎',
      risk: 'safe',
      note: '即刻对外部链接分享非常友好，可以直接在动态中放链接',
    },
    {
      method: '圈子/话题引导',
      template: '我在"XXX"圈子里持续分享相关内容，感兴趣可以关注这个圈子 🎯',
      risk: 'safe',
      note: '即刻圈子类似话题社区，引导关注圈子是平台鼓励的行为',
    },
    {
      method: '即刻日记/集锦',
      template: '我把这个系列的所有分享整理成了日记集锦，点我主页就能看到完整合集 📝',
      risk: 'safe',
      note: '即刻日记功能适合做内容归档，方便粉丝回顾',
    },
  ],
};

/**
 * 获取指定平台的安全引流模板列表
 * @param platform 目标平台
 * @returns 引流模板列表（按风险从低到高排序）
 */
export function getTrafficTemplates(platform: Platform): TrafficTemplate[] {
  // xiaohongshu 视频版也使用 xiaohongshu 的模板（已有独立条目）
  // xiaohongshu_note 和 xiaohongshu 各有独立模板
  const templates = TRAFFIC_TEMPLATES[platform] || [];
  const riskOrder: Record<TrafficTemplate['risk'], number> = { safe: 0, moderate: 1, risky: 2 };
  return [...templates].sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
}
