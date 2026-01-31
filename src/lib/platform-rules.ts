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
