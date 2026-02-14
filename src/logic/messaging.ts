/**
 * 消息类型定义
 * 用于 webext-bridge 跨上下文通信
 */

import type { DetectionResult } from './page-detector'

// ============ 消息类型常量 ============

/**
 * 消息类型
 */
export const MESSAGE_TYPES = {
  /** Popup -> Content Script: 请求页面类型检测 */
  GET_PAGE_TYPE: 'get-page-type',
  /** Popup -> Content Script: 导入论文操作 */
  IMPORT_PAPER: 'import-paper',
  /** Popup -> Content Script: 导出 Markdown 操作 */
  EXPORT_MARKDOWN: 'export-markdown',
} as const

// ============ 请求/响应类型 ============

/**
 * 页面类型请求
 */
export interface PageTypeRequest {
  tabId?: number
}

/**
 * 页面类型响应
 */
export interface PageTypeResponse {
  success: boolean
  result?: DetectionResult
  error?: string
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
  success: boolean
  error?: string
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
  success: boolean
  error?: string
}
