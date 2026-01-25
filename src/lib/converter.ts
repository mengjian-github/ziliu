import { marked } from 'marked';

// 统一的默认品牌主色（专业、耐看）
const DEFAULT_ACCENT = '#3B6AE0';
const TECH_ACCENT = '#4F46E5';
const CARD_ACCENT = '#10B981';
const PRINT_ACCENT = '#B08968';
const NIGHT_ACCENT = '#22D3EE';
// 统一字体栈（微信编辑器友好、中文优先）
const WECHAT_FONT_STACK = 'mp-quote, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif';
const SERIF_FONT_STACK = '"Songti SC", "STSong", "SimSun", "Noto Serif SC", serif';
const CODE_FONT_STACK = '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// 公众号样式模板（全新主题体系）
export const WECHAT_STYLES = {
  default: {
    name: '清爽简约',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${DEFAULT_ACCENT};
          --wechat-link: #576b95;
          --wechat-muted: rgba(0, 0, 0, 0.66);
          --wechat-surface: rgba(127, 127, 127, 0.08);
          --wechat-surface-strong: rgba(127, 127, 127, 0.12);
          --wechat-border: rgba(127, 127, 127, 0.24);
          --wechat-border-strong: rgba(127, 127, 127, 0.36);
          line-height: 1.85;
          color: inherit;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-preview[data-wechat-theme="night"] .wechat-content {
          --wechat-link: #7d93c7;
          --wechat-muted: rgba(255, 255, 255, 0.68);
          --wechat-border: rgba(255, 255, 255, 0.20);
          --wechat-border-strong: rgba(255, 255, 255, 0.32);
        }
        .wechat-content h1 {
          border-bottom: 2px solid var(--accent);
          padding-bottom: 10px;
          margin: 26px 0 14px 0;
          font-size: 26px;
          font-weight: 700;
          line-height: 1.4;
          color: inherit;
        }
        .wechat-content h2 {
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 22px 0 12px 0;
          font-size: 21px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content h3 {
          margin: 18px 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content p {
          margin: 16px 0;
          text-align: justify;
          text-justify: inter-ideograph;
          font-size: 16px;
          line-height: 1.85;
          color: inherit;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 6px;
          border-radius: 6px;
          font-family: ${CODE_FONT_STACK};
          color: inherit;
          font-size: 13px;
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
        }
        .wechat-content pre code { background: none; border: 0; padding: 0; color: inherit; }
        .wechat-content blockquote {
          border-left: 4px solid var(--wechat-border-strong);
          margin: 16px 0;
          color: var(--wechat-muted);
          font-style: normal;
          background: var(--wechat-surface);
          padding: 12px 16px;
          border-radius: 8px;
        }
        .wechat-content ul, .wechat-content ol { margin: 16px 0; padding-left: 24px; }
        .wechat-content ul { list-style-type: disc; }
        .wechat-content ol { list-style-type: decimal; }
        .wechat-content li { margin: 8px 0; line-height: 1.85; }
        .wechat-content ol > li > h3 {
          display: inline;
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: inherit;
        }
        .wechat-content ol > li::marker { font-size: 18px; font-weight: 700; color: inherit; }
        .wechat-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 8px;
        }
        .wechat-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .wechat-content th, .wechat-content td {
          border: 1px solid var(--wechat-border);
          padding: 8px 12px;
          text-align: left;
        }
        .wechat-content th {
          background: var(--wechat-surface);
          font-weight: 700;
        }
      </style>
    `
  },
  minimal: {
    name: '极简留白',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${DEFAULT_ACCENT};
          --wechat-link: #576b95;
          --wechat-muted: rgba(0, 0, 0, 0.66);
          --wechat-surface: rgba(127, 127, 127, 0.08);
          --wechat-surface-strong: rgba(127, 127, 127, 0.12);
          --wechat-border: rgba(127, 127, 127, 0.24);
          --wechat-border-strong: rgba(127, 127, 127, 0.36);
          line-height: 2;
          color: inherit;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-preview[data-wechat-theme="night"] .wechat-content {
          --wechat-link: #7d93c7;
          --wechat-muted: rgba(255, 255, 255, 0.68);
          --wechat-border: rgba(255, 255, 255, 0.20);
          --wechat-border-strong: rgba(255, 255, 255, 0.32);
        }
        .wechat-content h1 {
          font-weight: 300;
          margin: 34px 0 16px 0;
          font-size: 30px;
          text-align: center;
          line-height: 1.4;
          color: inherit;
        }
        .wechat-content h2 {
          font-weight: 500;
          margin: 24px 0 12px 0;
          font-size: 22px;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content h3 {
          font-weight: 500;
          margin: 18px 0 8px 0;
          font-size: 18px;
          line-height: 1.5;
          color: inherit;
        }
        .wechat-content p {
          margin: 20px 0;
          font-size: 16px;
          text-align: justify;
          text-justify: inter-ideograph;
          color: inherit;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 13px;
          color: inherit;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          color: inherit;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content ul, .wechat-content ol { margin: 20px 0; padding-left: 24px; }
        .wechat-content ul { list-style-type: disc; }
        .wechat-content ol { list-style-type: decimal; }
        .wechat-content li { margin: 8px 0; line-height: 1.85; }
        .wechat-content ol > li > h3 {
          display: inline;
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: inherit;
          font-family: ${WECHAT_FONT_STACK};
        }
        .wechat-content ol > li::marker {
          font-size: 18px;
          font-weight: 500;
          color: inherit;
          font-family: ${WECHAT_FONT_STACK};
        }
        .wechat-content blockquote {
          border-left: 2px solid var(--wechat-border-strong);
          background: var(--wechat-surface);
          padding: 12px 16px;
          margin: 20px 0;
          color: var(--wechat-muted);
          font-style: normal;
          border-radius: 8px;
        }
      </style>
    `
  },
  elegant: {
    name: '杂志雅致',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: #8B6D3B;
          --wechat-link: #576b95;
          --wechat-muted: rgba(0, 0, 0, 0.66);
          --wechat-surface: rgba(127, 127, 127, 0.08);
          --wechat-surface-strong: rgba(127, 127, 127, 0.12);
          --wechat-border: rgba(127, 127, 127, 0.24);
          --wechat-border-strong: rgba(127, 127, 127, 0.36);
          line-height: 1.95;
          color: inherit;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-preview[data-wechat-theme="night"] .wechat-content {
          --wechat-link: #7d93c7;
          --wechat-muted: rgba(255, 255, 255, 0.68);
          --wechat-border: rgba(255, 255, 255, 0.20);
          --wechat-border-strong: rgba(255, 255, 255, 0.32);
        }
        .wechat-content h1 {
          text-align: center;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 32px 0 18px 0;
          font-size: 28px;
          line-height: 1.4;
          color: inherit;
          padding-bottom: 10px;
          border-bottom: 1px solid #DCC9A3;
          font-family: ${SERIF_FONT_STACK};
        }
        .wechat-content h2 {
          border-left: 3px solid var(--accent);
          padding-left: 12px;
          margin: 24px 0 14px 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content h3 {
          margin: 20px 0 10px 0;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content p { margin: 18px 0; font-size: 16px; color: inherit; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          color: inherit;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          color: inherit;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content ul, .wechat-content ol { margin: 18px 0; padding-left: 24px; }
        .wechat-content li { margin: 8px 0; line-height: 1.9; }
        .wechat-content blockquote {
          border-left: 3px solid var(--accent);
          margin: 18px 0;
          color: var(--wechat-muted);
          background: var(--wechat-surface);
          padding: 12px 16px;
          border-radius: 8px;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
      </style>
    `
  },
  tech: {
    name: '极客技术',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${TECH_ACCENT};
          --wechat-link: #5b7cfa;
          --wechat-muted: rgba(0, 0, 0, 0.66);
          --wechat-surface: rgba(79, 70, 229, 0.06);
          --wechat-surface-strong: rgba(79, 70, 229, 0.12);
          --wechat-border: rgba(79, 70, 229, 0.24);
          --wechat-border-strong: rgba(79, 70, 229, 0.4);
          line-height: 1.85;
          color: inherit;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-preview[data-wechat-theme="night"] .wechat-content {
          --wechat-link: #93a8ff;
          --wechat-muted: rgba(255, 255, 255, 0.68);
          --wechat-border: rgba(255, 255, 255, 0.20);
          --wechat-border-strong: rgba(255, 255, 255, 0.32);
        }
        .wechat-content h1 {
          border-bottom: 2px solid var(--accent);
          padding-bottom: 8px;
          margin: 24px 0 16px 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
          color: inherit;
        }
        .wechat-content h2 {
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 20px 0 12px 0;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content h3 {
          margin: 16px 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content p {
          margin: 16px 0;
          font-size: 16px;
          line-height: 1.85;
          color: inherit;
          text-align: justify;
          text-justify: inter-ideograph;
        }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: ${CODE_FONT_STACK};
          color: inherit;
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
          font-family: ${CODE_FONT_STACK};
          color: inherit;
        }
        .wechat-content pre code { background: none; border: 0; color: inherit; }
        .wechat-content ul, .wechat-content ol { margin: 16px 0; padding-left: 24px; }
        .wechat-content ul { list-style-type: disc; }
        .wechat-content ol { list-style-type: decimal; }
        .wechat-content li { margin: 8px 0; line-height: 1.85; }
        .wechat-content blockquote {
          border-left: 4px solid var(--accent);
          margin: 16px 0;
          color: var(--wechat-muted);
          background: var(--wechat-surface);
          padding: 12px 16px;
          border-radius: 6px;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
      </style>
    `
  },
  card: {
    name: '卡片模块',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${CARD_ACCENT};
          --wechat-link: #0f766e;
          --wechat-muted: rgba(0, 0, 0, 0.66);
          --wechat-surface: rgba(16, 185, 129, 0.08);
          --wechat-surface-strong: rgba(16, 185, 129, 0.12);
          --wechat-border: rgba(15, 118, 110, 0.2);
          --wechat-border-strong: rgba(15, 118, 110, 0.34);
          line-height: 1.85;
          color: inherit;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-preview[data-wechat-theme="night"] .wechat-content {
          --wechat-link: #86efac;
          --wechat-muted: rgba(255, 255, 255, 0.68);
          --wechat-border: rgba(255, 255, 255, 0.20);
          --wechat-border-strong: rgba(255, 255, 255, 0.32);
        }
        .wechat-content h1 {
          margin: 26px 0 18px 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
          color: inherit;
        }
        .wechat-content h2 {
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 20px 0 12px 0;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content h3 {
          margin: 16px 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.45;
          color: inherit;
        }
        .wechat-content p {
          margin: 16px 0;
          text-align: justify;
          text-justify: inter-ideograph;
          font-size: 16px;
          line-height: 1.85;
          color: inherit;
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 6px;
          border-radius: 6px;
          font-family: ${CODE_FONT_STACK};
          color: inherit;
          font-size: 13px;
        }
        .wechat-content pre {
          background: #f8fafc;
          border: 1px solid var(--wechat-border);
          padding: 16px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
        }
        .wechat-content pre code { background: none; border: 0; padding: 0; color: inherit; }
        .wechat-content blockquote {
          border-left: 4px solid var(--accent);
          margin: 16px 0;
          color: var(--wechat-muted);
          background: var(--wechat-surface);
          padding: 12px 16px;
          border-radius: 12px;
        }
        .wechat-content ul, .wechat-content ol { margin: 16px 0; padding-left: 24px; }
        .wechat-content ul { list-style-type: disc; }
        .wechat-content ol { list-style-type: decimal; }
        .wechat-content li { margin: 8px 0; line-height: 1.85; }
        .wechat-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .wechat-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
        }
        .wechat-content th, .wechat-content td {
          border: 1px solid var(--wechat-border);
          padding: 8px 12px;
          text-align: left;
        }
        .wechat-content th {
          background: rgba(16, 185, 129, 0.08);
          font-weight: 700;
        }
      </style>
    `
  },
  print: {
    name: '书刊印刷',
    css: `
      <style>
        .wechat-content {
          font-family: ${SERIF_FONT_STACK};
          --accent: ${PRINT_ACCENT};
          --wechat-link: #8b5a2b;
          --wechat-muted: rgba(58, 49, 42, 0.7);
          --wechat-surface: rgba(176, 137, 104, 0.08);
          --wechat-surface-strong: rgba(176, 137, 104, 0.12);
          --wechat-border: rgba(176, 137, 104, 0.25);
          --wechat-border-strong: rgba(176, 137, 104, 0.4);
          line-height: 1.95;
          color: #3A312A;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
        }
        .wechat-content h1 {
          font-weight: 700;
          margin: 30px 0 16px 0;
          font-size: 28px;
          text-align: center;
          line-height: 1.4;
          color: inherit;
          letter-spacing: 0.4px;
        }
        .wechat-content h2 {
          border-left: 3px solid var(--accent);
          padding-left: 12px;
          margin: 24px 0 12px 0;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.5;
          color: inherit;
        }
        .wechat-content h3 {
          margin: 18px 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.5;
          color: inherit;
        }
        .wechat-content p {
          margin: 18px 0;
          font-size: 16px;
          line-height: 1.95;
          color: inherit;
          text-align: justify;
          text-justify: inter-ideograph;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: inherit;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          color: inherit;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content blockquote {
          border-left: 3px solid var(--accent);
          margin: 18px 0;
          color: var(--wechat-muted);
          background: rgba(176, 137, 104, 0.06);
          padding: 12px 16px;
          border-radius: 8px;
        }
        .wechat-content ul, .wechat-content ol { margin: 18px 0; padding-left: 24px; }
        .wechat-content li { margin: 8px 0; line-height: 1.9; }
        .wechat-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 6px;
          border: 1px solid rgba(176, 137, 104, 0.25);
        }
      </style>
    `
  },
  night: {
    name: '夜幕墨黑',
    css: `
      <style>
        .wechat-content {
          font-family: ${WECHAT_FONT_STACK};
          --accent: ${NIGHT_ACCENT};
          --wechat-link: #7dd3fc;
          --wechat-muted: rgba(226, 232, 240, 0.72);
          --wechat-surface: rgba(15, 23, 42, 0.9);
          --wechat-surface-strong: rgba(30, 41, 59, 0.9);
          --wechat-border: rgba(148, 163, 184, 0.2);
          --wechat-border-strong: rgba(148, 163, 184, 0.35);
          line-height: 1.85;
          color: #e2e8f0;
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
          background: #0b1220;
          padding: 12px 12px;
          border-radius: 12px;
        }
        .wechat-content h1 {
          margin: 22px 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
          color: #f8fafc;
        }
        .wechat-content h2 {
          border-left: 4px solid var(--accent);
          padding-left: 12px;
          margin: 18px 0 10px 0;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.45;
          color: #f8fafc;
        }
        .wechat-content h3 {
          margin: 14px 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.45;
          color: #f8fafc;
        }
        .wechat-content p {
          margin: 14px 0;
          font-size: 16px;
          line-height: 1.85;
          color: #e2e8f0;
          text-align: justify;
          text-justify: inter-ideograph;
        }
        .wechat-content a { color: var(--wechat-link); text-decoration: none; }
        .wechat-content a:hover { text-decoration: underline; text-underline-offset: 3px; }
        .wechat-content code {
          background: var(--wechat-surface-strong);
          border: 1px solid var(--wechat-border);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: #e2e8f0;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre {
          background: var(--wechat-surface);
          border: 1px solid var(--wechat-border);
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid var(--accent);
          color: #e2e8f0;
          font-family: ${CODE_FONT_STACK};
        }
        .wechat-content pre code { background: none; border: 0; padding: 0; color: inherit; }
        .wechat-content blockquote {
          border-left: 4px solid var(--accent);
          margin: 16px 0;
          color: var(--wechat-muted);
          background: var(--wechat-surface);
          padding: 12px 16px;
          border-radius: 8px;
        }
        .wechat-content ul, .wechat-content ol { margin: 16px 0; padding-left: 24px; }
        .wechat-content li { margin: 8px 0; line-height: 1.85; }
        .wechat-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .wechat-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          background: #0f172a;
        }
        .wechat-content th, .wechat-content td {
          border: 1px solid var(--wechat-border);
          padding: 8px 12px;
          text-align: left;
        }
        .wechat-content th {
          background: #111827;
          font-weight: 700;
          color: #f8fafc;
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

  // 0. 保护代码块，避免后续清理误伤格式
  const codeBlocks: string[] = [];
  processedHtml = processedHtml.replace(
    /<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/g,
    (match) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return token;
    }
  );

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

  // 2. 还原代码块并保护空格/制表符（保留原始换行）
  codeBlocks.forEach((block, index) => {
    const protectedBlock = block.replace(
      /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/,
      (_match, codeAttrs, codeContent) => {
        const protectedCode = String(codeContent)
          .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
          .replace(/ {2}/g, '&nbsp;&nbsp;');
        return `<pre><code${codeAttrs}>${protectedCode}</code></pre>`;
      }
    );
    processedHtml = processedHtml.replace(`__CODE_BLOCK_${index}__`, protectedBlock);
  });

  // 2.5 兼容微信公众号：将 h1/h2/h3 转为等价的 p 内联样式（使用当前主题样式），避免 h 标签被剥离
  const headingInline = getInlineStylesForWechat(styleKey);
  const h1Style = headingInline.h1 || '';
  const h2Style = headingInline.h2 || '';
  const h3Style = headingInline.h3 || '';
  const h4Style = headingInline.h4 || h3Style || '';
  const h5Style = headingInline.h5 || h4Style || h3Style || '';
  const h6Style = headingInline.h6 || h5Style || h4Style || h3Style || '';

  processedHtml = processedHtml
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, text) => `<p data-heading="h1" style="${h1Style}">${text}</p>`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, text) => `<p data-heading="h2" style="${h2Style}">${text}</p>`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, text) => `<p data-heading="h3" style="${h3Style}">${text}</p>`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, text) => `<p data-heading="h4" style="${h4Style}">${text}</p>`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_m, text) => `<p data-heading="h5" style="${h5Style}">${text}</p>`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_m, text) => `<p data-heading="h6" style="${h6Style}">${text}</p>`);

  // 2.6 扩展：步骤徽章与结论卡片（通过标记触发，兼容微信编辑器）
  // 触发写法：
  //   [!STEPS]\n\n1. 步骤一\n2. 步骤二
  //   > [!KEY] 结论标题\n> - 要点1\n> - 要点2

  // 计算各主题的强调色
  let accent = DEFAULT_ACCENT;
  if (styleKey === 'tech') accent = TECH_ACCENT;
  if (styleKey === 'elegant') accent = '#8B6D3B';
  if (styleKey === 'card') accent = CARD_ACCENT;
  if (styleKey === 'print') accent = PRINT_ACCENT;
  if (styleKey === 'night') accent = NIGHT_ACCENT;

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
	          <div style="margin-left:10px; line-height:1.8; color:inherit;">${content}</div>
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
	      <div style="border:1px solid ${accent}; background: rgba(127, 127, 127, 0.06); border-radius:8px; padding:12px 14px; margin:16px 0;">
	        <div style="display:flex; align-items:center; font-weight:700; color:${accent}; margin-bottom:8px;">
	          <span style="display:inline-block; width:6px; height:6px; background:${accent}; border-radius:9999px; margin-right:8px;"></span>
	          <span>${title || '要点总结'}</span>
	        </div>
	        <div style="color:inherit; line-height:1.8;">${body}</div>
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
	  processedHtml = processedHtml.replace(/<hr\s*\/?>/gi, '<div style="margin: 24px 0; border-top: 1px solid rgba(127, 127, 127, 0.28);"></div>');

  return processedHtml;
}

