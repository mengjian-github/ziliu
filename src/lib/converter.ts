import { marked } from 'marked';
import { WECHAT_STYLES } from './wechat-themes';

// Re-export for compatibility
export { WECHAT_STYLES };

// 转换Markdown到公众号HTML (预览用)
export function convertToWechat(
  markdown: string,
  styleKey: keyof typeof WECHAT_STYLES = 'default',
  mode: 'day' | 'night' = 'day'
): string {
  // Use convertToWechatInline to ensure the preview exactly matches the content 
  // that will be filled into the WeChat editor (WYSIWYG).
  // This ensures structural consistency (h1 -> p transformation) and style consistency.
  return convertToWechatInline(markdown, styleKey, mode);
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
  styleKey: keyof typeof WECHAT_STYLES = 'default',
  mode: 'day' | 'night' = 'day'
): string {
  // 配置marked选项
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const html = marked(processMathFormulas(markdown)) as string;

  // 预处理HTML，解决格式问题（传入 mode 以正确选择标题样式）
  const cleanedHtml = preprocessHtmlForWechat(html, styleKey, mode);

  // 获取根据样式的内联样式映射
  const theme = WECHAT_STYLES[styleKey] || WECHAT_STYLES.default;
  const inlineStyles = mode === 'night' ? (theme.inlineDark || theme.inline) : theme.inline;

  // 解析HTML并添加内联样式
  let styledHtml = applyInlineStyles(cleanedHtml, inlineStyles);

  // 微信暗黑模式兼容：在日间模式导出时，添加 data-darkmode-* 属性
  // 这样微信 App 的暗黑模式会直接使用我们指定的颜色，而不是靠算法反转（效果很差）
  if (mode === 'day') {
    const darkInlineStyles = theme.inlineDark || theme.inline;
    styledHtml = addWechatDarkModeAttrs(styledHtml, darkInlineStyles);
  }

  // 修复内容中的硬编码浅色背景（如精选文章推荐卡片），使其兼容暗色模式
  // 将常见的浅色背景替换为透明，避免在暗色模式下出现白色色块
  styledHtml = styledHtml
    .replace(/(<div[^>]*style="[^"]*?)background:\s*#(?:F9FAFB|FFFFFF|fff|FFF|f9fafb|ffffff|F3F4F6|f3f4f6|EFF6FF|eff6ff|F0F9FF|f0f9ff)([^"]*")/gi, '$1background: transparent$2')
    .replace(/(<div[^>]*style="[^"]*?)background-color:\s*#(?:F9FAFB|FFFFFF|fff|FFF|f9fafb|ffffff|F3F4F6|f3f4f6|EFF6FF|eff6ff|F0F9FF|f0f9ff)([^"]*")/gi, '$1background-color: transparent$2');

  // 如果主题定义了根样式，包裹一层
  const rootStyle = mode === 'night' ? (theme.rootStyleDark || theme.rootStyle) : theme.rootStyle;
  if (rootStyle) {
    // 日间模式下也为根元素添加暗黑模式属性
    let darkRootAttrs = '';
    if (mode === 'day') {
      const darkRootStyle = theme.rootStyleDark || theme.rootStyle || '';
      darkRootAttrs = buildDarkModeRootAttrs(darkRootStyle);
    }
    return `<section style="${rootStyle}"${darkRootAttrs}>${styledHtml}</section>`;
  }

  return styledHtml;
}

// ============================================================
// 微信暗黑模式兼容工具函数
// ============================================================

/**
 * 从 CSS 内联样式字符串中提取指定属性的值
 * 例如: extractCssProperty('color: #333; background: #fff;', 'color') => '#333'
 */
