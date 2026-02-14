/**
 * Markdown 转换模块
 * 使用 Readability 提取正文，Turndown 转换为 Markdown
 */

import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

/**
 * Turndown 配置
 */
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

/**
 * 将页面内容转换为 Markdown
 * @param document 页面 Document 对象
 * @returns Markdown 文本
 */
export function convertToMarkdown(document: Document): string {
  // 克隆 document 避免修改原始 DOM
  const documentClone = document.cloneNode(true) as Document;

  // 使用 Readability 提取正文
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) {
    // Readability 解析失败，回退到 body
    return turndownService.turndown(document.body.innerHTML);
  }

  // 构建完整内容：标题 + 内容
  let content = "";

  if (article.title) {
    content += `# ${article.title}\n\n`;
  }

  if (article.byline) {
    content += `*${article.byline}*\n\n`;
  }

  if (article.content) {
    content += turndownService.turndown(article.content);
  }

  return content;
}
