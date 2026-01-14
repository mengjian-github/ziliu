export interface ExtractedImage {
  url: string;
  alt?: string;
  title?: string;
  /**
   * Raw snippet where the image came from (best-effort).
   * Useful for debugging but should not be relied on for logic.
   */
  raw?: string;
}

/**
 * Simple Markdown -> plain text conversion for short-form platforms.
 * Intentionally conservative (drops code blocks, strips most markup).
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';

  const text = String(markdown);
  return text
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Inline code
    .replace(/`([^`]+)`/g, '$1')
    // Images: ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1')
    // Links: [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)')
    // Quotes / headings
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Emphasis
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeUrl(url: string): string {
  return String(url || '').trim();
}

/**
 * Extract images from Markdown and inline HTML.
 * Supports:
 * - Inline images: ![alt](url "title")
 * - Reference images: ![alt][id] with [id]: url "title"
 * - HTML: <img src="...">
 */
export function extractImagesFromMarkdown(markdown: string): ExtractedImage[] {
  if (!markdown) return [];

  const input = String(markdown);
  const results: ExtractedImage[] = [];
  const seen = new Set<string>();

  // 1) Reference definitions: [id]: url "title"
  const refMap = new Map<string, { url: string; title?: string }>();
  const refDefRegex =
    /^\s*\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))(?:\s+(?:"([^"]+)"|'([^']+)'|\(([^)]+)\)))?\s*$/gm;

  for (const match of input.matchAll(refDefRegex)) {
    const id = (match[1] || '').trim().toLowerCase();
    const url = normalizeUrl(match[2] || match[3] || '');
    const title = (match[4] || match[5] || match[6] || '').trim() || undefined;
    if (id && url) refMap.set(id, { url, title });
  }

  const pushImage = (image: ExtractedImage) => {
    const url = normalizeUrl(image.url);
    if (!url) return;
    if (seen.has(url)) return;
    seen.add(url);
    results.push({ ...image, url });
  };

  // 2) Inline images: ![alt](...)
  const inlineImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  for (const match of input.matchAll(inlineImgRegex)) {
    const alt = (match[1] || '').trim() || undefined;
    const inside = (match[2] || '').trim();

    // Parse "(<url> \"title\")" or "(url \"title\")"
    let url = '';
    let title: string | undefined;
    if (inside.startsWith('<') && inside.includes('>')) {
      const end = inside.indexOf('>');
      url = inside.slice(1, end).trim();
      const rest = inside.slice(end + 1).trim();
      title = extractTitle(rest);
    } else {
      const parts = inside.split(/\s+/);
      url = parts[0] || '';
      title = extractTitle(inside.slice(url.length).trim());
    }

    pushImage({ url, alt, title, raw: match[0] });
  }

  // 3) Reference-style images: ![alt][id] / ![alt][]
  const refImgRegex = /!\[([^\]]*)\]\[([^\]]*)\]/g;
  for (const match of input.matchAll(refImgRegex)) {
    const alt = (match[1] || '').trim() || undefined;
    const rawId = (match[2] || '').trim();
    const id = (rawId || (alt || '')).trim().toLowerCase();
    const ref = id ? refMap.get(id) : undefined;
    if (!ref?.url) continue;
    pushImage({ url: ref.url, alt, title: ref.title, raw: match[0] });
  }

  // 4) HTML images: <img ... src="...">
  const htmlImgTagRegex = /<img\b[^>]*>/gi;
  for (const match of input.matchAll(htmlImgTagRegex)) {
    const tag = match[0] || '';
    const src = extractHtmlAttr(tag, 'src');
    if (!src) continue;
    const alt = extractHtmlAttr(tag, 'alt') || undefined;
    pushImage({ url: src, alt, raw: tag });
  }

  return results;
}

function extractTitle(rest: string): string | undefined {
  if (!rest) return undefined;
  const trimmed = rest.trim();

  // "title" / 'title' / (title)
  const m =
    trimmed.match(/^"([^"]+)"\s*$/) ||
    trimmed.match(/^'([^']+)'\s*$/) ||
    trimmed.match(/^\(([^)]+)\)\s*$/);
  if (m) return (m[1] || '').trim() || undefined;

  // If AI/Markdown provides unquoted title, keep it as-is (best effort)
  return trimmed ? trimmed : undefined;
}

function extractHtmlAttr(tag: string, attr: string): string | '' {
  try {
    const re = new RegExp(`\\s${attr}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, 'i');
    const m = tag.match(re);
    return normalizeUrl(m?.[1] || m?.[2] || m?.[3] || '');
  } catch {
    return '';
  }
}

