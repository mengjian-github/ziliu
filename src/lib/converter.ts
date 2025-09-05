import { marked } from 'marked';

// 统一的默认品牌主色（皇家蓝，专业且耐看）
const DEFAULT_ACCENT = '#3B6AE0';
const TECH_ACCENT = '#4F46E5';
// 统一字体栈（微信编辑器友好、中文优先）
const WECHAT_FONT_STACK = 'mp-quote, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif';
const CODE_FONT_STACK = '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// 公众号样式模板
export const WECHAT_STYLES = {
  default: {
    name: '默认样式',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          /* 预览内定义品牌色变量，便于后续拓展 */
          --accent: ${DEFAULT_ACCENT};
          line-height: 1.8;
          color: #333;
          max-width: 100%;
          word-wrap: break-word;
        }
        .wechat-content h1 {
          color: #2c3e50;
          border-bottom: 2px solid var(--accent);
          padding-bottom: 8px;
          margin: 24px 0 16px 0;
          font-size: 24px;
          font-weight: 600;
        }
        .wechat-content h2 {
          color: #34495e;
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 20px 0 12px 0;
          font-size: 20px;
          font-weight: 600;
        }
        .wechat-content h3 {
          color: #2c3e50;
          margin: 16px 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .wechat-content p {
          margin: 16px 0;
          text-align: justify;
          font-size: 16px;
        }
        .wechat-content code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          color: #d14; /* 更柔和的代码色，降低干扰 */
          font-size: 14px;
        }
        .wechat-content pre {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
        }
        .wechat-content pre code {
          background: none;
          padding: 0;
          color: #2c3e50;
        }
        .wechat-content blockquote {
          border-left: 4px solid #bdc3c7;
          padding-left: 16px;
          margin: 16px 0;
          color: #666;
          font-style: normal; /* 中文环境不使用斜体，可读性更好 */
          background: #f9f9f9;
          padding: 12px 16px;
          border-radius: 4px;
        }
        .wechat-content ul, .wechat-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        .wechat-content ul {
          list-style-type: disc;
        }
        .wechat-content ol {
          list-style-type: decimal;
        }
        .wechat-content li {
          margin: 8px 0;
          line-height: 1.8; /* 与正文一致 */
        }
        .wechat-content a {
          color: var(--accent);
          text-decoration: underline;
        }
        /* 特殊处理：有序列表中包含标题的情况，让数字标号和标题样式保持一致 */
        .wechat-content ol > li > h3 {
          display: inline;
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        .wechat-content ol > li::marker {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        .wechat-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 4px;
        }
        .wechat-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .wechat-content th, .wechat-content td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        .wechat-content th {
          background: #f8f9fa;
          font-weight: 600;
        }
      </style>
    `
  },
  tech: {
    name: '技术风格',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${TECH_ACCENT};
          line-height: 1.8;
          color: #2c3e50;
          max-width: 100%;
        }
        .wechat-content h1 {
          color: #111827;
          border-bottom: 2px solid var(--accent);
          padding-bottom: 8px;
          margin: 24px 0 16px 0;
          font-size: 24px;
          font-weight: 700;
        }
        .wechat-content h2 {
          color: var(--accent);
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 20px 0 12px 0;
          font-size: 20px;
        }
        .wechat-content h3 {
          color: #374151;
          margin: 16px 0 8px 0;
          font-size: 18px;
        }
        .wechat-content p {
          margin: 16px 0;
          font-size: 16px;
        }
        .wechat-content code {
          background: #111827;
          color: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre code {
          background: none;
          color: inherit;
        }
        .wechat-content ul, .wechat-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        .wechat-content ul {
          list-style-type: disc;
        }
        .wechat-content ol {
          list-style-type: decimal;
        }
        .wechat-content li {
          margin: 8px 0;
          }
        /* 特殊处理：有序列表中包含标题的情况，让数字标号和标题样式保持一致 */
        .wechat-content ol > li > h3 {
          display: inline;
          margin: 0;
          font-size: 18px;
          color: #374151;
          font-family: ${WECHAT_FONT_STACK};
        }
        .wechat-content ol > li::marker {
          font-size: 18px;
          color: var(--accent);
          font-family: ${WECHAT_FONT_STACK};
        }
        .wechat-content blockquote {
          border-left: 4px solid var(--accent);
          padding-left: 16px;
          margin: 16px 0;
          color: #7f8c8d;
          background: #eef2ff;
          padding: 12px 16px;
          border-radius: 4px;
        }
        .wechat-content a { color: var(--accent); text-decoration: underline; }
      </style>
    `
  },
  elegant: {
    name: '雅致杂志',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: #8B6D3B; /* 淡金点缀 */
          line-height: 2;
          color: #2b2b2b;
          max-width: 100%;
        }
        .wechat-content h1 {
          text-align: center;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 32px 0 18px 0;
          font-size: 28px;
          padding-bottom: 10px;
          border-bottom: 1px solid #DCC9A3; /* 雅致：淡金分隔线 */
        }
        .wechat-content h2 {
          color: #1f2937;
          border-left: 3px solid var(--accent);
          padding-left: 12px;
          margin: 24px 0 14px 0;
          font-size: 22px;
          font-weight: 600;
        }
        .wechat-content h3 {
          color: #374151;
          margin: 20px 0 10px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .wechat-content p { margin: 18px 0; font-size: 16px; color: #444; }
        .wechat-content code {
          background: #f6f6f6; color: #333; padding: 2px 6px; border-radius: 3px; font-size: 14px; font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: #f8f7f3; color: #1f2937; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; font-family: ${CODE_FONT_STACK};
        }
        .wechat-content ul, .wechat-content ol { margin: 18px 0; padding-left: 24px; }
        .wechat-content li { margin: 8px 0; line-height: 1.9; }
        .wechat-content blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 14px;
          margin: 18px 0;
          color: #5b5b5b;
          background: #faf8f3;
          padding: 12px 16px;
          border-radius: 6px;
        }
        .wechat-content a { color: #2563eb; text-decoration: underline; }
      </style>
    `
  },
  minimal: {
    name: '简约风格',
    css: `
      <style>
        .wechat-content {
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
          line-height: 2;
          color: #333;
          max-width: 100%;
        }
        .wechat-content h1 {
          font-weight: 300;
          color: #2c3e50;
          margin: 32px 0 16px 0;
          font-size: 28px;
          text-align: center;
        }
        .wechat-content h2 {
          font-weight: 400;
          color: #34495e;
          margin: 24px 0 12px 0;
          font-size: 22px;
        }
        .wechat-content h3 {
          font-weight: 400;
          color: #2c3e50;
          margin: 20px 0 8px 0;
          font-size: 18px;
        }
        .wechat-content p {
          color: #555;
          margin: 20px 0;
          font-size: 16px;
          text-align: justify;
        }
        .wechat-content code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 14px;
          color: #666;
        }
        .wechat-content pre {
          background: #fafafa;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
          border: 1px solid #eee;
        }
        .wechat-content ul, .wechat-content ol {
          margin: 20px 0;
          padding-left: 24px;
        }
        .wechat-content ul {
          list-style-type: disc;
        }
        .wechat-content ol {
          list-style-type: decimal;
        }
        .wechat-content li {
          margin: 8px 0;
          line-height: 1.8;
        }
        /* 特殊处理：有序列表中包含标题的情况，让数字标号和标题样式保持一致 */
        .wechat-content ol > li > h3 {
          display: inline;
          margin: 0;
          font-size: 18px;
          font-weight: 400;
          color: #2c3e50;
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        }
        .wechat-content ol > li::marker {
          font-size: 18px;
          font-weight: 400;
          color: #2c3e50;
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        }
        .wechat-content blockquote {
          border-left: 2px solid #ddd;
          padding-left: 20px;
          margin: 20px 0;
          color: #666;
          font-style: normal;
        }
      </style>
    `
  }
};

// 转换Markdown到公众号HTML
export function convertToWechat(
  markdown: string,
  styleKey: keyof typeof WECHAT_STYLES = 'default'
): string {
  // 配置marked选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true,    // 支持GitHub风格Markdown
  });

  const html = marked(markdown) as string;
  const style = WECHAT_STYLES[styleKey];

  return `
    ${style.css}
    <div class="wechat-content">
      ${html}
    </div>
  `;
}

// 获取所有可用样式
export function getAvailableStyles() {
  return Object.entries(WECHAT_STYLES).map(([key, style]) => ({
    key,
    name: style.name,
  }));
}

// 生成带内联样式的HTML（用于公众号编辑器）
export function convertToWechatInline(
  markdown: string,
  styleKey: keyof typeof WECHAT_STYLES = 'default'
): string {
  // 配置marked选项
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const html = marked(markdown) as string;

  // 预处理HTML，解决格式问题
  const cleanedHtml = preprocessHtmlForWechat(html, styleKey);

  // 根据样式生成内联样式映射
  const inlineStyles = getInlineStylesForWechat(styleKey);

  // 解析HTML并添加内联样式
  return applyInlineStyles(cleanedHtml, inlineStyles);
}

// 预处理HTML，解决微信公众号编辑器的格式问题
function preprocessHtmlForWechat(html: string, styleKey: keyof typeof WECHAT_STYLES): string {
  let processedHtml = html;

  // 1. 清理多余的空格和换行
  processedHtml = processedHtml
    // 移除连续的空格（保留单个空格）
    .replace(/\s{3,}/g, ' ')
    // 清理标签间多余的空白
    .replace(/>\s+</g, '><')
    // 清理段落间多余的换行
    .replace(/(<\/p>)\s*(<p[^>]*>)/g, '$1$2')
    // 清理标题间多余的换行
    .replace(/(<\/h[1-6]>)\s*(<[^>]+>)/g, '$1$2');

  // 2. 修复代码块格式，确保换行保持
  processedHtml = processedHtml.replace(
    /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g,
    (match, codeContent) => {
      // 保护代码块中的换行符和空格
      const protectedCode = codeContent
        // 将换行符转换为<br>标签
        .replace(/\n/g, '<br>')
        // 将多个空格转换为&nbsp;
        .replace(/  /g, '&nbsp;&nbsp;')
        // 保护制表符
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

      return `<pre><code>${protectedCode}</code></pre>`;
    }
  );

  // 2.5 兼容微信公众号：将 h1/h2/h3 转为等价的 p 内联样式（使用当前主题样式），避免 h 标签被剥离
  const headingInline = getInlineStylesForWechat(styleKey);
  const h1Style = headingInline.h1 || '';
  const h2Style = headingInline.h2 || '';
  const h3Style = headingInline.h3 || '';

  processedHtml = processedHtml
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, text) => `<p style="${h1Style}">${text}</p>`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, text) => `<p style="${h2Style}">${text}</p>`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, text) => `<p style="${h3Style}">${text}</p>`);

  // 2.6 扩展：步骤徽章与结论卡片（通过标记触发，兼容微信编辑器）
  // 触发写法：
  //   [!STEPS]\n\n1. 步骤一\n2. 步骤二
  //   > [!KEY] 结论标题\n> - 要点1\n> - 要点2

  // 计算各主题的强调色
  let accent = DEFAULT_ACCENT;
  if (styleKey === 'tech') accent = TECH_ACCENT;
  if (styleKey === 'elegant') accent = '#8B6D3B';

  // 步骤徽章：将 [!STEPS] 标记后的第一个 <ol> 转为带编号徽章的块结构
  processedHtml = processedHtml.replace(/<p>\s*\[!STEPS\]\s*<\/p>\s*<ol>([\s\S]*?)<\/ol>/gi, (_m, olInner) => {
    const items: string[] = [];
    const liRegex = /<li>([\s\S]*?)<\/li>/gi;
    let m;
    let idx = 1;
    while ((m = liRegex.exec(olInner)) !== null) {
      const content = m[1];
      const itemHtml = `
        <div style="display:flex; align-items:flex-start; margin:10px 0;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:9999px; background:${accent}; color:#fff; font-size:12px; font-weight:700;">${idx}</span>
          <div style="margin-left:10px; line-height:1.8; color:#333;">${content}</div>
        </div>`;
      items.push(itemHtml);
      idx++;
    }
    return `<div style="margin:16px 0;">${items.join('')}</div>`;
  });

  // 结论卡片：识别 blockquote 内部首段含 [!KEY]/[!CONCLUSION]/[!SUMMARY]
  processedHtml = processedHtml.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (match, inner) => {
    const titleMatch = inner.match(/<p>\s*\[(?:!KEY|!CONCLUSION|!SUMMARY)\]\s*([^<]*)<\/p>/i);
    if (!titleMatch) return match;
    const title = (titleMatch[1] || '要点总结').trim();
    // 去掉标记标题段
    const body = inner.replace(titleMatch[0], '');
    const card = `
      <div style="border:1px solid ${accent}; background: #fff; border-radius:8px; padding:12px 14px; margin:16px 0;">
        <div style="display:flex; align-items:center; font-weight:700; color:${accent}; margin-bottom:8px;">
          <span style="display:inline-block; width:6px; height:6px; background:${accent}; border-radius:9999px; margin-right:8px;"></span>
          <span>${title || '要点总结'}</span>
        </div>
        <div style="color:#374151; line-height:1.8;">${body}</div>
      </div>`;
    return card;
  });

  // 3. 修复行内代码的空格问题
  processedHtml = processedHtml.replace(
    /<code>([^<]+)<\/code>/g,
    (match, codeContent) => {
      // 保护行内代码中的空格
      const protectedCode = codeContent.replace(/  /g, '&nbsp;&nbsp;');
      return `<code>${protectedCode}</code>`;
    }
  );

  // 4. 优化列表格式
  processedHtml = processedHtml
    // 确保列表项之间有适当的间距
    .replace(/(<\/li>)\s*(<li>)/g, '$1$2')
    // 清理列表前后的多余空白
    .replace(/(<\/[uo]l>)\s*(<[^>]+>)/g, '$1$2');

  // 5. 移除可能导致问题的section标签
  processedHtml = processedHtml
    .replace(/<section[^>]*>/g, '<div>')
    .replace(/<\/section>/g, '</div>');

  // 6. 将 <hr> 转换为安全的分割线容器
  processedHtml = processedHtml.replace(/<hr\s*\/?>/gi, '<div style="margin: 24px 0; border-top: 1px solid #e5e7eb;"></div>');

  return processedHtml;
}

// 获取内联样式映射 - 优化微信编辑器兼容性
function getInlineStylesForWechat(styleKey: keyof typeof WECHAT_STYLES) {
  // 微信编辑器兼容的字体栈
  const wechatFontFamily = WECHAT_FONT_STACK;
  const wechatCodeFontFamily = CODE_FONT_STACK;

  const baseStyles = {
    default: {
      h1: `color: #2c3e50; border-bottom: 2px solid ${DEFAULT_ACCENT}; padding-bottom: 8px; margin: 24px 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: #34495e; border-left: 4px solid ${DEFAULT_ACCENT}; padding-left: 12px; margin: 20px 0 12px 0; font-size: 20px; font-weight: 600; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: #2c3e50; margin: 16px 0 8px 0; font-size: 18px; font-weight: 600; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 16px 0; text-align: justify; font-size: 16px; line-height: 1.8; color: #333333; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-all;`,
      code: `background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: ${wechatCodeFontFamily}; color: #d14; font-size: 14px; white-space: pre-wrap; display: inline;`,
      pre: `background-color: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; border-left: 4px solid ${DEFAULT_ACCENT}; font-family: ${wechatCodeFontFamily}; white-space: pre-wrap; display: block;`,
      blockquote: `border-left: 4px solid #bdc3c7; padding: 12px 16px; margin: 16px 0; color: #666666; font-style: normal; background-color: #f9f9f9; border-radius: 4px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.8; font-family: ${wechatFontFamily};`,
      a: `color: ${DEFAULT_ACCENT}; text-decoration: underline;`,
      strong: `font-weight: 600; color: #2c3e50; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: #34495e; font-family: ${wechatFontFamily};`
    },
    tech: {
      h1: `color: #111827; border-bottom: 2px solid ${TECH_ACCENT}; padding-bottom: 8px; margin: 24px 0 16px 0; font-size: 24px; font-weight: 700; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: ${TECH_ACCENT}; border-left: 4px solid ${TECH_ACCENT}; padding-left: 12px; margin: 20px 0 12px 0; font-size: 20px; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: #374151; margin: 16px 0 8px 0; font-size: 18px; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 16px 0; font-size: 16px; line-height: 1.8; color: #2c3e50; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-all;`,
      code: `background-color: #111827; color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: ${wechatCodeFontFamily}; white-space: pre-wrap; display: inline;`,
      pre: `background-color: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; font-family: ${wechatCodeFontFamily}; white-space: pre-wrap; display: block; border-left: 4px solid ${TECH_ACCENT};`,
      blockquote: `border-left: 4px solid ${TECH_ACCENT}; padding: 12px 16px; margin: 16px 0; color: #7f8c8d; background-color: #eef2ff; border-radius: 4px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.8; font-family: ${wechatFontFamily};`,
      strong: `font-weight: 700; color: ${TECH_ACCENT}; font-family: ${wechatFontFamily};`,
      em: `font-style: normal; color: #374151; font-family: ${wechatFontFamily};`
    },
    minimal: {
      h1: `font-weight: 300; color: #2c3e50; margin: 32px 0 16px 0; font-size: 28px; text-align: center; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `font-weight: 400; color: #34495e; margin: 24px 0 12px 0; font-size: 22px; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h3: `font-weight: 400; color: #2c3e50; margin: 20px 0 8px 0; font-size: 18px; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      p: `color: #555555; margin: 20px 0; font-size: 16px; text-align: justify; line-height: 2; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-all;`,
      code: `background-color: #f5f5f5; padding: 2px 4px; border-radius: 2px; font-size: 14px; color: #666666; font-family: ${wechatCodeFontFamily}; white-space: pre-wrap; display: inline;`,
      pre: `background-color: #fafafa; padding: 20px; border-radius: 4px; margin: 20px 0; border: 1px solid #eeeeee; font-family: ${wechatCodeFontFamily}; white-space: pre-wrap; display: block;`,
      blockquote: `border-left: 2px solid #dddddd; padding-left: 20px; margin: 20px 0; color: #666666; font-style: normal; display: block;`,
      ul: `margin: 20px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 20px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.8; font-family: ${wechatFontFamily};`,
      strong: `font-weight: 600; color: #2c3e50; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: #555555; font-family: ${wechatFontFamily};`
    },
    elegant: {
      h1: `text-align: center; font-weight: 700; letter-spacing: 0.5px; margin: 32px 0 18px 0; font-size: 28px; line-height: 1.4; font-family: ${wechatFontFamily}; display: block; padding-bottom: 10px; border-bottom: 1px solid #DCC9A3;`,
      h2: `color: #1f2937; border-left: 3px solid #8B6D3B; padding-left: 12px; margin: 24px 0 14px 0; font-size: 22px; font-weight: 600; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: #374151; margin: 20px 0 10px 0; font-size: 18px; font-weight: 600; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 18px 0; font-size: 16px; color: #444444; line-height: 2; font-family: ${wechatFontFamily};`,
      code: `background-color: #f6f6f6; color: #333333; padding: 2px 6px; border-radius: 3px; font-size: 14px; font-family: ${wechatCodeFontFamily}; display: inline;`,
      pre: `background-color: #f8f7f3; color: #1f2937; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; font-family: ${wechatCodeFontFamily}; display: block; white-space: pre-wrap;`,
      blockquote: `border-left: 3px solid #8B6D3B; padding: 12px 16px; margin: 18px 0; color: #5b5b5b; background-color: #faf8f3; border-radius: 6px; display: block;`,
      ul: `margin: 18px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 18px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.9; font-family: ${wechatFontFamily};`,
      strong: `font-weight: 600; color: #1f2937; font-family: ${wechatFontFamily};`,
      em: `font-style: normal; color: #555555; font-family: ${wechatFontFamily};`
    }
  };

  return baseStyles[styleKey];
}