// 获取内联样式映射 - 优化微信编辑器兼容性
function getInlineStylesForWechat(styleKey: keyof typeof WECHAT_STYLES) {
  // 微信编辑器兼容的字体栈
  const wechatFontFamily = WECHAT_FONT_STACK;
  const wechatCodeFontFamily = CODE_FONT_STACK;

  const baseStyles = {
    default: {
      h1: `color: inherit; border-bottom: 2px solid ${DEFAULT_ACCENT}; padding-bottom: 8px; margin: 26px 0 14px 0; font-size: 24px; font-weight: 700; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: inherit; border-left: 4px solid ${DEFAULT_ACCENT}; padding-left: 12px; margin: 22px 0 12px 0; font-size: 20px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: inherit; margin: 18px 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h4: `color: inherit; margin: 16px 0 8px 0; font-size: 17px; font-weight: 700; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 700; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 14px 0; text-align: justify; text-justify: inter-ideograph; font-size: 16px; line-height: 1.8; color: inherit; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #576b95; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(127, 127, 127, 0.12); border: 1px solid rgba(127, 127, 127, 0.20); padding: 2px 6px; border-radius: 4px; font-family: ${wechatCodeFontFamily}; color: inherit; font-size: 13px; line-height: 1.65; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(127, 127, 127, 0.08); border: 1px solid rgba(127, 127, 127, 0.18); padding: 14px 14px; border-radius: 10px; overflow-x: auto; margin: 14px 0; border-left: 4px solid ${DEFAULT_ACCENT}; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; color: inherit;`,
      blockquote: `border-left: 4px solid ${DEFAULT_ACCENT}; padding: 12px 14px; margin: 14px 0; color: inherit; font-style: normal; background-color: rgba(59, 106, 224, 0.06); border-radius: 10px; display: block;`,
      ul: `margin: 14px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 14px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.8; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 14px auto; border-radius: 10px;`,
      table: `width: 100%; border-collapse: collapse; margin: 14px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7;`,
      th: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; background-color: rgba(127, 127, 127, 0.08); font-weight: 700; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 700; color: inherit; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: inherit; font-family: ${wechatFontFamily};`
    },
    minimal: {
      h1: `font-weight: 300; color: inherit; margin: 30px 0 14px 0; font-size: 28px; text-align: center; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `font-weight: 500; color: inherit; margin: 24px 0 12px 0; font-size: 22px; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `font-weight: 500; color: inherit; margin: 18px 0 8px 0; font-size: 18px; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h4: `font-weight: 600; color: inherit; margin: 16px 0 8px 0; font-size: 17px; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `font-weight: 600; color: inherit; margin: 14px 0 6px 0; font-size: 16px; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `font-weight: 600; color: inherit; margin: 14px 0 6px 0; font-size: 16px; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `color: inherit; margin: 16px 0; font-size: 16px; text-align: justify; text-justify: inter-ideograph; line-height: 1.95; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #576b95; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(127, 127, 127, 0.12); border: 1px solid rgba(127, 127, 127, 0.20); padding: 2px 5px; border-radius: 4px; font-size: 13px; line-height: 1.65; color: inherit; font-family: ${wechatCodeFontFamily}; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(127, 127, 127, 0.06); border: 1px solid rgba(127, 127, 127, 0.16); padding: 14px 14px; border-radius: 10px; margin: 16px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; color: inherit;`,
      blockquote: `border-left: 2px solid rgba(127, 127, 127, 0.36); padding: 12px 14px; margin: 16px 0; color: inherit; font-style: normal; background-color: rgba(127, 127, 127, 0.06); border-radius: 10px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.85; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 10px;`,
      table: `width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7;`,
      th: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; background-color: rgba(127, 127, 127, 0.08); font-weight: 600; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 600; color: inherit; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: inherit; font-family: ${wechatFontFamily};`
    },
    elegant: {
      h1: `text-align: center; font-weight: 700; letter-spacing: 0.5px; margin: 32px 0 16px 0; font-size: 28px; line-height: 1.4; font-family: ${SERIF_FONT_STACK}; display: block; padding-bottom: 10px; border-bottom: 1px solid #DCC9A3;`,
      h2: `color: inherit; border-left: 3px solid #8B6D3B; padding-left: 12px; margin: 24px 0 14px 0; font-size: 22px; font-weight: 600; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: inherit; margin: 20px 0 10px 0; font-size: 18px; font-weight: 600; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h4: `color: inherit; margin: 18px 0 8px 0; font-size: 17px; font-weight: 600; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 16px 0; font-size: 16px; color: inherit; line-height: 1.95; text-align: justify; text-justify: inter-ideograph; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #576b95; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(127, 127, 127, 0.12); border: 1px solid rgba(127, 127, 127, 0.20); color: inherit; padding: 2px 6px; border-radius: 4px; font-size: 13px; line-height: 1.65; font-family: ${wechatCodeFontFamily}; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(127, 127, 127, 0.08); border: 1px solid rgba(127, 127, 127, 0.18); color: inherit; padding: 14px 14px; border-radius: 10px; margin: 16px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; display: block; white-space: pre;`,
      blockquote: `border-left: 3px solid #8B6D3B; padding: 12px 14px; margin: 16px 0; color: inherit; background-color: rgba(139, 109, 59, 0.06); border-radius: 10px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.9; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 10px;`,
      table: `width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7;`,
      th: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; background-color: rgba(139, 109, 59, 0.06); font-weight: 600; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 600; color: inherit; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: inherit; font-family: ${wechatFontFamily};`
    },
    tech: {
      h1: `color: inherit; border-bottom: 2px solid ${TECH_ACCENT}; padding-bottom: 8px; margin: 26px 0 14px 0; font-size: 24px; font-weight: 700; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: inherit; border-left: 4px solid ${TECH_ACCENT}; padding-left: 12px; margin: 22px 0 12px 0; font-size: 20px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: inherit; margin: 18px 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h4: `color: inherit; margin: 16px 0 8px 0; font-size: 17px; font-weight: 700; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 700; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 14px 0; font-size: 16px; line-height: 1.8; color: inherit; text-align: justify; text-justify: inter-ideograph; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #576b95; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(127, 127, 127, 0.12); border: 1px solid rgba(127, 127, 127, 0.20); padding: 2px 6px; border-radius: 4px; font-size: 13px; line-height: 1.65; font-family: ${wechatCodeFontFamily}; color: inherit; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(127, 127, 127, 0.08); border: 1px solid rgba(127, 127, 127, 0.18); padding: 14px 14px; border-radius: 10px; overflow-x: auto; margin: 14px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; border-left: 4px solid ${TECH_ACCENT}; color: inherit;`,
      blockquote: `border-left: 4px solid ${TECH_ACCENT}; padding: 12px 14px; margin: 14px 0; color: inherit; background-color: rgba(79, 70, 229, 0.06); border-radius: 10px; display: block;`,
      ul: `margin: 14px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 14px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.8; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 14px auto; border-radius: 10px;`,
      table: `width: 100%; border-collapse: collapse; margin: 14px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7;`,
      th: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; background-color: rgba(127, 127, 127, 0.08); font-weight: 700; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(127, 127, 127, 0.22); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 700; color: inherit; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: inherit; font-family: ${wechatFontFamily};`
    },
    card: {
      h1: `color: inherit; margin: 24px 0 14px 0; font-size: 24px; font-weight: 700; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: inherit; border-left: 4px solid ${CARD_ACCENT}; padding-left: 12px; margin: 20px 0 12px 0; font-size: 20px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: inherit; margin: 16px 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h4: `color: inherit; margin: 16px 0 8px 0; font-size: 17px; font-weight: 600; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 14px 0; font-size: 16px; line-height: 1.85; color: inherit; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word; background: #f8fafc; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 12px 14px;`,
      a: `color: #0f766e; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.2); padding: 2px 6px; border-radius: 6px; font-size: 13px; line-height: 1.65; color: inherit; font-family: ${wechatCodeFontFamily}; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: #f8fafc; border: 1px solid rgba(16, 185, 129, 0.2); padding: 14px 14px; border-radius: 12px; margin: 16px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; color: inherit; border-left: 4px solid ${CARD_ACCENT};`,
      blockquote: `border-left: 4px solid ${CARD_ACCENT}; padding: 12px 14px; margin: 16px 0; color: inherit; background-color: rgba(16, 185, 129, 0.08); border-radius: 12px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.85; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.25);`,
      table: `width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7; background: #f8fafc; border-radius: 12px; overflow: hidden;`,
      th: `border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 10px; text-align: left; background-color: rgba(16, 185, 129, 0.08); font-weight: 600; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 700; color: inherit; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: inherit; font-family: ${wechatFontFamily};`
    },
    print: {
      h1: `color: inherit; margin: 30px 0 16px 0; font-size: 28px; text-align: center; line-height: 1.4; font-family: ${SERIF_FONT_STACK}; display: block; font-weight: 700; letter-spacing: 0.4px;`,
      h2: `color: inherit; border-left: 3px solid ${PRINT_ACCENT}; padding-left: 12px; margin: 24px 0 12px 0; font-size: 22px; font-weight: 700; line-height: 1.5; font-family: ${SERIF_FONT_STACK}; display: block;`,
      h3: `color: inherit; margin: 18px 0 8px 0; font-size: 18px; font-weight: 600; line-height: 1.5; font-family: ${SERIF_FONT_STACK}; display: block;`,
      h4: `color: inherit; margin: 16px 0 8px 0; font-size: 17px; font-weight: 600; line-height: 1.5; font-family: ${SERIF_FONT_STACK}; display: block;`,
      h5: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${SERIF_FONT_STACK}; display: block;`,
      h6: `color: inherit; margin: 14px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${SERIF_FONT_STACK}; display: block;`,
      p: `margin: 18px 0; font-size: 16px; line-height: 1.95; color: #3A312A; text-align: justify; text-justify: inter-ideograph; font-family: ${SERIF_FONT_STACK}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #8b5a2b; text-decoration: none; font-family: ${SERIF_FONT_STACK}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(176, 137, 104, 0.12); border: 1px solid rgba(176, 137, 104, 0.22); padding: 2px 6px; border-radius: 4px; font-size: 13px; line-height: 1.65; color: inherit; font-family: ${wechatCodeFontFamily}; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(176, 137, 104, 0.08); border: 1px solid rgba(176, 137, 104, 0.22); padding: 14px 14px; border-radius: 10px; margin: 16px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; color: inherit;`,
      blockquote: `border-left: 3px solid ${PRINT_ACCENT}; padding: 12px 14px; margin: 16px 0; color: rgba(58, 49, 42, 0.72); background-color: rgba(176, 137, 104, 0.06); border-radius: 10px; display: block;`,
      ul: `margin: 18px 0; padding-left: 24px; list-style-type: disc; font-family: ${SERIF_FONT_STACK};`,
      ol: `margin: 18px 0; padding-left: 24px; list-style-type: decimal; font-family: ${SERIF_FONT_STACK};`,
      li: `margin: 8px 0; line-height: 1.9; font-family: ${SERIF_FONT_STACK}; word-wrap: break-word; word-break: break-word;`,
      img: `max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 6px; border: 1px solid rgba(176, 137, 104, 0.25);`,
      table: `width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; font-family: ${SERIF_FONT_STACK}; font-size: 15px; line-height: 1.7;`,
      th: `border: 1px solid rgba(176, 137, 104, 0.24); padding: 8px 10px; text-align: left; background-color: rgba(176, 137, 104, 0.08); font-weight: 600; color: inherit; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(176, 137, 104, 0.24); padding: 8px 10px; text-align: left; color: inherit; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 700; color: inherit; font-family: ${SERIF_FONT_STACK};`,
      em: `font-style: italic; color: inherit; font-family: ${SERIF_FONT_STACK};`
    },
    night: {
      h1: `color: #f8fafc; margin: 22px 0 12px 0; font-size: 24px; font-weight: 700; line-height: 1.4; font-family: ${wechatFontFamily}; display: block;`,
      h2: `color: #f8fafc; border-left: 4px solid ${NIGHT_ACCENT}; padding-left: 12px; margin: 18px 0 10px 0; font-size: 20px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h3: `color: #f8fafc; margin: 14px 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.45; font-family: ${wechatFontFamily}; display: block;`,
      h4: `color: #f8fafc; margin: 14px 0 8px 0; font-size: 17px; font-weight: 600; line-height: 1.5; font-family: ${wechatFontFamily}; display: block;`,
      h5: `color: #f8fafc; margin: 12px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      h6: `color: #f8fafc; margin: 12px 0 6px 0; font-size: 16px; font-weight: 600; line-height: 1.55; font-family: ${wechatFontFamily}; display: block;`,
      p: `margin: 14px 0; font-size: 16px; line-height: 1.85; color: #e2e8f0; text-align: justify; text-justify: inter-ideograph; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      a: `color: #7dd3fc; text-decoration: none; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word;`,
      code: `background-color: rgba(30, 41, 59, 0.9); border: 1px solid rgba(148, 163, 184, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 13px; line-height: 1.65; color: #e2e8f0; font-family: ${wechatCodeFontFamily}; word-break: break-all; white-space: pre; display: inline;`,
      pre: `background-color: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.3); padding: 14px 14px; border-radius: 10px; margin: 16px 0; font-family: ${wechatCodeFontFamily}; font-size: 13px; line-height: 1.65; word-break: normal; white-space: pre; display: block; color: #e2e8f0; border-left: 4px solid ${NIGHT_ACCENT};`,
      blockquote: `border-left: 4px solid ${NIGHT_ACCENT}; padding: 12px 14px; margin: 16px 0; color: rgba(226, 232, 240, 0.72); background-color: rgba(15, 23, 42, 0.9); border-radius: 10px; display: block;`,
      ul: `margin: 16px 0; padding-left: 24px; list-style-type: disc; font-family: ${wechatFontFamily};`,
      ol: `margin: 16px 0; padding-left: 24px; list-style-type: decimal; font-family: ${wechatFontFamily};`,
      li: `margin: 8px 0; line-height: 1.85; font-family: ${wechatFontFamily}; word-wrap: break-word; word-break: break-word; color: #e2e8f0;`,
      img: `max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.2);`,
      table: `width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; font-family: ${wechatFontFamily}; font-size: 15px; line-height: 1.7; background: #0f172a;`,
      th: `border: 1px solid rgba(148, 163, 184, 0.3); padding: 8px 10px; text-align: left; background-color: rgba(17, 24, 39, 0.9); font-weight: 600; color: #f8fafc; word-wrap: break-word; word-break: break-word;`,
      td: `border: 1px solid rgba(148, 163, 184, 0.3); padding: 8px 10px; text-align: left; color: #e2e8f0; vertical-align: top; word-wrap: break-word; word-break: break-word;`,
      strong: `font-weight: 700; color: #f8fafc; font-family: ${wechatFontFamily};`,
      em: `font-style: italic; color: #e2e8f0; font-family: ${wechatFontFamily};`
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
      // 跳过已经被标记为标题的p标签
      if (tag === 'p' && attributes && attributes.includes('data-heading=')) {
        return match; // 不修改
      }
      
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
      // 为pre中的code标签添加特殊样式，避免强制换行
      const codeStyle = 'background-color: transparent; border: 0; padding: 0; margin: 0; color: inherit; white-space: pre; font-family: inherit; font-size: inherit; line-height: inherit; display: inline;';

      if (codeAttrs && codeAttrs.includes('style=')) {
        const updatedCodeAttrs = codeAttrs.replace(/style="([^"]*)"/, `style="$1; ${codeStyle}"`);
        return `<pre${preAttrs}><code${updatedCodeAttrs}>`;
      } else {
        return `<pre${preAttrs}><code${codeAttrs} style="${codeStyle}">`;
      }
    }
  );

  // 优化：减少 blockquote / li 内部段落的额外留白（避免 HTML 结构被正则误伤）
  styledHtml = styledHtml.replace(
    /(<blockquote[^>]*>\s*<p[^>]*style=")([^"]*)(")/gi,
    (_m, prefix, style, suffix) => `${prefix}${style.trim()}; margin: 0;${suffix}`
  );

  styledHtml = styledHtml.replace(
    /(<li[^>]*>\s*<p[^>]*style=")([^"]*)(")/gi,
    (_m, prefix, style, suffix) => `${prefix}${style.trim()}; margin: 0;${suffix}`
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