function extractCssProperty(style: string, prop: string): string | null {
  // 处理带连字符的属性名，如 background-color
  const escapedProp = prop.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|;\\s*|\\s)${escapedProp}\\s*:\\s*([^;]+)`, 'i');
  const match = style.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * 判断颜色值是否是简单的可作为 data 属性的值
 * 排除 gradient、url()、inherit/initial 等复杂值
 */
function isSimpleColor(value: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  if (v.includes('gradient') || v.includes('url(') || v.includes('inherit') || v.includes('initial') || v.includes('unset') || v === 'transparent' || v === 'none') {
    return false;
  }
  return true;
}

/**
 * 为根 section 元素构建暗黑模式数据属性
 */
function buildDarkModeRootAttrs(darkRootStyle: string): string {
  const attrs: string[] = [];
  const darkBg = extractCssProperty(darkRootStyle, 'background-color') || extractCssProperty(darkRootStyle, 'background');
  const darkColor = extractCssProperty(darkRootStyle, 'color');

  if (darkBg && isSimpleColor(darkBg)) {
    attrs.push(`data-darkmode-bgcolor="${darkBg}"`);
  }
  if (darkColor && isSimpleColor(darkColor)) {
    attrs.push(`data-darkmode-color="${darkColor}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * 为 HTML 中的元素添加微信暗黑模式兼容的 data-darkmode-* 属性
 * 
 * 微信公众号 App 在暗黑模式下会：
 * 1. 优先使用 data-darkmode-bgcolor / data-darkmode-color 属性的值
 * 2. 如果没有这些属性，则用算法反转颜色（效果通常较差）
 * 
 * 通过显式指定暗黑模式颜色，可以确保文章在夜间模式下也有良好的视觉效果。
 */
function addWechatDarkModeAttrs(html: string, darkStyles: Record<string, string>): string {
  let result = html;

  for (const [tag, darkStyle] of Object.entries(darkStyles)) {
    const darkBgColor = extractCssProperty(darkStyle, 'background-color') || extractCssProperty(darkStyle, 'background');
    const darkColor = extractCssProperty(darkStyle, 'color');

    // 如果没有有效的暗黑色值，跳过
    if (!darkBgColor && !darkColor) continue;

    // 构建 data-darkmode 属性
    const attrs: string[] = [];
    if (darkBgColor && isSimpleColor(darkBgColor)) {
      attrs.push(`data-darkmode-bgcolor="${darkBgColor}"`);
    }
    if (darkColor && isSimpleColor(darkColor)) {
      attrs.push(`data-darkmode-color="${darkColor}"`);
    }
    if (attrs.length === 0) continue;
    const attrStr = ' ' + attrs.join(' ');

    // 标题（h1/h2/h3/h4/h5/h6）已在预处理阶段被转为 <p data-heading="hX">
    if (/^h[1-6]$/.test(tag)) {
      const headingRegex = new RegExp(`<p([^>]*data-heading="${tag}"[^>]*)>`, 'gi');
      result = result.replace(headingRegex, (match, existing) => {
        if (match.includes('data-darkmode-')) return match;
        return `<p${existing}${attrStr}>`;
      });
    } else {
      // 普通标签: p, blockquote, pre, code, th, td, ul, ol, li, a, img 等
      const tagRegex = new RegExp(`<${tag}([^>]*style="[^"]*"[^>]*)>`, 'gi');
      result = result.replace(tagRegex, (match, existing) => {
        if (match.includes('data-darkmode-')) return match;
        // 跳过已被标记为标题的 <p> 标签
        if (tag === 'p' && existing.includes('data-heading=')) return match;
        return `<${tag}${existing}${attrStr}>`;
      });
    }
  }

  return result;
}

// 处理 LaTeX 公式
function processMathFormulas(markdown: string): string {
  return markdown
    // 处理块级公式 $$...$$
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
      const encoded = encodeURIComponent(formula.trim());
      // 使用 Codecogs 生成图片，使用 \dpi{300} 提高清晰度
      return `<img class="formula-block" style="display:block; margin: 16px auto; max-width: 100%; height: auto;" src="https://latex.codecogs.com/png.latex?\\dpi{300}&space;${encoded}" alt="${formula.trim()}" />`;
    })
    // 处理行内公式 $...$
    .replace(/\$([^\s\n$](?:[^\n$]*?[^\s\n$])?)\$/g, (_match, formula) => {
      const encoded = encodeURIComponent(formula.trim());
      return `<img class="formula-inline" style="display:inline-block; vertical-align:middle; margin: 0 4px; height: auto;" src="https://latex.codecogs.com/png.latex?\\dpi{300}&space;${encoded}" alt="${formula.trim()}" />`;
    });
}

