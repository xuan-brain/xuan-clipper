/**
 * 网页元数据提取模块
 * 从页面中提取作者、摘要、发布日期、缩略图等信息
 */

/**
 * 网页元数据接口
 */
export interface WebpageMetadata {
  author: string;
  excerpt: string;
  published_date: string | null;
  thumbnail_url: string | null;
  title: string;
  url: string;
  source_domain: string;
  tags: string[];
}

/**
 * 从 meta 标签获取内容
 */
function getMetaContent(document: Document, name: string, property: string): string | null {
  // 先尝试 property 属性 (Open Graph)
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (meta?.getAttribute("content")) {
    return meta.getAttribute("content");
  }

  // 再尝试 name 属性
  meta = document.querySelector(`meta[name="${name}"]`);
  if (meta?.getAttribute("content")) {
    return meta.getAttribute("content");
  }

  return null;
}

/**
 * 获取多个 meta 标签内容（用于 tags）
 */
function getMetaContents(document: Document, property: string): string[] {
  const metas = document.querySelectorAll(`meta[property="${property}"]`);
  const results: string[] = [];

  for (const meta of Array.from(metas)) {
    const content = meta.getAttribute("content");
    if (content) {
      results.push(content);
    }
  }

  return results;
}

/**
 * 将相对 URL 转换为绝对 URL
 */
function makeAbsoluteUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  try {
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  } catch {
    return null;
  }
}

/**
 * 提取网页元数据
 * @param document 页面 Document 对象
 * @param url 页面 URL
 * @returns 网页元数据
 */
export function extractWebpageMetadata(
  document: Document,
  url: string,
): WebpageMetadata {
  // 解析 URL 获取域名
  let source_domain = "";
  try {
    const urlObj = new URL(url);
    source_domain = urlObj.hostname;
  } catch {
    source_domain = "unknown";
  }

  // 1. 提取标题
  let title = "";
  title = getMetaContent(document, "", "og:title") || "";
  if (!title) {
    title = getMetaContent(document, "twitter:title", "") || "";
  }
  if (!title) {
    title = document.title || "";
  }

  // 2. 提取作者
  let author = "";
  author = getMetaContent(document, "author", "article:author") || "";
  if (!author) {
    author = getMetaContent(document, "", "og:article:author") || "";
  }
  if (!author) {
    author = "Unknown";
  }

  // 3. 提取摘要
  let excerpt = "";
  excerpt = getMetaContent(document, "description", "og:description") || "";
  if (!excerpt) {
    excerpt = getMetaContent(document, "", "twitter:description") || "";
  }

  // 4. 提取发布日期
  let published_date: string | null = null;
  published_date = getMetaContent(document, "", "article:published_time") || "";
  if (!published_date) {
    published_date = getMetaContent(document, "", "article:modified_time") || "";
  }
  if (!published_date) {
    published_date = getMetaContent(document, "date", "") || "";
  }
  if (!published_date) {
    // 尝试从 time 元素获取
    const timeEl = document.querySelector("time[datetime]");
    if (timeEl?.getAttribute("datetime")) {
      published_date = timeEl.getAttribute("datetime") || "";
    }
  }
  // 如果没有找到日期，设为 null
  if (!published_date) {
    published_date = null;
  }

  // 5. 提取缩略图
  let thumbnail_url: string | null = null;
  thumbnail_url = getMetaContent(document, "", "og:image") || "";
  if (!thumbnail_url) {
    thumbnail_url = getMetaContent(document, "", "twitter:image") || "";
  }
  thumbnail_url = makeAbsoluteUrl(thumbnail_url, url);

  // 6. 提取标签
  const tags = getMetaContents(document, "article:tag");

  return {
    author,
    excerpt,
    published_date,
    thumbnail_url,
    title,
    url,
    source_domain,
    tags,
  };
}
