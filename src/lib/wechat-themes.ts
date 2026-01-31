export const FONTS = {
    standard: 'mp-quote, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
    serif: '"Songti SC", "STSong", "SimSun", "Noto Serif SC", serif',
    code: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
};

const COLORS = {
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    wechatGreen: '#07c160',
    tech: '#6366F1',
    card: '#10B981',
    cardDark: '#34D399',
    print: '#92400E',
    printDark: '#D97706',
    darkBg: '#0F172A',
    darkBgSecondary: '#1E293B',
    darkBgTertiary: '#334155',
    darkAccent: '#60A5FA',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    darkTextPrimary: '#F1F5F9',
    darkTextSecondary: '#CBD5E1',
    darkTextTertiary: '#94A3B8',
    border: '#E5E7EB',
    borderDark: '#334155',
    bgLight: '#F9FAFB',
    bgCode: '#F3F4F6',
};

export interface ThemeDefinition {
    name: string;
    css: string; // 预览用的 CSS
    cssDark: string; // 预览用的 CSS (夜间模式)
    inline: Record<string, string>; // 导出用的内联样式
    inlineDark: Record<string, string>; // 导出用的内联样式 (夜间模式)
    rootStyle?: string; // 导出时最外层的包裹样式
    rootStyleDark?: string; // 导出时最外层的包裹样式 (夜间模式)
    accent: string; // 主题强调色
}

// 基础内联样式生成器 - 增强版本
const createInlineStyles = (config: any) => ({
    h1: `display: block; font-size: 28px; font-weight: 700; color: ${config.titleColor || COLORS.textPrimary}; margin: 32px 0 20px; text-align: ${config.titleAlign || 'left'}; border-bottom: ${config.titleBorder ? `3px solid ${config.accent}` : 'none'}; padding-bottom: ${config.titleBorder ? '12px' : '0'}; line-height: 1.4; font-family: ${config.fontFamily}; letter-spacing: 0.5px;`,

    h2: `display: block; font-size: 22px; font-weight: 700; color: ${config.titleColor || COLORS.textPrimary}; margin: 28px 0 16px; border-left: ${config.subTitleBorder ? `4px solid ${config.accent}` : 'none'}; padding-left: ${config.subTitleBorder ? '12px' : '0'}; line-height: 1.4; font-family: ${config.fontFamily};`,

    h3: `display: block; font-size: 18px; font-weight: 600; color: ${config.accent}; margin: 24px 0 12px; line-height: 1.4; font-family: ${config.fontFamily};`,

    p: `display: block; font-size: 16px; color: ${config.textColor || COLORS.textPrimary}; line-height: 1.8; margin: 16px 0; text-align: justify; text-justify: inter-ideograph; font-family: ${config.fontFamily}; word-wrap: break-word;`,

    code: `display: inline; background: ${config.codeBg || COLORS.bgCode}; padding: 2px 6px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; color: ${config.accent}; word-break: break-all; border: 1px solid ${config.borderColor || 'transparent'};`,

    pre: `display: block; background: ${config.preBg || '#1E293B'}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; color: ${config.preColor || '#E2E8F0'}; border: 1px solid ${config.borderColor || COLORS.borderDark}; white-space: pre-wrap; word-break: break-all; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`,

    blockquote: `display: block; border-left: 4px solid ${config.accent}; background: ${config.quoteBg || 'rgba(37, 99, 235, 0.05)'}; padding: 16px 20px; margin: 16px 0; color: ${config.quoteColor || COLORS.textSecondary}; border-radius: 0 8px 8px 0; font-style: normal;`,

    ul: `display: block; margin: 16px 0; padding-left: 24px; list-style-type: disc; color: ${config.textColor || COLORS.textPrimary};`,

    ol: `display: block; margin: 16px 0; padding-left: 24px; list-style-type: decimal; color: ${config.textColor || COLORS.textPrimary};`,

    li: `display: list-item; font-size: 16px; line-height: 1.8; margin-bottom: 8px; color: ${config.textColor || COLORS.textPrimary};`,

    img: `display: block; max-width: 100%; height: auto; margin: 20px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); opacity: ${config.imgOpacity || '1'};`,

    hr: `display: block; border: none; border-top: 1px solid ${config.borderColor || COLORS.border}; margin: 32px 0; height: 1px;`,

    table: `border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; border-radius: 8px; overflow: hidden;`,

    th: `border: 1px solid ${config.borderColor || COLORS.border}; padding: 12px; background: ${config.preBg || COLORS.bgCode}; font-weight: 700; color: ${config.titleColor || COLORS.textPrimary}; text-align: left;`,

    td: `border: 1px solid ${config.borderColor || COLORS.border}; padding: 12px; color: ${config.textColor || COLORS.textPrimary};`,

    a: `color: ${config.linkColor || COLORS.primary}; text-decoration: none; border-bottom: 1px dashed ${config.linkColor || COLORS.primary}; font-weight: 500;`
});