// 预处理HTML，解决微信公众号编辑器的格式问题
function preprocessHtmlForWechat(html: string, styleKey: keyof typeof WECHAT_STYLES, mode: 'day' | 'night' = 'day'): string {
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
          .replace(/ {2}/g, '&nbsp;&nbsp;')
          .replace(/\n/g, '<br/>');
        return `<pre><code${codeAttrs}>${protectedCode}</code></pre>`;
      }
    );
    processedHtml = processedHtml.replace(`__CODE_BLOCK_${index}__`, protectedBlock);
  });

  // 2.5 兼容微信公众号：将 h1/h2/h3 转为等价的 p 内联样式（使用当前主题样式），避免 h 标签被剥离
  // 获取当前主题的 header 样式作为基础（根据 mode 选择日间/夜间样式）
  const theme = WECHAT_STYLES[styleKey] || WECHAT_STYLES.default;
  const inlineStyles = mode === 'night' ? (theme.inlineDark || theme.inline) : theme.inline;
  const h1Style = inlineStyles.h1 || '';
  const h2Style = inlineStyles.h2 || '';
  const h3Style = inlineStyles.h3 || '';
  const h4Style = inlineStyles.h4 || h3Style || '';
  const h5Style = inlineStyles.h5 || h4Style || h3Style || '';
  const h6Style = inlineStyles.h6 || h5Style || h4Style || h3Style || '';

  processedHtml = processedHtml
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, text) => `<p data-heading="h1" style="${h1Style}">${text}</p>`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, text) => `<p data-heading="h2" style="${h2Style}">${text}</p>`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, text) => `<p data-heading="h3" style="${h3Style}">${text}</p>`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, text) => `<p data-heading="h4" style="${h4Style}">${text}</p>`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_m, text) => `<p data-heading="h5" style="${h5Style}">${text}</p>`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_m, text) => `<p data-heading="h6" style="${h6Style}">${text}</p>`);

  // 2.6 扩展：步骤徽章与结论卡片

  // 使用当前主题的强调色
  const accent = (WECHAT_STYLES[styleKey] || WECHAT_STYLES.default).accent;

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
          <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:9999px; background:${accent}; color:#fff; font-size:12px; font-weight:700; flex-shrink: 0;">${idx}</span>
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
    .replace(/(<\/li>)\s*(<li>)/g, '$1$2')
    .replace(/(<\/[uo]l>)\s*(<[^>]+>)/g, '$1$2');

  // 5. 移除可能导致问题的section标签
  processedHtml = processedHtml
    .replace(/<section[^>]*>/g, '<div>')
    .replace(/<\/section>/g, '</div>');

  // 6. 表格支持：包裹 scroll wrapper + 斑马纹
  processedHtml = processedHtml.replace(
    /<table[^>]*>([\s\S]*?)<\/table>/gi,
    (match) => {
      // 先提取表格内部内容
      let tableInner = match.replace(/<table[^>]*>/i, '').replace(/<\/table>/i, '');
      // 为偶数行 <tr> 添加斑马纹背景
      let rowIndex = 0;
      tableInner = tableInner.replace(/<tr([^>]*)>/gi, (trMatch, trAttrs) => {
        rowIndex++;
        // 跳过第一行（通常是 thead tr），从第2行开始算偶数行
        if (rowIndex > 1 && rowIndex % 2 === 0) {
          if (trAttrs && trAttrs.includes('style=')) {
            return trMatch.replace(/style="([^"]*)"/, 'style="$1; background: rgba(127,127,127,0.04);"');
          }
          return `<tr${trAttrs} style="background: rgba(127,127,127,0.04);">`;
        }
        return trMatch;
      });
      return `<section style="overflow-x: auto; max-width: 100%; margin: 20px 0;"><table style="border-collapse: collapse; width: 100%; font-size: 14px; min-width: 100%;">${tableInner}</table></section>`;
    }
  );

  // 7. 将 <hr> 转换为安全的分割线容器
  processedHtml = processedHtml.replace(/<hr\s*\/?>/gi, '<div style="margin: 24px 0; border-top: 1px solid rgba(127, 127, 127, 0.28);"></div>');

  return processedHtml;
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

      // 跳过已经被处理过的table/th/td (避免重复添加style如果已经有)
      // 但我们需要确保样式被合并

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

  // 优化：减少 blockquote / li 内部段落的额外留白
  styledHtml = styledHtml.replace(
    /(<blockquote[^>]*>\s*<p[^>]*style=")([^"]*)(")/gi,
    (_m, prefix, style, suffix) => `${prefix}${style.trim()}; margin: 0;${suffix}`
  );

  styledHtml = styledHtml.replace(
    /(<li[^>]*>\s*<p[^>]*style=")([^"]*)(")/gi,
    (_m, prefix, style, suffix) => `${prefix}${style.trim()}; margin: 4px 0; text-align: left;${suffix}`
  );

  // 添加微信编辑器需要的属性
  styledHtml = styledHtml.replace(/<p([^>]*style="[^"]*")([^>]*)>/gi, (match) => {
    if (!match.includes('data-tools=')) {
      return match.replace('>', ' data-tools="135editor">');
    }
    return match;
  });

  // 确保图片有正确的样式 (不覆盖公式图片)
  styledHtml = styledHtml.replace(/<img([^>]*)>/gi, (match, attrs) => {
    // 如果是公式，跳过默认图片样式
    if (attrs.includes('class="formula')) {
      return match;
    }

    if (!attrs.includes('style=')) {
      // 默认图片样式
      return `<img${attrs} style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">`;
    }
    return match;
  });

  return styledHtml;
}

