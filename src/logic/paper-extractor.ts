/**
 * 论文内容提取模块
 * 提取页面 HTML 内容
 */

/**
 * 需要排除的元素选择器
 */
const EXCLUDED_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "footer",
  ".navigation",
  ".menu",
  ".sidebar",
  ".ads",
  ".advertisement",
  ".cookie-banner",
  ".popup",
  ".modal",
];

/**
 * 提取页面 HTML 内容
 * @param document 页面 Document 对象
 * @returns HTML 内容字符串
 */
export function extractPaperContent(document: Document): string {
  // 克隆 document 以避免修改原始页面
  const documentClone = document.cloneNode(true) as Document;

  // 移除不需要的元素
  EXCLUDED_SELECTORS.forEach((selector) => {
    try {
      documentClone.querySelectorAll(selector).forEach((el) => el.remove());
    } catch {
      // 忽略选择器错误
    }
  });

  // 返回整个页面的 HTML
  return documentClone.documentElement.outerHTML;
}