// 主题定义 - 全面优化版
export const WECHAT_STYLES: Record<string, ThemeDefinition> = {
    default: {
        name: '清爽简约',
        accent: COLORS.primary,
        css: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.textPrimary}; background: #fff; }
      .wechat-content h1 { font-size: 28px; font-weight: 700; margin: 32px 0 20px; border-bottom: 3px solid ${COLORS.primary}; padding-bottom: 12px; letter-spacing: 0.5px; color: ${COLORS.textPrimary}; }
      .wechat-content h2 { font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.textPrimary}; line-height: 1.4; border-left: 4px solid ${COLORS.primary}; padding-left: 12px; }
      .wechat-content h3 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.primary}; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; color: ${COLORS.textSecondary}; }
      .wechat-content blockquote { border-left: 4px solid ${COLORS.primary}; background: rgba(37, 99, 235, 0.05); padding: 16px 20px; margin: 16px 0; color: ${COLORS.textSecondary}; border-radius: 0 8px 8px 0; }
      .wechat-content code { background: ${COLORS.bgCode}; padding: 2px 6px; border-radius: 4px; color: ${COLORS.primary}; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid ${COLORS.border}; }
      .wechat-content pre { background: #1E293B; padding: 16px; border-radius: 8px; margin: 16px 0; overflow: auto; border: 1px solid ${COLORS.borderDark}; color: #E2E8F0; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block; margin: 20px auto; }
      .wechat-content a { color: ${COLORS.primary}; text-decoration: none; border-bottom: 1px dashed ${COLORS.primary}; font-weight: 500; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; border-radius: 8px; overflow: hidden; }
      .wechat-content th { border: 1px solid ${COLORS.border}; padding: 12px; background: ${COLORS.bgCode}; font-weight: 700; color: ${COLORS.textPrimary}; text-align: left; }
      .wechat-content td { border: 1px solid ${COLORS.border}; padding: 12px; color: ${COLORS.textSecondary}; }
      .wechat-content hr { border: none; border-top: 1px solid ${COLORS.border}; margin: 32px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.darkTextSecondary}; background: ${COLORS.darkBg}; }
      .wechat-content h1 { font-size: 28px; font-weight: 700; margin: 32px 0 20px; border-bottom: 3px solid ${COLORS.darkAccent}; padding-bottom: 12px; color: ${COLORS.darkTextPrimary}; letter-spacing: 0.5px; }
      .wechat-content h2 { font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.darkTextPrimary}; line-height: 1.4; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px; }
      .wechat-content h3 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; color: ${COLORS.darkTextSecondary}; }
      .wechat-content blockquote { border-left: 4px solid ${COLORS.darkAccent}; background: rgba(96, 165, 250, 0.08); padding: 16px 20px; margin: 16px 0; color: ${COLORS.darkTextTertiary}; border-radius: 0 8px 8px 0; }
      .wechat-content code { background: ${COLORS.darkBgSecondary}; padding: 2px 6px; border-radius: 4px; color: ${COLORS.darkAccent}; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid ${COLORS.borderDark}; }
      .wechat-content pre { background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border-radius: 8px; opacity: 0.9; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: block; margin: 20px auto; }
      .wechat-content a { color: ${COLORS.darkAccent}; text-decoration: none; border-bottom: 1px dashed ${COLORS.darkAccent}; font-weight: 500; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; border-radius: 8px; overflow: hidden; }
      .wechat-content th { border: 1px solid ${COLORS.borderDark}; padding: 12px; background: ${COLORS.darkBgSecondary}; font-weight: 700; color: ${COLORS.darkTextPrimary}; text-align: left; }
      .wechat-content td { border: 1px solid ${COLORS.borderDark}; padding: 12px; color: ${COLORS.darkTextSecondary}; }
      .wechat-content hr { border: none; border-top: 1px solid ${COLORS.borderDark}; margin: 32px 0; }
    `,
        rootStyle: `background-color: #fff; padding: 20px 16px; border-radius: 8px;`,
        rootStyleDark: `background-color: ${COLORS.darkBg}; padding: 20px 16px; border-radius: 8px;`,
        inline: {
            ...createInlineStyles({
                accent: COLORS.primary,
                fontFamily: FONTS.standard,
                titleColor: COLORS.textPrimary,
                textColor: COLORS.textSecondary,
                titleBorder: true,
                subTitleBorder: true,
                codeBg: COLORS.bgCode,
                preBg: '#1E293B',
                preColor: '#E2E8F0',
                borderColor: COLORS.border,
                quoteBg: 'rgba(37, 99, 235, 0.05)',
                quoteColor: COLORS.textSecondary,
                linkColor: COLORS.primary
            }),
            h1: `display: block; font-size: 28px; font-weight: 700; margin: 32px 0 20px; border-bottom: 3px solid ${COLORS.primary}; padding-bottom: 12px; line-height: 1.4; color: ${COLORS.textPrimary}; letter-spacing: 0.5px; font-family: ${FONTS.standard};`,
            h2: `display: block; font-size: 22px; font-weight: 700; margin: 28px 0 16px; line-height: 1.4; font-family: ${FONTS.standard}; color: ${COLORS.textPrimary}; border-left: 4px solid ${COLORS.primary}; padding-left: 12px;`,
            h3: `display: block; font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.primary}; line-height: 1.3; font-family: ${FONTS.standard};`,
            pre: `display: block; background: #1E293B; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; border: 1px solid ${COLORS.borderDark}; color: #E2E8F0; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: COLORS.darkAccent,
                fontFamily: FONTS.standard,
                titleColor: COLORS.darkTextPrimary,
                textColor: COLORS.darkTextSecondary,
                titleBorder: true,
                subTitleBorder: true,
                codeBg: COLORS.darkBgSecondary,
                preBg: COLORS.darkBgSecondary,
                preColor: COLORS.darkTextPrimary,
                borderColor: COLORS.borderDark,
                quoteBg: 'rgba(96, 165, 250, 0.08)',
                quoteColor: COLORS.darkTextTertiary,
                linkColor: COLORS.darkAccent,
                imgOpacity: '0.9'
            }),
            h1: `display: block; font-size: 28px; font-weight: 700; margin: 32px 0 20px; border-bottom: 3px solid ${COLORS.darkAccent}; padding-bottom: 12px; line-height: 1.4; color: ${COLORS.darkTextPrimary}; letter-spacing: 0.5px; font-family: ${FONTS.standard};`,
            h2: `display: block; font-size: 22px; font-weight: 700; margin: 28px 0 16px; line-height: 1.4; font-family: ${FONTS.standard}; color: ${COLORS.darkTextPrimary}; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px;`,
            h3: `display: block; font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; line-height: 1.3; font-family: ${FONTS.standard};`,
            pre: `display: block; background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        }
    },

    minimal: {
        name: '极简留白',
        accent: '#1F2937',
        css: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 2.0; color: ${COLORS.textPrimary}; background: #fff; padding: 20px; }
      .wechat-content h1 { font-size: 30px; font-weight: 300; margin: 48px 0 24px; text-align: center; color: #000; letter-spacing: 4px; border-bottom: 1px solid #E5E7EB; padding-bottom: 16px; display: inline-block; width: 100%; font-family: ${FONTS.standard}; }
      .wechat-content h2 { font-size: 22px; font-weight: 500; margin: 36px 0 20px; text-align: left; color: ${COLORS.textPrimary}; letter-spacing: 2px; position: relative; padding-bottom: 10px; }
      .wechat-content h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 60px; height: 2px; background: linear-gradient(90deg, #000 0%, transparent 100%); }
      .wechat-content h3 { font-size: 18px; font-weight: 500; margin: 28px 0 12px; color: ${COLORS.textSecondary}; text-align: left; letter-spacing: 1px; }
      .wechat-content p { font-size: 16px; margin: 24px 0; text-align: justify; color: ${COLORS.textSecondary}; letter-spacing: 0.5px; line-height: 2.0; }
      .wechat-content blockquote { border-left: 2px solid #000; background: transparent; padding: 12px 24px; margin: 24px 0; color: ${COLORS.textTertiary}; font-style: italic; }
      .wechat-content code { background: #F3F4F6; padding: 2px 8px; border-radius: 3px; color: ${COLORS.textPrimary}; font-family: ${FONTS.code}; font-size: 14px; letter-spacing: 0.5px; }
      .wechat-content pre { background: #F9FAFB; padding: 24px; border-radius: 4px; margin: 24px 0; overflow: auto; border: 1px solid #E5E7EB; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; color: ${COLORS.textSecondary}; }
      .wechat-content pre code { background: transparent; padding: 0; border: none; color: inherit; }
      .wechat-content img { max-width: 100%; display: block; margin: 32px auto; border-radius: 4px; }
      .wechat-content a { color: ${COLORS.textPrimary}; text-decoration: none; border-bottom: 1px solid ${COLORS.textTertiary}; padding-bottom: 1px; }
      .wechat-content hr { border: none; border-top: 1px solid #E5E7EB; margin: 40px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 2.0; color: ${COLORS.darkTextSecondary}; background: ${COLORS.darkBg}; padding: 20px; }
      .wechat-content h1 { font-size: 30px; font-weight: 300; margin: 48px 0 24px; text-align: center; color: ${COLORS.darkTextPrimary}; letter-spacing: 3px; border-bottom: 1px solid ${COLORS.borderDark}; padding-bottom: 16px; display: inline-block; width: 100%; font-family: ${FONTS.standard}; }
      .wechat-content h2 { font-size: 22px; font-weight: 500; margin: 36px 0 20px; color: ${COLORS.darkTextPrimary}; text-align: left; letter-spacing: 1px; position: relative; padding-bottom: 10px; }
      .wechat-content h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 60px; height: 2px; background: linear-gradient(90deg, ${COLORS.darkTextPrimary} 0%, transparent 100%); }
      .wechat-content h3 { font-size: 18px; font-weight: 500; margin: 28px 0 12px; color: ${COLORS.darkTextSecondary}; text-align: left; letter-spacing: 1px; }
      .wechat-content p { font-size: 16px; margin: 24px 0; text-align: justify; color: ${COLORS.darkTextSecondary}; letter-spacing: 0.5px; line-height: 2.0; }
      .wechat-content blockquote { border-left: 2px solid ${COLORS.darkTextTertiary}; background: transparent; padding: 12px 24px; margin: 24px 0; color: ${COLORS.darkTextTertiary}; font-style: italic; }
      .wechat-content code { background: ${COLORS.darkBgSecondary}; padding: 2px 8px; border-radius: 3px; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 14px; letter-spacing: 0.5px; }
      .wechat-content pre { background: ${COLORS.darkBgSecondary}; padding: 24px; border-radius: 4px; margin: 24px 0; overflow: auto; border: 1px solid ${COLORS.borderDark}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; color: ${COLORS.darkTextSecondary}; }
      .wechat-content pre code { background: transparent; padding: 0; border: none; color: inherit; }
      .wechat-content img { max-width: 100%; display: block; margin: 32px auto; border-radius: 4px; opacity: 0.9; }
      .wechat-content a { color: ${COLORS.darkTextPrimary}; text-decoration: none; border-bottom: 1px solid ${COLORS.darkTextTertiary}; padding-bottom: 1px; }
      .wechat-content hr { border: none; border-top: 1px solid ${COLORS.borderDark}; margin: 40px 0; }
    `,
        rootStyle: `background-color: #fff; padding: 20px;`,
        rootStyleDark: `background-color: ${COLORS.darkBg}; padding: 20px;`,
        inline: {
            ...createInlineStyles({
                accent: '#1F2937',
                fontFamily: FONTS.standard,
                titleColor: '#000',
                textColor: COLORS.textSecondary,
                titleAlign: 'center',
                titleBorder: true,
                subTitleBorder: false,
                codeBg: '#F3F4F6',
                preBg: '#F9FAFB',
                preColor: COLORS.textSecondary,
                borderColor: COLORS.border,
                quoteBg: 'transparent',
                quoteColor: COLORS.textTertiary,
                linkColor: COLORS.textPrimary
            }),
            h1: `display: block; font-size: 30px; font-weight: 300; color: #000; margin: 48px 0 24px; text-align: center; letter-spacing: 4px; line-height: 1.4; font-family: ${FONTS.standard}; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 16px;`,
            h2: `display: block; font-size: 22px; font-weight: 500; color: ${COLORS.textPrimary}; margin: 36px 0 20px; text-align: left; letter-spacing: 2px; line-height: 1.4; font-family: ${FONTS.standard}; padding-bottom: 10px; background-image: linear-gradient(90deg, #000 0%, transparent 100%); background-size: 60px 2px; background-repeat: no-repeat; background-position: left bottom;`,
            h3: `display: block; font-size: 18px; font-weight: 500; margin: 28px 0 12px; color: ${COLORS.textSecondary}; text-align: left; letter-spacing: 1px; line-height: 1.4; font-family: ${FONTS.standard};`,
            p: `display: block; font-size: 16px; color: ${COLORS.textSecondary}; line-height: 2.0; margin: 24px 0; text-align: justify; letter-spacing: 0.5px; font-family: ${FONTS.standard};`,
            blockquote: `display: block; border-left: 2px solid #000; background: transparent; padding: 12px 24px; margin: 24px 0; color: ${COLORS.textTertiary}; font-family: ${FONTS.standard}; font-style: italic;`,
            pre: `display: block; background: #F9FAFB; padding: 24px; border-radius: 4px; margin: 24px 0; overflow-x: auto; border: 1px solid ${COLORS.border}; color: ${COLORS.textSecondary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all;`,
            a: `color: ${COLORS.textPrimary}; text-decoration: none; border-bottom: 1px solid ${COLORS.textTertiary}; padding-bottom: 1px;`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: COLORS.darkTextPrimary,
                fontFamily: FONTS.standard,
                titleColor: COLORS.darkTextPrimary,
                textColor: COLORS.darkTextSecondary,
                titleAlign: 'center',
                titleBorder: true,
                subTitleBorder: false,
                codeBg: COLORS.darkBgSecondary,
                preBg: COLORS.darkBgSecondary,
                preColor: COLORS.darkTextSecondary,
                borderColor: COLORS.borderDark,
                quoteBg: 'transparent',
                quoteColor: COLORS.darkTextTertiary,
                linkColor: COLORS.darkTextPrimary,
                imgOpacity: '0.9'
            }),
            h1: `display: block; font-size: 30px; font-weight: 300; color: ${COLORS.darkTextPrimary}; margin: 48px 0 24px; text-align: center; letter-spacing: 3px; line-height: 1.4; font-family: ${FONTS.standard}; border-bottom: 1px solid ${COLORS.borderDark}; padding-bottom: 16px;`,
            h2: `display: block; font-size: 22px; font-weight: 500; color: ${COLORS.darkTextPrimary}; margin: 36px 0 20px; text-align: left; letter-spacing: 1px; line-height: 1.4; font-family: ${FONTS.standard}; padding-bottom: 10px; background-image: linear-gradient(90deg, ${COLORS.darkTextPrimary} 0%, transparent 100%); background-size: 60px 2px; background-repeat: no-repeat; background-position: left bottom;`,
            h3: `display: block; font-size: 18px; font-weight: 500; margin: 28px 0 12px; color: ${COLORS.darkTextSecondary}; text-align: left; letter-spacing: 1px; line-height: 1.4; font-family: ${FONTS.standard};`,
            p: `display: block; font-size: 16px; color: ${COLORS.darkTextSecondary}; line-height: 2.0; margin: 24px 0; text-align: justify; letter-spacing: 0.5px; font-family: ${FONTS.standard};`,
            blockquote: `display: block; border-left: 2px solid ${COLORS.darkTextTertiary}; background: transparent; padding: 12px 24px; margin: 24px 0; color: ${COLORS.darkTextTertiary}; font-family: ${FONTS.standard}; font-style: italic;`,
            pre: `display: block; background: ${COLORS.darkBgSecondary}; padding: 24px; border-radius: 4px; margin: 24px 0; overflow-x: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextSecondary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all;`,
            a: `color: ${COLORS.darkTextPrimary}; text-decoration: none; border-bottom: 1px solid ${COLORS.darkTextTertiary}; padding-bottom: 1px;`,
        }
    },

    night: {
        name: '夜幕墨黑',
        accent: '#60A5FA',
        css: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.darkTextSecondary}; background: ${COLORS.darkBg}; padding: 20px; }
      .wechat-content h1 { font-size: 28px; font-weight: 700; margin: 32px 0 20px; color: ${COLORS.darkTextPrimary}; border-bottom: 2px solid ${COLORS.darkAccent}; padding-bottom: 12px; letter-spacing: 1px; }
      .wechat-content h2 { font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.darkTextPrimary}; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px; }
      .wechat-content h3 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; border-bottom: 1px dotted ${COLORS.darkAccent}; padding-bottom: 4px; display: inline-block; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; color: ${COLORS.darkTextSecondary}; }
      .wechat-content blockquote { border-left: 4px solid ${COLORS.darkAccent}; background: rgba(96, 165, 250, 0.08); padding: 16px 20px; margin: 16px 0; color: ${COLORS.darkTextTertiary}; border-radius: 0 8px 8px 0; }
      .wechat-content code { background: ${COLORS.darkBgSecondary}; padding: 2px 6px; border-radius: 4px; color: ${COLORS.darkAccent}; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid ${COLORS.borderDark}; }
      .wechat-content pre { background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border-radius: 8px; opacity: 0.9; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      .wechat-content a { color: ${COLORS.darkAccent}; text-decoration: none; border-bottom: 1px dashed ${COLORS.darkAccent}; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
      .wechat-content th { border: 1px solid ${COLORS.borderDark}; padding: 12px; background: ${COLORS.darkBgSecondary}; font-weight: 700; color: ${COLORS.darkTextPrimary}; text-align: left; }
      .wechat-content td { border: 1px solid ${COLORS.borderDark}; padding: 12px; color: ${COLORS.darkTextSecondary}; }
      .wechat-content hr { border: none; border-top: 1px solid ${COLORS.borderDark}; margin: 32px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.darkTextSecondary}; background: ${COLORS.darkBg}; padding: 20px; }
      .wechat-content h1 { font-size: 28px; font-weight: 700; margin: 32px 0 20px; color: ${COLORS.darkTextPrimary}; border-bottom: 2px solid ${COLORS.darkAccent}; padding-bottom: 12px; letter-spacing: 1px; }
      .wechat-content h2 { font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.darkTextPrimary}; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px; }
      .wechat-content h3 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; border-bottom: 1px dotted ${COLORS.darkAccent}; padding-bottom: 4px; display: inline-block; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; color: ${COLORS.darkTextSecondary}; }
      .wechat-content blockquote { border-left: 4px solid ${COLORS.darkAccent}; background: rgba(96, 165, 250, 0.08); padding: 16px 20px; margin: 16px 0; color: ${COLORS.darkTextTertiary}; border-radius: 0 8px 8px 0; }
      .wechat-content code { background: ${COLORS.darkBgSecondary}; padding: 2px 6px; border-radius: 4px; color: ${COLORS.darkAccent}; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid ${COLORS.borderDark}; }
      .wechat-content pre { background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border-radius: 8px; opacity: 0.9; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      .wechat-content a { color: ${COLORS.darkAccent}; text-decoration: none; border-bottom: 1px dashed ${COLORS.darkAccent}; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
      .wechat-content th { border: 1px solid ${COLORS.borderDark}; padding: 12px; background: ${COLORS.darkBgSecondary}; font-weight: 700; color: ${COLORS.darkTextPrimary}; text-align: left; }
      .wechat-content td { border: 1px solid ${COLORS.borderDark}; padding: 12px; color: ${COLORS.darkTextSecondary}; }
      .wechat-content hr { border: none; border-top: 1px solid ${COLORS.borderDark}; margin: 32px 0; }
    `,
        rootStyle: `background-color: ${COLORS.darkBg}; padding: 20px 16px; border-radius: 8px;`,
        rootStyleDark: `background-color: ${COLORS.darkBg}; padding: 20px 16px; border-radius: 8px;`,
        inline: {
            ...createInlineStyles({
                accent: COLORS.darkAccent,
                fontFamily: FONTS.standard,
                titleColor: COLORS.darkTextPrimary,
                textColor: COLORS.darkTextSecondary,
                linkColor: COLORS.darkAccent,
                titleBorder: true,
                subTitleBorder: true,
                codeBg: COLORS.darkBgSecondary,
                preBg: COLORS.darkBgSecondary,
                preColor: COLORS.darkTextPrimary,
                borderColor: COLORS.borderDark,
                quoteBg: 'rgba(96, 165, 250, 0.08)',
                quoteColor: COLORS.darkTextTertiary
            }),
            h1: `display: block; font-size: 28px; font-weight: 700; margin: 32px 0 20px; color: ${COLORS.darkTextPrimary}; border-bottom: 2px solid ${COLORS.darkAccent}; padding-bottom: 12px; line-height: 1.4; letter-spacing: 1px;`,
            h2: `display: block; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.darkTextPrimary}; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px; line-height: 1.4;`,
            h3: `display: inline-block; font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; border-bottom: 1px dotted ${COLORS.darkAccent}; padding-bottom: 4px; line-height: 1.4;`,
            pre: `display: block; background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: COLORS.darkAccent,
                fontFamily: FONTS.standard,
                titleColor: COLORS.darkTextPrimary,
                textColor: COLORS.darkTextSecondary,
                linkColor: COLORS.darkAccent,
                titleBorder: true,
                subTitleBorder: true,
                codeBg: COLORS.darkBgSecondary,
                preBg: COLORS.darkBgSecondary,
                preColor: COLORS.darkTextPrimary,
                borderColor: COLORS.borderDark,
                quoteBg: 'rgba(96, 165, 250, 0.08)',
                quoteColor: COLORS.darkTextTertiary,
                imgOpacity: '0.9'
            }),
            h1: `display: block; font-size: 28px; font-weight: 700; margin: 32px 0 20px; color: ${COLORS.darkTextPrimary}; border-bottom: 2px solid ${COLORS.darkAccent}; padding-bottom: 12px; line-height: 1.4; letter-spacing: 1px;`,
            h2: `display: block; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: ${COLORS.darkTextPrimary}; border-left: 4px solid ${COLORS.darkAccent}; padding-left: 12px; line-height: 1.4;`,
            h3: `display: inline-block; font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: ${COLORS.darkAccent}; border-bottom: 1px dotted ${COLORS.darkAccent}; padding-bottom: 4px; line-height: 1.4;`,
            pre: `display: block; background: ${COLORS.darkBgSecondary}; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; border: 1px solid ${COLORS.borderDark}; color: ${COLORS.darkTextPrimary}; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        }
    },

    elegant: {
        name: '杂志雅致',
        accent: '#78350F',
        css: `
      .wechat-content { font-family: ${FONTS.serif}; line-height: 2.0; color: #292524; background: #FDFCF9; padding: 24px; }
      .wechat-content h1 { font-family: ${FONTS.serif}; font-size: 30px; font-weight: 700; margin: 40px 0 24px; text-align: center; color: #451a03; letter-spacing: 3px; border-top: 3px double #78350F; border-bottom: 3px double #78350F; padding: 16px 0; }
      .wechat-content h2 { font-family: ${FONTS.serif}; font-size: 24px; font-weight: 600; margin: 36px 0 20px; text-align: center; color: #451a03; position: relative; padding-bottom: 12px; }
      .wechat-content h2::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #78350F, transparent); }
      .wechat-content h3 { font-size: 19px; font-weight: 600; margin: 28px 0 14px; color: #78350F; text-align: center; font-style: italic; }
      .wechat-content p { font-size: 17px; margin: 24px 0; text-align: justify; text-indent: 2em; letter-spacing: 0.3px; color: #44403C; line-height: 2.0; }
      .wechat-content blockquote { border: none; background: linear-gradient(135deg, #F5F5F4 0%, #FAFAF9 100%); padding: 24px 32px; margin: 32px 0; font-family: ${FONTS.serif}; color: #78716C; font-style: italic; text-align: center; font-size: 18px; border-radius: 8px; border-left: 3px solid #A8A29E; }
      .wechat-content code { background: #F5F5F4; padding: 2px 8px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; color: #78350F; border: 1px solid #E7E5E4; }
      .wechat-content pre { background: #FAFAF9; padding: 20px; border-radius: 8px; margin: 24px 0; overflow-x: auto; border: 1px solid #E7E5E4; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; color: #57534E; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; margin: 28px auto; display: block; border: 8px solid #fff; box-shadow: 0 8px 24px rgba(120, 53, 15, 0.12); }
      .wechat-content a { color: #92400E; text-decoration: none; border-bottom: 1px solid #A8A29E; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 15px; }
      .wechat-content th { border: 1px solid #E7E5E4; padding: 12px; background: #F5F5F4; font-weight: 600; color: #451a03; font-family: ${FONTS.serif}; }
      .wechat-content td { border: 1px solid #E7E5E4; padding: 12px; color: #57534E; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.serif}; line-height: 2.0; color: #D6D3D1; background: #1C1917; padding: 24px; }
      .wechat-content h1 { font-family: ${FONTS.serif}; font-size: 30px; font-weight: 700; margin: 40px 0 24px; text-align: center; color: #E7E5E4; letter-spacing: 2px; border-top: 3px double #A8A29E; border-bottom: 3px double #A8A29E; padding: 16px 0; }
      .wechat-content h2 { font-family: ${FONTS.serif}; font-size: 24px; font-weight: 600; margin: 36px 0 20px; text-align: center; color: #E7E5E4; position: relative; padding-bottom: 12px; }
      .wechat-content h2::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #A8A29E, transparent); }
      .wechat-content h3 { font-size: 19px; font-weight: 600; margin: 28px 0 14px; color: #A8A29E; text-align: center; font-style: italic; }
      .wechat-content p { font-size: 17px; margin: 24px 0; text-align: justify; text-indent: 2em; letter-spacing: 0.3px; color: #D6D3D1; line-height: 2.0; }
      .wechat-content blockquote { border: none; background: linear-gradient(135deg, #292524 0%, #1C1917 100%); padding: 24px 32px; margin: 32px 0; font-family: ${FONTS.serif}; color: #A8A29E; font-style: italic; text-align: center; font-size: 18px; border-radius: 8px; border-left: 3px solid #78716C; }
      .wechat-content code { background: #292524; padding: 2px 8px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; color: #D97706; border: 1px solid #44403C; }
      .wechat-content pre { background: #292524; padding: 20px; border-radius: 8px; margin: 24px 0; overflow-x: auto; border: 1px solid #44403C; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.7; color: #D6D3D1; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; margin: 28px auto; display: block; border: 8px solid #292524; box-shadow: 0 8px 24px rgba(0,0,0,0.4); opacity: 0.95; }
      .wechat-content a { color: #D97706; text-decoration: none; border-bottom: 1px solid #78716C; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 15px; }
      .wechat-content th { border: 1px solid #44403C; padding: 12px; background: #292524; font-weight: 600; color: #E7E5E4; font-family: ${FONTS.serif}; }
      .wechat-content td { border: 1px solid #44403C; padding: 12px; color: #D6D3D1; }
    `,
        rootStyle: `background-color: #FDFCF9; padding: 24px;`,
        rootStyleDark: `background-color: #1C1917; padding: 24px;`,
        inline: {
            ...createInlineStyles({
                accent: '#78350F',
                fontFamily: FONTS.serif,
                titleColor: '#451a03',
                textColor: '#44403C',
                titleAlign: 'center',
                codeBg: '#F5F5F4',
                preBg: '#FAFAF9',
                preColor: '#57534E',
                borderColor: '#E7E5E4',
                quoteBg: 'linear-gradient(135deg, #F5F5F4 0%, #FAFAF9 100%)',
                quoteColor: '#78716C',
                linkColor: '#92400E'
            }),
            h1: `display: block; font-family: ${FONTS.serif}; font-size: 30px; font-weight: 700; margin: 40px 0 24px; text-align: center; color: #451a03; letter-spacing: 3px; border-top: 3px double #78350F; border-bottom: 3px double #78350F; padding: 16px 0; line-height: 1.4;`,
            h2: `display: block; font-family: ${FONTS.serif}; font-size: 24px; font-weight: 600; margin: 36px 0 20px; text-align: center; color: #451a03; line-height: 1.4; padding-bottom: 12px; background-image: linear-gradient(90deg, transparent, #78350F, transparent); background-size: 80px 1px; background-repeat: no-repeat; background-position: center bottom;`,
            h3: `display: block; font-size: 19px; font-weight: 600; margin: 28px 0 14px; color: #78350F; text-align: center; font-style: italic; line-height: 1.4; font-family: ${FONTS.serif};`,
            p: `display: block; font-size: 17px; margin: 24px 0; text-align: justify; text-indent: 2em; letter-spacing: 0.3px; color: #44403C; line-height: 2.0; font-family: ${FONTS.serif};`,
            blockquote: `display: block; border: none; background: #F5F5F4; padding: 24px 32px; margin: 32px 0; font-family: ${FONTS.serif}; color: #78716C; font-style: italic; text-align: center; font-size: 18px; border-radius: 8px; border-left: 3px solid #A8A29E;`,
            img: `display: block; max-width: 100%; margin: 28px auto; border: 8px solid #fff; box-shadow: 0 8px 24px rgba(120, 53, 15, 0.12);`,
            th: `border: 1px solid #E7E5E4; padding: 12px; background: #F5F5F4; font-weight: 600; color: #451a03; font-family: ${FONTS.serif};`,
            td: `border: 1px solid #E7E5E4; padding: 12px; color: #57534E;`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: '#D97706',
                fontFamily: FONTS.serif,
                titleColor: '#E7E5E4',
                textColor: '#D6D3D1',
                titleAlign: 'center',
                codeBg: '#292524',
                preBg: '#292524',
                preColor: '#D6D3D1',
                borderColor: '#44403C',
                quoteBg: '#292524',
                quoteColor: '#A8A29E',
                linkColor: '#D97706',
                imgOpacity: '0.95'
            }),
            h1: `display: block; font-family: ${FONTS.serif}; font-size: 30px; font-weight: 700; margin: 40px 0 24px; text-align: center; color: #E7E5E4; letter-spacing: 2px; border-top: 3px double #A8A29E; border-bottom: 3px double #A8A29E; padding: 16px 0; line-height: 1.4;`,
            h2: `display: block; font-family: ${FONTS.serif}; font-size: 24px; font-weight: 600; margin: 36px 0 20px; text-align: center; color: #E7E5E4; line-height: 1.4; padding-bottom: 12px; background-image: linear-gradient(90deg, transparent, #A8A29E, transparent); background-size: 80px 1px; background-repeat: no-repeat; background-position: center bottom;`,
            h3: `display: block; font-size: 19px; font-weight: 600; margin: 28px 0 14px; color: #A8A29E; text-align: center; font-style: italic; line-height: 1.4; font-family: ${FONTS.serif};`,
            p: `display: block; font-size: 17px; margin: 24px 0; text-align: justify; text-indent: 2em; letter-spacing: 0.3px; color: #D6D3D1; line-height: 2.0; font-family: ${FONTS.serif};`,
            blockquote: `display: block; border: none; background: #292524; padding: 24px 32px; margin: 32px 0; font-family: ${FONTS.serif}; color: #A8A29E; font-style: italic; text-align: center; font-size: 18px; border-radius: 8px; border-left: 3px solid #78716C;`,
            img: `display: block; max-width: 100%; margin: 28px auto; border: 8px solid #292524; box-shadow: 0 8px 24px rgba(0,0,0,0.4); opacity: 0.95;`,
            th: `border: 1px solid #44403C; padding: 12px; background: #292524; font-weight: 600; color: #E7E5E4; font-family: ${FONTS.serif};`,
            td: `border: 1px solid #44403C; padding: 12px; color: #D6D3D1;`,
        }
    },

    print: {
        name: '复古书刊',
        accent: '#92400E',
        css: `
      .wechat-content { font-family: ${FONTS.serif}; line-height: 1.9; color: #292524; background: #FFFBEB; padding: 24px; border: 1px solid #FDE68A; }
      .wechat-content h1 { font-family: ${FONTS.serif}; font-size: 28px; font-weight: 700; margin: 36px 0 20px; text-align: center; color: #78350F; border-bottom: 2px solid #D97706; padding-bottom: 16px; letter-spacing: 2px; }
      .wechat-content h2 { font-family: ${FONTS.serif}; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: #78350F; text-align: center; border-bottom: 1px dashed #D97706; padding-bottom: 10px; position: relative; }
      .wechat-content h2::before { content: '❧'; position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); background: #FFFBEB; padding: 0 12px; color: #D97706; font-size: 14px; }
      .wechat-content h3 { font-size: 18px; font-weight: 700; margin: 24px 0 12px; color: #92400E; border-left: 3px solid #D97706; padding-left: 12px; }
      .wechat-content p { font-size: 16px; margin: 18px 0; text-align: justify; text-indent: 2em; color: #44403C; line-height: 1.9; }
      .wechat-content blockquote { border: 2px solid #D97706; background: #FEF3C7; padding: 16px 20px; margin: 24px 0; color: #92400E; border-radius: 4px; box-shadow: 3px 3px 0 #FDE68A; }
      .wechat-content code { background: #FEF3C7; padding: 2px 6px; border-radius: 3px; font-family: ${FONTS.code}; font-size: 14px; color: #92400E; border: 1px solid #FDE68A; }
      .wechat-content pre { background: #FEF3C7; padding: 16px; border-radius: 4px; margin: 20px 0; overflow-x: auto; border: 2px solid #F59E0B; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; color: #78350F; box-shadow: 2px 2px 0 #FDE68A; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border: 4px double #D97706; padding: 4px; margin: 24px auto; display: block; background: #fff; }
      .wechat-content a { color: #92400E; text-decoration: underline; font-weight: 500; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; border: 2px solid #D97706; }
      .wechat-content th { border: 1px solid #FDE68A; padding: 10px; background: #FEF3C7; font-weight: 700; color: #78350F; }
      .wechat-content td { border: 1px solid #FDE68A; padding: 10px; color: #57534E; }
      .wechat-content hr { border: none; border-top: 1px dashed #D97706; margin: 28px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.serif}; line-height: 1.9; color: #D6D3D1; background: #292524; padding: 24px; border: 1px solid #44403C; }
      .wechat-content h1 { font-family: ${FONTS.serif}; font-size: 28px; font-weight: 700; margin: 36px 0 20px; text-align: center; color: #E7E5E4; border-bottom: 2px solid #D97706; padding-bottom: 16px; letter-spacing: 2px; }
      .wechat-content h2 { font-family: ${FONTS.serif}; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: #E7E5E4; text-align: center; border-bottom: 1px dashed #D97706; padding-bottom: 10px; position: relative; }
      .wechat-content h2::before { content: '❧'; position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); background: #292524; padding: 0 12px; color: #D97706; font-size: 14px; }
      .wechat-content h3 { font-size: 18px; font-weight: 700; margin: 24px 0 12px; color: #F59E0B; border-left: 3px solid #D97706; padding-left: 12px; }
      .wechat-content p { font-size: 16px; margin: 18px 0; text-align: justify; text-indent: 2em; color: #D6D3D1; line-height: 1.9; }
      .wechat-content blockquote { border: 2px solid #D97706; background: #1C1917; padding: 16px 20px; margin: 24px 0; color: #D97706; border-radius: 4px; box-shadow: 3px 3px 0 #44403C; }
      .wechat-content code { background: #1C1917; padding: 2px 6px; border-radius: 3px; font-family: ${FONTS.code}; font-size: 14px; color: #F59E0B; border: 1px solid #44403C; }
      .wechat-content pre { background: #1C1917; padding: 16px; border-radius: 4px; margin: 20px 0; overflow-x: auto; border: 2px solid #78350F; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; color: #D6D3D1; box-shadow: 2px 2px 0 #44403C; }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content img { max-width: 100%; border: 4px double #D97706; padding: 4px; margin: 24px auto; display: block; background: #1C1917; opacity: 0.9; }
      .wechat-content a { color: #F59E0B; text-decoration: underline; font-weight: 500; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; border: 2px solid #D97706; }
      .wechat-content th { border: 1px solid #44403C; padding: 10px; background: #1C1917; font-weight: 700; color: #E7E5E4; }
      .wechat-content td { border: 1px solid #44403C; padding: 10px; color: #D6D3D1; }
      .wechat-content hr { border: none; border-top: 1px dashed #D97706; margin: 28px 0; }
    `,
        rootStyle: `background-color: #FFFBEB; padding: 24px; border: 1px solid #FDE68A; border-radius: 4px;`,
        rootStyleDark: `background-color: #292524; padding: 24px; border: 1px solid #44403C; border-radius: 4px;`,
        inline: {
            ...createInlineStyles({
                accent: '#92400E',
                fontFamily: FONTS.serif,
                textColor: '#44403C',
                titleColor: '#78350F',
                titleAlign: 'center',
                titleBorder: true,
                codeBg: '#FEF3C7',
                preBg: '#FEF3C7',
                preColor: '#78350F',
                borderColor: '#FDE68A',
                quoteBg: '#FEF3C7',
                quoteColor: '#92400E',
                linkColor: '#92400E'
            }),
            h1: `display: block; font-family: ${FONTS.serif}; font-size: 28px; font-weight: 700; margin: 36px 0 20px; text-align: center; color: #78350F; border-bottom: 2px solid #D97706; padding-bottom: 16px; line-height: 1.4; letter-spacing: 2px;`,
            h2: `display: block; font-family: ${FONTS.serif}; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: #78350F; text-align: center; border-bottom: 1px dashed #D97706; padding-bottom: 10px; line-height: 1.4;`,
            h3: `display: block; font-size: 18px; font-weight: 700; margin: 24px 0 12px; color: #92400E; border-left: 3px solid #D97706; padding-left: 12px; line-height: 1.4; font-family: ${FONTS.serif};`,
            p: `display: block; font-size: 16px; margin: 18px 0; line-height: 1.9; text-align: justify; text-indent: 2em; font-family: ${FONTS.serif}; color: #44403C;`,
            blockquote: `display: block; border: 2px solid #D97706; background: #FEF3C7; padding: 16px 20px; margin: 24px 0; color: #92400E; border-radius: 4px; box-shadow: 3px 3px 0 #FDE68A; font-family: ${FONTS.serif};`,
            img: `display: block; max-width: 100%; border: 4px double #D97706; padding: 4px; margin: 24px auto; background: #fff;`,
            th: `border: 1px solid #FDE68A; padding: 10px; background: #FEF3C7; font-weight: 700; color: #78350F; font-family: ${FONTS.serif};`,
            td: `border: 1px solid #FDE68A; padding: 10px; color: #57534E;`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: '#D97706',
                fontFamily: FONTS.serif,
                textColor: '#D6D3D1',
                titleColor: '#E7E5E4',
                titleAlign: 'center',
                titleBorder: true,
                codeBg: '#1C1917',
                preBg: '#1C1917',
                preColor: '#D6D3D1',
                borderColor: '#44403C',
                quoteBg: '#1C1917',
                quoteColor: '#D97706',
                linkColor: '#F59E0B',
                imgOpacity: '0.9'
            }),
            h1: `display: block; font-family: ${FONTS.serif}; font-size: 28px; font-weight: 700; margin: 36px 0 20px; text-align: center; color: #E7E5E4; border-bottom: 2px solid #D97706; padding-bottom: 16px; line-height: 1.4; letter-spacing: 2px;`,
            h2: `display: block; font-family: ${FONTS.serif}; font-size: 22px; font-weight: 700; margin: 28px 0 16px; color: #E7E5E4; text-align: center; border-bottom: 1px dashed #D97706; padding-bottom: 10px; line-height: 1.4;`,
            h3: `display: block; font-size: 18px; font-weight: 700; margin: 24px 0 12px; color: #F59E0B; border-left: 3px solid #D97706; padding-left: 12px; line-height: 1.4; font-family: ${FONTS.serif};`,
            p: `display: block; font-size: 16px; margin: 18px 0; line-height: 1.9; text-align: justify; text-indent: 2em; font-family: ${FONTS.serif}; color: #D6D3D1;`,
            blockquote: `display: block; border: 2px solid #D97706; background: #1C1917; padding: 16px 20px; margin: 24px 0; color: #D97706; border-radius: 4px; box-shadow: 3px 3px 0 #44403C; font-family: ${FONTS.serif};`,
            img: `display: block; max-width: 100%; border: 4px double #D97706; padding: 4px; margin: 24px auto; background: #1C1917; opacity: 0.9;`,
            th: `border: 1px solid #44403C; padding: 10px; background: #1C1917; font-weight: 700; color: #E7E5E4; font-family: ${FONTS.serif};`,
            td: `border: 1px solid #44403C; padding: 10px; color: #D6D3D1;`,
        }
    },

    card: {
        name: '卡片笔记',
        accent: '#10B981',
        css: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.textPrimary}; background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); padding: 24px; border-radius: 12px; }
      .wechat-content h1 { font-size: 26px; font-weight: 700; margin: 28px 0 20px; text-align: center; color: ${COLORS.textPrimary}; border-bottom: 2px solid #10B981; padding-bottom: 14px; background: #fff; border-radius: 8px; padding: 12px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
      .wechat-content h2 { font-size: 20px; font-weight: 700; margin: 24px 0 16px; display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: #fff; border-radius: 24px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
      .wechat-content h3 { font-size: 18px; font-weight: 700; margin: 20px 0 12px; color: #059669; border-left: 4px solid #10B981; padding-left: 12px; background: #fff; padding: 8px 12px; border-radius: 0 6px 6px 0; }
      .wechat-content p { background: #fff; padding: 16px 20px; border-radius: 10px; margin: 14px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #D1FAE5; text-align: justify; color: ${COLORS.textSecondary}; }
      .wechat-content blockquote { background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-left: 4px solid #10B981; padding: 16px 20px; margin: 16px 0; border-radius: 0 10px 10px 0; color: #047857; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
      .wechat-content code { background: #D1FAE5; padding: 2px 8px; border-radius: 6px; font-family: ${FONTS.code}; font-size: 14px; color: #047857; border: 1px solid #6EE7B7; }
      .wechat-content pre { background: #fff; padding: 18px; border-radius: 10px; margin: 16px 0; overflow-x: auto; border: 2px solid #10B981; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; color: ${COLORS.textPrimary}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content ul, .wechat-content ol { background: #fff; padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #D1FAE5; }
      .wechat-content li { margin-bottom: 8px; color: ${COLORS.textSecondary}; }
      .wechat-content img { max-width: 100%; border-radius: 10px; margin: 18px auto; display: block; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 2px solid #D1FAE5; }
      .wechat-content a { color: #059669; text-decoration: none; border-bottom: 1px dashed #059669; font-weight: 500; }
      .wechat-content hr { border: none; border-top: 2px dashed #A7F3D0; margin: 28px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.darkTextSecondary}; background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); padding: 24px; border-radius: 12px; }
      .wechat-content h1 { font-size: 26px; font-weight: 700; margin: 28px 0 20px; text-align: center; color: ${COLORS.darkTextPrimary}; border-bottom: 2px solid #34D399; padding-bottom: 14px; background: rgba(6, 78, 59, 0.6); border-radius: 8px; padding: 12px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      .wechat-content h2 { font-size: 20px; font-weight: 700; margin: 24px 0 16px; display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #fff; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      .wechat-content h3 { font-size: 18px; font-weight: 700; margin: 20px 0 12px; color: #6EE7B7; border-left: 4px solid #34D399; padding-left: 12px; background: rgba(6, 78, 59, 0.4); padding: 8px 12px; border-radius: 0 6px 6px 0; }
      .wechat-content p { background: rgba(6, 78, 59, 0.4); padding: 16px 20px; border-radius: 10px; margin: 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid #047857; text-align: justify; color: ${COLORS.darkTextSecondary}; }
      .wechat-content blockquote { background: linear-gradient(135deg, rgba(6, 95, 70, 0.6) 0%, rgba(5, 150, 105, 0.3) 100%); border-left: 4px solid #34D399; padding: 16px 20px; margin: 16px 0; border-radius: 0 10px 10px 0; color: #A7F3D0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      .wechat-content code { background: rgba(5, 150, 105, 0.3); padding: 2px 8px; border-radius: 6px; font-family: ${FONTS.code}; font-size: 14px; color: #6EE7B7; border: 1px solid #059669; }
      .wechat-content pre { background: rgba(6, 78, 59, 0.6); padding: 18px; border-radius: 10px; margin: 16px 0; overflow-x: auto; border: 2px solid #34D399; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; color: ${COLORS.darkTextSecondary}; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      .wechat-content pre code { background: transparent; border: none; padding: 0; color: inherit; }
      .wechat-content ul, .wechat-content ol { background: rgba(6, 78, 59, 0.4); padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid #047857; color: ${COLORS.darkTextSecondary}; }
      .wechat-content li { margin-bottom: 8px; color: ${COLORS.darkTextSecondary}; }
      .wechat-content img { max-width: 100%; border-radius: 10px; margin: 18px auto; display: block; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 2px solid #047857; opacity: 0.95; }
      .wechat-content a { color: #6EE7B7; text-decoration: none; border-bottom: 1px dashed #6EE7B7; font-weight: 500; }
      .wechat-content hr { border: none; border-top: 2px dashed #059669; margin: 28px 0; }
    `,
        rootStyle: `background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); padding: 24px; border-radius: 12px;`,
        rootStyleDark: `background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); padding: 24px; border-radius: 12px;`,
        inline: {
            ...createInlineStyles({
                accent: '#10B981',
                fontFamily: FONTS.standard,
                titleColor: COLORS.textPrimary,
                textColor: COLORS.textSecondary,
                titleAlign: 'center',
                codeBg: '#D1FAE5',
                preBg: '#fff',
                preColor: COLORS.textPrimary,
                borderColor: '#D1FAE5',
                quoteBg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                quoteColor: '#047857',
                linkColor: '#059669'
            }),
            h1: `display: block; font-size: 26px; font-weight: 700; margin: 28px 0 20px; text-align: center; border-bottom: 2px solid #10B981; padding: 12px 20px; color: ${COLORS.textPrimary}; line-height: 1.4; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`,
            h2: `display: inline-block; font-size: 20px; font-weight: 700; margin: 24px 0 16px; padding: 8px 20px; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: #fff; border-radius: 24px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); text-align: center; line-height: 1.4;`,
            h3: `display: block; font-size: 18px; font-weight: 700; margin: 20px 0 12px; color: #059669; border-left: 4px solid #10B981; padding: 8px 12px; background: #fff; border-radius: 0 6px 6px 0; line-height: 1.4;`,
            p: `display: block; background: #fff; padding: 16px 20px; border-radius: 10px; margin: 14px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #D1FAE5; text-align: justify; font-size: 16px; color: ${COLORS.textSecondary};`,
            blockquote: `display: block; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-left: 4px solid #10B981; padding: 16px 20px; margin: 16px 0; border-radius: 0 10px 10px 0; color: #047857; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`,
            ul: `display: block; background: #fff; padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #D1FAE5; color: ${COLORS.textSecondary};`,
            ol: `display: block; background: #fff; padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #D1FAE5; color: ${COLORS.textSecondary};`,
            li: `display: list-item; font-size: 16px; line-height: 1.8; margin-bottom: 8px; color: ${COLORS.textSecondary};`,
            img: `display: block; max-width: 100%; border-radius: 10px; margin: 18px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 2px solid #D1FAE5;`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: '#34D399',
                fontFamily: FONTS.standard,
                titleColor: COLORS.darkTextPrimary,
                textColor: COLORS.darkTextSecondary,
                titleAlign: 'center',
                codeBg: 'rgba(5, 150, 105, 0.3)',
                preBg: 'rgba(6, 78, 59, 0.6)',
                preColor: COLORS.darkTextSecondary,
                borderColor: '#047857',
                quoteBg: 'linear-gradient(135deg, rgba(6, 95, 70, 0.6) 0%, rgba(5, 150, 105, 0.3) 100%)',
                quoteColor: '#A7F3D0',
                linkColor: '#6EE7B7',
                imgOpacity: '0.95'
            }),
            h1: `display: block; font-size: 26px; font-weight: 700; margin: 28px 0 20px; text-align: center; border-bottom: 2px solid #34D399; padding: 12px 20px; color: ${COLORS.darkTextPrimary}; line-height: 1.4; background: rgba(6, 78, 59, 0.6); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);`,
            h2: `display: inline-block; font-size: 20px; font-weight: 700; margin: 24px 0 16px; padding: 8px 20px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #fff; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4;`,
            h3: `display: block; font-size: 18px; font-weight: 700; margin: 20px 0 12px; color: #6EE7B7; border-left: 4px solid #34D399; padding: 8px 12px; background: rgba(6, 78, 59, 0.4); border-radius: 0 6px 6px 0; line-height: 1.4;`,
            p: `display: block; background: rgba(6, 78, 59, 0.4); padding: 16px 20px; border-radius: 10px; margin: 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid #047857; text-align: justify; font-size: 16px; color: ${COLORS.darkTextSecondary};`,
            blockquote: `display: block; background: linear-gradient(135deg, rgba(6, 95, 70, 0.6) 0%, rgba(5, 150, 105, 0.3) 100%); border-left: 4px solid #34D399; padding: 16px 20px; margin: 16px 0; border-radius: 0 10px 10px 0; color: #A7F3D0; box-shadow: 0 4px 12px rgba(0,0,0,0.2);`,
            ul: `display: block; background: rgba(6, 78, 59, 0.4); padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid #047857; color: ${COLORS.darkTextSecondary};`,
            ol: `display: block; background: rgba(6, 78, 59, 0.4); padding: 16px 16px 16px 40px; border-radius: 10px; margin: 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid #047857; color: ${COLORS.darkTextSecondary};`,
            li: `display: list-item; font-size: 16px; line-height: 1.8; margin-bottom: 8px; color: ${COLORS.darkTextSecondary};`,
            img: `display: block; max-width: 100%; border-radius: 10px; margin: 18px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 2px solid #047857; opacity: 0.95;`,
        }
    },

    tech: {
        name: '赛博科技',
        accent: '#6366F1',
        css: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: ${COLORS.textPrimary}; background: #fff; }
      .wechat-content h1 { font-family: ${FONTS.code}; font-size: 28px; font-weight: 700; margin: 30px 0 20px; text-align: left; color: #000; border-bottom: 3px solid ${COLORS.tech}; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
      .wechat-content h2 { font-family: ${FONTS.code}; font-size: 22px; font-weight: 700; margin: 26px 0 14px; color: #fff; display: inline-block; background: linear-gradient(135deg, ${COLORS.tech} 0%, #8B5CF6 100%); padding: 6px 16px; transform: skew(-8deg); border-radius: 4px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
      .wechat-content h3 { font-family: ${FONTS.code}; font-size: 18px; font-weight: 700; margin: 22px 0 10px; color: ${COLORS.tech}; display: flex; align-items: center; gap: 8px; }
      .wechat-content h3::before { content: '▸'; color: ${COLORS.tech}; font-size: 20px; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; font-family: ${FONTS.standard}; color: ${COLORS.textSecondary}; }
      .wechat-content blockquote { border-left: 4px solid ${COLORS.tech}; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding: 16px 20px; margin: 16px 0; color: #4338CA; border-radius: 0 8px 8px 0; font-family: ${FONTS.standard}; }
      .wechat-content code { background: #E0E7FF; color: ${COLORS.tech}; padding: 2px 6px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid #C7D2FE; }
      .wechat-content pre { background: #1E1B4B; padding: 18px; border-radius: 8px; margin: 16px 0; overflow: auto; color: #E0E7FF; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; border: 1px solid #4338CA; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .wechat-content pre code { background: transparent; color: inherit; padding: 0; border: none; }
      .wechat-content img { max-width: 100%; border: 2px solid #C7D2FE; border-radius: 8px; padding: 6px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      .wechat-content a { color: ${COLORS.tech}; text-decoration: none; font-weight: 700; border-bottom: 2px solid #C7D2FE; padding-bottom: 2px; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
      .wechat-content th { border: 1px solid #C7D2FE; padding: 12px; background: #E0E7FF; font-weight: 700; color: #4338CA; font-family: ${FONTS.code}; }
      .wechat-content td { border: 1px solid #C7D2FE; padding: 12px; color: ${COLORS.textSecondary}; }
      .wechat-content hr { border: none; border-top: 2px solid #E0E7FF; margin: 32px 0; }
    `,
        cssDark: `
      .wechat-content { font-family: ${FONTS.standard}; line-height: 1.8; color: #E2E8F0; background: #0F172A; }
      .wechat-content h1 { font-family: ${FONTS.code}; font-size: 28px; font-weight: 700; margin: 30px 0 20px; text-align: left; color: #818CF8; border-bottom: 3px solid #818CF8; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
      .wechat-content h2 { font-family: ${FONTS.code}; font-size: 22px; font-weight: 700; margin: 26px 0 14px; color: #000; display: inline-block; background: linear-gradient(135deg, #818CF8 0%, #A78BFA 100%); padding: 6px 16px; transform: skew(-8deg); border-radius: 4px; box-shadow: 0 4px 12px rgba(129, 140, 248, 0.3); }
      .wechat-content h3 { font-family: ${FONTS.code}; font-size: 18px; font-weight: 700; margin: 22px 0 10px; color: #818CF8; display: flex; align-items: center; gap: 8px; }
      .wechat-content h3::before { content: '▸'; color: #818CF8; font-size: 20px; }
      .wechat-content p { font-size: 16px; margin: 16px 0; text-align: justify; font-family: ${FONTS.standard}; color: #94A3B8; }
      .wechat-content blockquote { border-left: 4px solid #818CF8; background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(49, 46, 129, 0.6) 100%); padding: 16px 20px; margin: 16px 0; color: #A5B4FC; border-radius: 0 8px 8px 0; font-family: ${FONTS.standard}; }
      .wechat-content code { background: rgba(99, 102, 241, 0.2); color: #818CF8; padding: 2px 6px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid rgba(99, 102, 241, 0.3); }
      .wechat-content pre { background: #1E1B4B; padding: 18px; border-radius: 8px; margin: 16px 0; overflow: auto; color: #E0E7FF; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; border: 1px solid #4338CA; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      .wechat-content pre code { background: transparent; color: inherit; padding: 0; border: none; }
      .wechat-content img { max-width: 100%; border: 2px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 6px; background: rgba(30, 27, 75, 0.5); box-shadow: 0 4px 12px rgba(0,0,0,0.2); opacity: 0.9; }
      .wechat-content a { color: #818CF8; text-decoration: none; font-weight: 700; border-bottom: 2px solid rgba(99, 102, 241, 0.3); padding-bottom: 2px; }
      .wechat-content table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
      .wechat-content th { border: 1px solid rgba(99, 102, 241, 0.3); padding: 12px; background: rgba(30, 27, 75, 0.6); font-weight: 700; color: #A5B4FC; font-family: ${FONTS.code}; }
      .wechat-content td { border: 1px solid rgba(99, 102, 241, 0.3); padding: 12px; color: #94A3B8; }
      .wechat-content hr { border: none; border-top: 2px solid rgba(99, 102, 241, 0.2); margin: 32px 0; }
    `,
        rootStyle: `background-color: #fff; padding: 20px 16px; border-radius: 8px;`,
        rootStyleDark: `background-color: #0F172A; padding: 20px 16px; border-radius: 8px;`,
        inline: {
            ...createInlineStyles({
                accent: COLORS.tech,
                fontFamily: FONTS.standard,
                titleColor: '#000',
                textColor: COLORS.textSecondary,
                linkColor: COLORS.tech,
                codeBg: '#E0E7FF',
                preBg: '#1E1B4B',
                preColor: '#E0E7FF',
                borderColor: '#C7D2FE',
                quoteBg: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                quoteColor: '#4338CA'
            }),
            h1: `display: block; font-family: ${FONTS.code}; font-size: 28px; font-weight: 700; margin: 30px 0 20px; text-align: left; color: #000; border-bottom: 3px solid ${COLORS.tech}; padding-bottom: 8px; line-height: 1.4; text-transform: uppercase; letter-spacing: 2px;`,
            h2: `display: inline-block; font-family: ${FONTS.code}; font-size: 22px; font-weight: 700; margin: 26px 0 14px; color: #fff; background: linear-gradient(135deg, ${COLORS.tech} 0%, #8B5CF6 100%); padding: 6px 16px; transform: skew(-8deg); border-radius: 4px; line-height: 1.4; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);`,
            h3: `display: flex; align-items: center; gap: 8px; font-family: ${FONTS.code}; font-size: 18px; font-weight: 700; margin: 22px 0 10px; color: ${COLORS.tech}; line-height: 1.4;`,
            blockquote: `display: block; border-left: 4px solid ${COLORS.tech}; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding: 16px 20px; margin: 16px 0; color: #4338CA; border-radius: 0 8px 8px 0; font-family: ${FONTS.standard};`,
            code: `display: inline; background: #E0E7FF; color: ${COLORS.tech}; padding: 2px 6px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid #C7D2FE;`,
            pre: `display: block; background: #1E1B4B; padding: 18px; border-radius: 8px; margin: 16px 0; overflow-x: auto; color: #E0E7FF; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; border: 1px solid #4338CA; white-space: pre-wrap; word-break: break-all; box-shadow: 0 4px 12px rgba(0,0,0,0.15);`,
        },
        inlineDark: {
            ...createInlineStyles({
                accent: '#818CF8',
                fontFamily: FONTS.standard,
                titleColor: '#E2E8F0',
                textColor: '#94A3B8',
                linkColor: '#818CF8',
                codeBg: 'rgba(99, 102, 241, 0.2)',
                preBg: '#1E1B4B',
                preColor: '#E0E7FF',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                quoteBg: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(49, 46, 129, 0.6) 100%)',
                quoteColor: '#A5B4FC',
                imgOpacity: '0.9'
            }),
            h1: `display: block; font-family: ${FONTS.code}; font-size: 28px; font-weight: 700; margin: 30px 0 20px; text-align: left; color: #818CF8; border-bottom: 3px solid #818CF8; padding-bottom: 8px; line-height: 1.4; text-transform: uppercase; letter-spacing: 2px;`,
            h2: `display: inline-block; font-family: ${FONTS.code}; font-size: 22px; font-weight: 700; margin: 26px 0 14px; color: #000; background: linear-gradient(135deg, #818CF8 0%, #A78BFA 100%); padding: 6px 16px; transform: skew(-8deg); border-radius: 4px; line-height: 1.4; box-shadow: 0 4px 12px rgba(129, 140, 248, 0.3);`,
            h3: `display: flex; align-items: center; gap: 8px; font-family: ${FONTS.code}; font-size: 18px; font-weight: 700; margin: 22px 0 10px; color: #818CF8; line-height: 1.4;`,
            blockquote: `display: block; border-left: 4px solid #818CF8; background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(49, 46, 129, 0.6) 100%); padding: 16px 20px; margin: 16px 0; color: #A5B4FC; border-radius: 0 8px 8px 0; font-family: ${FONTS.standard};`,
            code: `display: inline; background: rgba(99, 102, 241, 0.2); color: #818CF8; padding: 2px 6px; border-radius: 4px; font-family: ${FONTS.code}; font-size: 14px; border: 1px solid rgba(99, 102, 241, 0.3);`,
            pre: `display: block; background: #1E1B4B; padding: 18px; border-radius: 8px; margin: 16px 0; overflow-x: auto; color: #E0E7FF; font-family: ${FONTS.code}; font-size: 13px; line-height: 1.6; border: 1px solid #4338CA; white-space: pre-wrap; word-break: break-all; box-shadow: 0 4px 12px rgba(0,0,0,0.3);`,
        }
    }
};
