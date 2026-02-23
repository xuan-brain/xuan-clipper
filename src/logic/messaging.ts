/**
 * 消息类型定义
 * 用于 webext-bridge 跨上下文通信
 */

import type { DetectionResult } from "./page-detector";

// ============ 消息类型常量 ============

/**
 * 消息类型
 */
export const MESSAGE_TYPES = {
  /** Popup -> Content Script: 请求页面类型检测 */
  GET_PAGE_TYPE: "get-page-type",
  /** Popup -> Content Script: 导入论文操作 */
  IMPORT_PAPER: "import-paper",
  /** Popup -> Background: 导出 Markdown 操作 */
  EXPORT_MARKDOWN: "export-markdown",
  /** Popup -> Background: 导入 Clips 操作 */
  IMPORT_CLIPS: "import-clips",
} as const;

// ============ 请求/响应类型 ============

/**
 * 页面类型请求
 */
export interface PageTypeRequest {
  tabId?: number;
}

/**
 * 页面类型响应
 */
export interface PageTypeResponse {
  success: boolean;
  result?: DetectionResult;
  error?: string;
}

/**
 * 导入论文请求
 */
export interface ImportPaperRequest {
  // Future: paper metadata
}

/**
 * 导入论文响应
 */
export interface ImportPaperResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * 导出 Markdown 请求
 */
export interface ExportMarkdownRequest {
  // Future: export options
}

/**
 * 导出 Markdown 响应
 */
export interface ExportMarkdownResponse {
  success: boolean;
  markdown?: string;
  error?: string;
}

/**
 * 导入 Clips 请求
 */
export interface ImportClipsRequest {
  // Future: clip options
}

/**
 * 导入 Clips 响应
 */
export interface ImportClipsResponse {
  success: boolean;
  clipsData?: ClipsData;
  error?: string;
}

/**
 * Clips 数据结构
 */
export interface ClipsData {
  author: string;
  content: string; // Markdown
  excerpt: string;
  published_date: string | null;
  source_domain: string;
  tags: string[];
  thumbnail_url: string | null;
  title: string;
  url: string;
}