/**
 * 转换 Markdown 到知识星球优化 HTML
 * 
 * zsxq API 的 CSS 白名单非常严格，只保留以下属性的值：
 * display, font-size, color, margin, text-align, line-height
 * 
 * 其他属性（background, padding, font-weight, border, border-radius,
 * box-shadow, font-family 等）的值会被剥掉，只留下属性名。
 * 
 * 策略：
 * - 用 font-size + color 区分标题层次
 * - 用 <strong> 标签实现粗体（font-weight CSS 被剥掉）
 * - 用 color 做视觉区分（引用、代码等）
 * - 保持良好的 margin 垂直节奏
 * - 不使用任何会被剥掉的属性
 */
export function convertToZsxq(markdown: string, styleKey: string = 'default'): string {
  marked.setOptions({ breaks: true, gfm: true });

  const html = marked(processMathFormulas(markdown)) as string;

  // 从主题系统读取 inline 样式，提取安全的 CSS 属性给知识星球
  const theme = WECHAT_STYLES[styleKey] || WECHAT_STYLES.default;
  const themeInline = theme.inline;

  // 知识星球 CSS 白名单属性提取器：只保留安全属性
  const zsxqSafe = (style: string): string => {
    const safeProps = ['display', 'font-size', 'font-weight', 'color', 'margin', 'line-height', 'text-align', 'border-left', 'padding-left', 'padding-bottom', 'border-bottom'];
    const parts: string[] = [];
    for (const prop of safeProps) {
      const val = extractCssProperty(style, prop);
      if (val) parts.push(`${prop}: ${val}`);
    }
    return parts.join('; ');
  };

  // 从主题 inline 样式中提取知识星球安全样式
  const S = {
    h1: zsxqSafe(themeInline.h1 || '') || 'display: block; font-size: 24px; color: #1a1a1a; margin: 36px 0 20px; line-height: 1.5; text-align: center',
    h2: zsxqSafe(themeInline.h2 || '') || 'display: block; font-size: 20px; color: #2563EB; margin: 40px 0 20px; line-height: 1.5; text-align: center',
    h3: zsxqSafe(themeInline.h3 || '') || 'display: block; font-size: 17px; color: #1a1a1a; margin: 32px 0 14px; line-height: 1.4',
    h4: zsxqSafe(themeInline.h3 || '') || 'display: block; font-size: 17px; color: #374151; margin: 24px 0 10px; line-height: 1.4',
    p:  zsxqSafe(themeInline.p || '') || 'display: block; font-size: 16px; color: #333333; margin: 20px 0; line-height: 2.0; text-align: left',
    blockquote: zsxqSafe(themeInline.blockquote || '') || 'display: block; color: #6B7280; font-size: 15px; margin: 20px 0; line-height: 1.8; border-left: 4px solid #2563EB; padding-left: 16px',
    pre: 'display: block; font-size: 13px; color: #1F2937; margin: 20px 0; line-height: 1.6',
    code: `display: inline; font-size: 14px; color: ${theme.accent}`,
    li:  zsxqSafe(themeInline.li || '') || 'display: block; font-size: 16px; color: #333333; margin: 8px 0; line-height: 1.9',
    img: 'display: block; margin: 24px 0',
    a:   `color: ${theme.accent}`,
    hr:  'display: block; margin: 36px 0; line-height: 0.5; text-align: center; color: #D1D5DB',
    th:  'font-size: 14px; color: #1F2937; text-align: left',
    td:  'font-size: 14px; color: #374151',
    strong: 'color: #111827',
  };

  let result = html;

  // --- 标题：转为 <p> + <strong>，用 font-size 和 color 区分层次 ---
  result = result
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) =>
      `<p style="${S.h1}"><strong style="${S.strong}">${t}</strong></p>`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) =>
      `<p style="${S.h2}"><strong style="color: inherit">${t}</strong></p>`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) =>
      `<p style="${S.h3}"><strong style="${S.strong}">${t}</strong></p>`)
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, t) =>
      `<p style="${S.h4}"><strong style="${S.strong}">${t}</strong></p>`);

  // --- 段落 ---
  result = result.replace(/<p([^>]*)>/gi, (match, attrs) => {
    // 跳过已处理的（带 style 的）
    if (attrs && attrs.includes('style=')) return match;
    return `<p style="${S.p}">`;
  });

  // --- 引用块 ---
  result = result.replace(/<blockquote>/gi, `<blockquote style="${S.blockquote}">`);
  result = result.replace(/<\/blockquote>/gi, '</blockquote>');

  // --- 代码块 ---
  // 保护代码块内容
  result = result.replace(
    /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
    (_match, codeAttrs, codeContent) => {
      const protectedCode = String(codeContent)
        .replace(/\t/g, '    ')
        .replace(/\n/g, '<br/>');
      return `<p style="${S.pre}"><code${codeAttrs} style="${S.code}">${protectedCode}</code></p>`;
    }
  );

  // --- 行内代码 ---
  result = result.replace(/<code>([^<]+)<\/code>/g,
    (_, content) => `<code style="${S.code}">「${content}」</code>`);

  // --- 列表：转为 div + 文本符号 ---
  // 有序列表
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, listContent) => {
    let counter = 1;
    const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, liContent: string) => {
      const clean = liContent.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '');
      return `<p style="${S.li}">${counter++}. ${clean}</p>`;
    });
    return `<div style="margin: 14px 0">${items}</div>`;
  });

  // 无序列表
  result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, listContent) => {
    const items = listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, liContent: string) => {
      const clean = liContent.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '');
      return `<p style="${S.li}">• ${clean}</p>`;
    });
    return `<div style="margin: 14px 0">${items}</div>`;
  });

  // --- 图片 ---
  result = result.replace(/<img([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('class="formula')) return match; // 保留公式图片
    // 只保留 src 和 alt
    const srcMatch = attrs.match(/src="([^"]*)"/i);
    const altMatch = attrs.match(/alt="([^"]*)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1] : '';
    return `<img src="${src}" alt="${alt}" style="${S.img}">`;
  });

  // --- 链接 ---
  result = result.replace(/<a([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('style=')) return match;
    const hrefMatch = attrs.match(/href="([^"]*)"/i);
    const href = hrefMatch ? hrefMatch[1] : '';
    return `<a href="${href}" style="${S.a}">`;
  });

  // --- 分割线（用文本替代，因为 border 会被剥掉）---
  result = result.replace(/<hr\s*\/?>/gi,
    `<p style="${S.hr}">—— ✦ ——</p>`);

  // --- 表格 ---
  result = result.replace(/<th([^>]*)>/gi, `<th style="${S.th}">`);
  result = result.replace(/<td([^>]*)>/gi, `<td style="${S.td}">`);

  // --- 加粗标签增强 ---
  result = result.replace(/<strong>/gi, `<strong style="${S.strong}">`);

  // --- 清理 ---
  result = result
    .replace(/>\s+</g, '><') // 清理标签间空白
    .replace(/<section[^>]*>/gi, '<div>')
    .replace(/<\/section>/gi, '</div>');

  return result;
}

// 预览转换结果
export function previewConversion(markdown: string, styleKey: keyof typeof WECHAT_STYLES = 'default', mode: 'day' | 'night' = 'day', platform: string = 'wechat') {
  const wordCount = markdown.replace(/\s/g, '').length;
  const readingTime = Math.ceil(wordCount / 300);

  // 知识星球使用专属转换器（跟随主题）
  if (platform === 'zsxq') {
    const html = convertToZsxq(markdown, styleKey as string);
    return {
      html,
      inlineHtml: html,
      wordCount,
      readingTime,
      style: '知识星球',
    };
  }

  const html = convertToWechat(markdown, styleKey, mode);
  const inlineHtml = convertToWechatInline(markdown, styleKey, mode);

  return {
    html, // 用于预览的HTML（带CSS类）
    inlineHtml, // 用于公众号编辑器的HTML（内联样式）
    wordCount,
    readingTime,
    style: (WECHAT_STYLES[styleKey] || WECHAT_STYLES.default).name,
  };
}