// 应用内联样式到HTML - 优化微信编辑器兼容性
function applyInlineStyles(html: string, styles: Record<string, string>): string {
  let styledHtml = html;

  // 处理各种HTML标签
  Object.entries(styles).forEach(([tag, style]) => {
    const regex = new RegExp(`<${tag}([^>]*)>`, 'gi');
    styledHtml = styledHtml.replace(regex, (match, attributes) => {
      // 清理和规范化样式
      const cleanStyle = style.replace(/\s+/g, ' ').trim();

      // 如果已有style属性，合并样式
      if (attributes && attributes.includes('style=')) {
        return match.replace(/style="([^"]*)"/, (_, existingStyle) => {
          // 合并样式，新样式优先
          const mergedStyle = `${existingStyle.trim()}; ${cleanStyle}`.replace(/;\s*;/g, ';');
          return `style="${mergedStyle}"`;
        });
      } else {
        // 添加新的style属性
        const cleanAttributes = attributes || '';
        return `<${tag}${cleanAttributes} style="${cleanStyle}">`;
      }
    });
  });

  // 特殊处理pre中的code标签，确保代码块样式正确
  styledHtml = styledHtml.replace(
    /<pre([^>]*)><code([^>]*)>/gi,
    (_, preAttrs, codeAttrs) => {
      // 为pre中的code标签添加特殊样式，确保换行和空格保持
      const codeStyle = 'background-color: transparent; padding: 0; color: inherit; white-space: pre-wrap; font-family: inherit; display: inline;';

      if (codeAttrs && codeAttrs.includes('style=')) {
        const updatedCodeAttrs = codeAttrs.replace(/style="([^"]*)"/, `style="$1; ${codeStyle}"`);
        return `<pre${preAttrs}><code${updatedCodeAttrs}>`;
      } else {
        return `<pre${preAttrs}><code${codeAttrs} style="${codeStyle}">`;
      }
    }
  );

  // 添加微信编辑器需要的属性
  styledHtml = styledHtml.replace(/<p([^>]*style="[^"]*")([^>]*)>/gi, (match) => {
    if (!match.includes('data-tools=')) {
      return match.replace('>', ' data-tools="135editor">');
    }
    return match;
  });

  // 确保图片有正确的样式
  styledHtml = styledHtml.replace(/<img([^>]*)>/gi, (match, attrs) => {
    if (!attrs.includes('style=')) {
      return `<img${attrs} style="max-width: 100%; height: auto; display: block; margin: 16px auto;">`;
    }
    return match;
  });

  return styledHtml;
}

// 预览转换结果
export function previewConversion(markdown: string, styleKey: keyof typeof WECHAT_STYLES = 'default') {
  const html = convertToWechat(markdown, styleKey);
  const inlineHtml = convertToWechatInline(markdown, styleKey);
  const wordCount = markdown.replace(/\s/g, '').length;
  const readingTime = Math.ceil(wordCount / 300); // 假设每分钟阅读300字

  return {
    html, // 用于预览的HTML（带CSS类）
    inlineHtml, // 用于公众号编辑器的HTML（内联样式）
    wordCount,
    readingTime,
    style: WECHAT_STYLES[styleKey].name,
  };
}
