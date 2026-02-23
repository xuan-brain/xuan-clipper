# 任务 1.1: 页面类型识别模块 - 实现计划

## 一、背景

### 1.1 项目背景
本文档是 Xuan Clipper 浏览器扩展开发计划中的任务 1.1 实现计划。Xuan Clipper 是一个跨浏览器（Chrome / Edge / Firefox，Manifest V3）扩展，核心功能是：
1. 自动识别当前页面是否为"论文页面"
2. 论文页面：提取论文元信息，按 JSON 协议发送给本地程序
3. 非论文页面：将网页内容转换为 Markdown，发送给本地程序

### 1.2 任务目标
创建一个模块来检测当前页面是"论文页面"还是"普通网页"，输出 `pageType: "paper" | "webpage"` 用于后续处理分支。

### 1.3 所属阶段
**阶段 1: 核心逻辑模块开发**

### 1.4 性能要求
- 页面类型判断时间：< 100ms
- 对重复 URL 使用缓存机制

---

## 二、需要创建/修改的文件

### 2.1 新建文件

| 文件路径 | 说明 |
|---------|------|
| `src/logic/page-detector.ts` | 页面类型识别核心模块 |
| `src/logic/__tests__/page-detector.test.ts` | 单元测试文件 |

### 2.2 修改文件

| 文件路径 | 修改内容 |
|---------|----------|
| `src/logic/storage.ts` | 添加检测配置存储和手动标记存储 |
| `src/logic/index.ts` | 导出 PageDetector 和相关类型 |

---

## 三、详细设计

### 3.1 TypeScript 接口定义

#### 3.1.1 DetectionResult - 检测结果接口

```typescript
/**
 * 页面类型检测结果
 */
export interface DetectionResult {
  /** 页面类型: paper 或 webpage */
  pageType: 'paper' | 'webpage'
  /** 检测来源 */
  source: DetectionSource
  /** 检测到的平台名称（仅当 pageType 为 paper 时有效） */
  platform?: string
  /** 置信度 (0-1) */
  confidence: number
  /** 检测耗时 (ms) */
  duration: number
  /** 匹配的具体信息 */
  details?: {
    /** 匹配的 URL 规则（如果通过 URL 匹配） */
    matchedRule?: string
    /** 匹配的 meta 标签列表（如果通过 meta 匹配） */
    matchedMetaTags?: string[]
    /** JSON-LD 类型（如果通过 JSON-LD 匹配） */
    jsonLdType?: string
  }
}
```

#### 3.1.2 DetectionSource - 检测来源枚举

```typescript
/**
 * 检测来源类型（按优先级从高到低）
 */
export type DetectionSource =
  | 'url-rule'      // URL 规则匹配（最高优先级）
  | 'meta-tag'      // HTML meta 标签检测
  | 'json-ld'       // JSON-LD / schema.org 检测
  | 'manual-mark'   // 用户手动标记
  | 'default'       // 默认值（webpage）
```

#### 3.1.3 UrlRule - URL 规则接口

```typescript
/**
 * URL 匹配规则
 */
export interface UrlRule {
  /** 规则唯一标识 */
  id: string
  /** 平台名称 */
  platform: string
  /** URL 正则表达式模式 */
  pattern: RegExp
  /** 是否启用 */
  enabled: boolean
  /** 优先级（数字越大优先级越高） */
  priority: number
  /** 规则描述 */
  description?: string
}
```

#### 3.1.4 MetaTagConfig - Meta 标签检测配置

```typescript
/**
 * Meta 标签检测配置
 */
export interface MetaTagConfig {
  /** 是否启用 meta 标签检测 */
  enabled: boolean
  /** 需要检测的 meta 标签名称列表 */
  tagNames: string[]
  /** 判定为论文页面所需的最少标签数量 */
  minTagCount: number
  /** 必须存在的标签（至少一个） */
  requiredTags: string[]
}
```

#### 3.1.5 ManualMark - 手动标记接口

```typescript
/**
 * 用户手动标记记录
 */
export interface ManualMark {
  /** 标记的 URL 或域名模式 */
  pattern: string
  /** 标记类型 */
  pageType: 'paper' | 'webpage'
  /** 创建时间戳 */
  createdAt: number
  /** 过期时间戳（可选，0 表示永不过期） */
  expiresAt: number
}
```

#### 3.1.6 DetectionConfig - 检测配置接口

```typescript
/**
 * 页面类型检测配置
 */
export interface DetectionConfig {
  /** 是否启用 URL 规则检测 */
  enableUrlRules: boolean
  /** 是否启用 meta 标签检测 */
  enableMetaTags: boolean
  /** 是否启用 JSON-LD 检测 */
  enableJsonLd: boolean
  /** 是否启用手动标记 */
  enableManualMarks: boolean
  /** 缓存 TTL（毫秒），默认 5 分钟 */
  cacheTtl: number
  /** Meta 标签检测配置 */
  metaTagConfig: MetaTagConfig
  /** 自定义 URL 规则（用户添加） */
  customUrlRules: UrlRule[]
}
```

#### 3.1.7 CacheEntry - 缓存条目接口

```typescript
/**
 * 检测结果缓存条目
 */
interface CacheEntry {
  /** 检测结果 */
  result: DetectionResult
  /** 缓存时间戳 */
  timestamp: number
  /** 原始 URL */
  url: string
}
```

### 3.2 PageDetector 类设计

```typescript
/**
 * 页面类型检测器
 */
export class PageDetector {
  private config: DetectionConfig
  private cache: Map<string, CacheEntry>
  private manualMarks: ManualMark[]
  private builtinUrlRules: UrlRule[]

  constructor(config?: Partial<DetectionConfig>)

  /**
   * 主检测方法 - 按优先级依次执行各检测策略
   * @param url 页面 URL
   * @param document 页面 Document 对象
   * @returns 检测结果
   */
  async detect(url: string, document: Document): Promise<DetectionResult>

  /**
   * URL 规则匹配检测
   * @param url 页面 URL
   * @returns 检测结果或 null
   */
  private detectByUrl(url: string): DetectionResult | null

  /**
   * HTML meta 标签检测
   * @param document 页面 Document 对象
   * @returns 检测结果或 null
   */
  private detectByMeta(document: Document): DetectionResult | null

  /**
   * JSON-LD / schema.org 检测
   * @param document 页面 Document 对象
   * @returns 检测结果或 null
   */
  private detectByJsonLd(document: Document): DetectionResult | null

  /**
   * 用户手动标记检测
   * @param url 页面 URL
   * @returns 检测结果或 null
   */
  private detectByManualMark(url: string): DetectionResult | null

  /**
   * 添加手动标记
   * @param pattern URL 模式（支持通配符）
   * @param pageType 页面类型
   * @param expiresAt 过期时间（可选）
   */
  addManualMark(pattern: string, pageType: 'paper' | 'webpage', expiresAt?: number): void

  /**
   * 移除手动标记
   * @param pattern URL 模式
   */
  removeManualMark(pattern: string): boolean

  /**
   * 获取所有手动标记
   * @returns 手动标记列表
   */
  getManualMarks(): ManualMark[]

  /**
   * 更新配置
   * @param config 新配置（部分）
   */
  updateConfig(config: Partial<DetectionConfig>): void

  /**
   * 清除缓存
   * @param url 可选，指定 URL 则只清除该 URL 的缓存
   */
  clearCache(url?: string): void

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void

  /**
   * 从缓存获取结果
   */
  private getFromCache(url: string): DetectionResult | null

  /**
   * 保存结果到缓存
   */
  private saveToCache(url: string, result: DetectionResult): void
}
```

### 3.3 内置论文平台 URL 规则

```typescript
/**
 * 内置的论文平台 URL 规则列表
 */
const BUILTIN_URL_RULES: UrlRule[] = [
  // arXiv
  {
    id: 'arxiv-abs',
    platform: 'arXiv',
    pattern: /^https?:\/\/arxiv\.org\/abs\/\d+\.\d+/i,
    enabled: true,
    priority: 100,
    description: 'arXiv 摘要页'
  },
  {
    id: 'arxiv-pdf',
    platform: 'arXiv',
    pattern: /^https?:\/\/arxiv\.org\/pdf\/\d+\.\d+/i,
    enabled: true,
    priority: 100,
    description: 'arXiv PDF 页'
  },

  // PubMed
  {
    id: 'pubmed',
    platform: 'PubMed',
    pattern: /^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+/i,
    enabled: true,
    priority: 100,
    description: 'PubMed 文章页'
  },

  // IEEE Xplore
  {
    id: 'ieee',
    platform: 'IEEE',
    pattern: /^https?:\/\/(ieeexplore\.ieee\.org\/document\/\d+|.*\.ieee\.org\/.*\/article\/)/i,
    enabled: true,
    priority: 90,
    description: 'IEEE Xplore 文章页'
  },

  // ACM Digital Library
  {
    id: 'acm',
    platform: 'ACM',
    pattern: /^https?:\/\/dl\.acm\.org\/doi\/(abs|full|pdf)\/.+/i,
    enabled: true,
    priority: 90,
    description: 'ACM Digital Library 文章页'
  },

  // Springer
  {
    id: 'springer',
    platform: 'Springer',
    pattern: /^https?:\/\/link\.springer\.com\/(article|chapter|book)\/.+/i,
    enabled: true,
    priority: 90,
    description: 'Springer Link 文章页'
  },

  // ScienceDirect (Elsevier)
  {
    id: 'sciencedirect',
    platform: 'ScienceDirect',
    pattern: /^https?:\/\/www\.sciencedirect\.com\/science\/article\/.+/i,
    enabled: true,
    priority: 90,
    description: 'ScienceDirect 文章页'
  },

  // Wiley
  {
    id: 'wiley',
    platform: 'Wiley',
    pattern: /^https?:\/\/onlinelibrary\.wiley\.com\/doi\/(abs|full|pdf)\/.+/i,
    enabled: true,
    priority: 90,
    description: 'Wiley Online Library 文章页'
  },

  // Nature
  {
    id: 'nature',
    platform: 'Nature',
    pattern: /^https?:\/\/(www\.)?nature\.com\/articles\/.+/i,
    enabled: true,
    priority: 95,
    description: 'Nature 文章页'
  },

  // Science
  {
    id: 'science',
    platform: 'Science',
    pattern: /^https?:\/\/(www\.)?science\.org\/doi\/.+/i,
    enabled: true,
    priority: 95,
    description: 'Science 文章页'
  },

  // PNAS
  {
    id: 'pnas',
    platform: 'PNAS',
    pattern: /^https?:\/\/(www\.)?pnas\.org\/doi\/.+/i,
    enabled: true,
    priority: 90,
    description: 'PNAS 文章页'
  },

  // DOI 落地页
  {
    id: 'doi',
    platform: 'DOI',
    pattern: /^https?:\/\/(dx\.)?doi\.org\/10\.\d+/i,
    enabled: true,
    priority: 80,
    description: 'DOI 落地页'
  },

  // 通用 DOI URL 模式（其他平台）
  {
    id: 'doi-generic',
    platform: 'DOI',
    pattern: /\/doi\/(abs|full|pdf\/)?10\.\d{4,}/i,
    enabled: true,
    priority: 70,
    description: '通用 DOI URL 模式'
  },

  // ACL Anthology
  {
    id: 'acl',
    platform: 'ACL',
    pattern: /^https?:\/\/aclanthology\.org\/.+/i,
    enabled: true,
    priority: 90,
    description: 'ACL Anthology 论文页'
  },

  // Google Scholar（实际论文页面会重定向，但保留规则）
  {
    id: 'google-scholar',
    platform: 'Google Scholar',
    pattern: /^https?:\/\/scholar\.google\.\w+\/scholar\?/i,
    enabled: true,
    priority: 50,
    description: 'Google Scholar 搜索结果页'
  },

  // Semantics Scholar
  {
    id: 'semantic-scholar',
    platform: 'Semantic Scholar',
    pattern: /^https?:\/\/(www\.)?semanticscholar\.org\/paper\/.+/i,
    enabled: true,
    priority: 90,
    description: 'Semantic Scholar 论文页'
  },

  // ResearchGate
  {
    id: 'researchgate',
    platform: 'ResearchGate',
    pattern: /^https?:\/\/(www\.)?researchgate\.net\/publication\/.+/i,
    enabled: true,
    priority: 80,
    description: 'ResearchGate 论文页'
  }
]
```

### 3.4 Meta 标签检测规则

```typescript
/**
 * 默认的 Meta 标签检测配置
 */
const DEFAULT_META_TAG_CONFIG: MetaTagConfig = {
  enabled: true,
  // 需要检测的 Highwire / Google Scholar 标准标签
  tagNames: [
    'citation_title',
    'citation_author',
    'citation_authors',
    'citation_doi',
    'citation_journal_title',
    'citation_publication_date',
    'citation_year',
    'citation_volume',
    'citation_issue',
    'citation_firstpage',
    'citation_lastpage',
    'citation_publisher',
    'citation_abstract',
    'citation_pdf_url',
    'dc.title',
    'dc.creator',
    'dc.identifier',
    'dc.date',
    'article:title',
    'article:author'
  ],
  // 判定为论文页面所需的最少标签数量
  minTagCount: 2,
  // 必须存在的标签（至少一个）
  requiredTags: [
    'citation_title',
    'dc.title',
    'article:title'
  ]
}
```

### 3.5 JSON-LD 检测规则

```typescript
/**
 * JSON-LD 检测相关的学术文章类型
 */
const SCHOLARLY_JSONLD_TYPES = [
  'ScholarlyArticle',
  'Article',
  'MedicalScholarlyArticle',
  'TechArticle',
  'Report',
  'Thesis',
  'Dissertation'
]

/**
 * 从 JSON-LD 中提取 @type
 */
function extractJsonLdTypes(document: Document): string[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  const types: string[] = []

  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '{}')
      // 处理单个对象或数组
      const items = Array.isArray(data) ? data : [data]
      items.forEach((item) => {
        if (item['@type']) {
          types.push(item['@type'])
        }
        // 处理 @graph 结构
        if (item['@graph']) {
          item['@graph'].forEach((g: any) => {
            if (g['@type']) {
              types.push(g['@type'])
            }
          })
        }
      })
    } catch {
      // JSON 解析失败，忽略
    }
  })

  return types
}
```

### 3.6 检测优先级流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     PageDetector.detect()                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ 检查缓存（命中则返回）│
                    └─────────────────┘
                              │ 未命中
                              ▼
                    ┌─────────────────┐
                    │ 1. URL 规则匹配  │ ← 最高优先级
                    │ detectByUrl()   │
                    └─────────────────┘
                              │ 未匹配
                              ▼
                    ┌─────────────────┐
                    │ 2. Meta 标签检测 │
                    │ detectByMeta()  │
                    └─────────────────┘
                              │ 未匹配
                              ▼
                    ┌─────────────────┐
                    │ 3. JSON-LD 检测  │
                    │ detectByJsonLd()│
                    └─────────────────┘
                              │ 未匹配
                              ▼
                    ┌─────────────────┐
                    │ 4. 手动标记检测  │
                    │ detectByManual  │
                    └─────────────────┘
                              │ 未匹配
                              ▼
                    ┌─────────────────┐
                    │ 5. 返回默认值    │
                    │ pageType:       │
                    │ 'webpage'       │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ 保存到缓存并返回 │
                    └─────────────────┘
```

### 3.7 缓存机制设计

```typescript
/**
 * 缓存机制
 */
class PageDetector {
  private cache: Map<string, CacheEntry> = new Map()

  /**
   * 默认缓存 TTL: 5 分钟
   */
  private static DEFAULT_CACHE_TTL = 5 * 60 * 1000

  /**
   * 最大缓存条目数
   */
  private static MAX_CACHE_SIZE = 1000

  private getFromCache(url: string): DetectionResult | null {
    // 清理过期缓存
    this.cleanupExpiredCache()

    const entry = this.cache.get(url)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.cacheTtl) {
      this.cache.delete(url)
      return null
    }

    return entry.result
  }

  private saveToCache(url: string, result: DetectionResult): void {
    // LRU 淘汰策略：如果超过最大缓存数，删除最旧的条目
    if (this.cache.size >= PageDetector.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(url, {
      result,
      timestamp: Date.now(),
      url
    })
  }

  private cleanupExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTtl) {
        this.cache.delete(key)
      }
    }
  }
}
```

---

## 四、存储结构设计

### 4.1 修改 src/logic/storage.ts

```typescript
import type { DetectionConfig, ManualMark, UrlRule } from './page-detector'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

// 原有 demo 存储
export const { data: storageDemo, dataReady: storageDemoReady } = useWebExtensionStorage(
  'webext-demo',
  'Storage Demo'
)

/**
 * 页面检测配置存储
 */
export const { data: detectionConfig, dataReady: detectionConfigReady } =
  useWebExtensionStorage<DetectionConfig>('detection-config', {
    enableUrlRules: true,
    enableMetaTags: true,
    enableJsonLd: true,
    enableManualMarks: true,
    cacheTtl: 5 * 60 * 1000, // 5 分钟
    metaTagConfig: {
      enabled: true,
      tagNames: [
        'citation_title',
        'citation_author',
        'citation_authors',
        'citation_doi',
        'citation_journal_title',
        'citation_publication_date',
        'citation_year',
        'citation_volume',
        'citation_issue',
        'citation_firstpage',
        'citation_lastpage',
        'citation_publisher',
        'citation_abstract',
        'citation_pdf_url',
        'dc.title',
        'dc.creator',
        'dc.identifier',
        'dc.date',
        'article:title',
        'article:author'
      ],
      minTagCount: 2,
      requiredTags: ['citation_title', 'dc.title', 'article:title']
    },
    customUrlRules: []
  })

/**
 * 用户手动标记存储
 */
export const { data: manualMarks, dataReady: manualMarksReady } = useWebExtensionStorage<
  ManualMark[]
>('manual-marks', [])

/**
 * 添加手动标记
 */
export async function addManualMark(
  pattern: string,
  pageType: 'paper' | 'webpage',
  expiresAt: number = 0
): Promise<void> {
  const marks = await manualMarksReady
  const existing = marks.value.find((m) => m.pattern === pattern)
  if (existing) {
    existing.pageType = pageType
    existing.createdAt = Date.now()
    existing.expiresAt = expiresAt
  } else {
    marks.value.push({
      pattern,
      pageType,
      createdAt: Date.now(),
      expiresAt
    })
  }
}

/**
 * 移除手动标记
 */
export async function removeManualMark(pattern: string): Promise<boolean> {
  const marks = await manualMarksReady
  const index = marks.value.findIndex((m) => m.pattern === pattern)
  if (index !== -1) {
    marks.value.splice(index, 1)
    return true
  }
  return false
}

/**
 * 清理过期的手动标记
 */
export async function cleanupExpiredManualMarks(): Promise<number> {
  const marks = await manualMarksReady
  const now = Date.now()
  const initialLength = marks.value.length
  marks.value = marks.value.filter((m) => m.expiresAt === 0 || m.expiresAt > now)
  return initialLength - marks.value.length
}
```

### 4.2 修改 src/logic/index.ts

```typescript
export * from './page-detector'
export * from './storage'
```

---

## 五、测试用例设计

### 5.1 测试文件结构

文件路径: `src/logic/__tests__/page-detector.test.ts`

### 5.2 测试用例列表

```typescript
import type {DetectionResult} from '../page-detector';
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {  PageDetector } from '../page-detector'

describe('PageDetector', () => {
  let detector: PageDetector

  beforeEach(() => {
    detector = new PageDetector()
  })

  // ==================== URL 规则检测测试 ====================
  describe('detectByUrl', () => {
    it('应该正确识别 arXiv 摘要页', () => {
      const result = detector.detect('https://arxiv.org/abs/2301.12345', document)
      expect(result.pageType).toBe('paper')
      expect(result.source).toBe('url-rule')
      expect(result.platform).toBe('arXiv')
    })

    it('应该正确识别 arXiv PDF 页', () => {
      const result = detector.detect('https://arxiv.org/pdf/2301.12345.pdf', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('arXiv')
    })

    it('应该正确识别 PubMed 文章页', () => {
      const result = detector.detect('https://pubmed.ncbi.nlm.nih.gov/12345678/', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('PubMed')
    })

    it('应该正确识别 IEEE Xplore 文章页', () => {
      const result = detector.detect('https://ieeexplore.ieee.org/document/1234567', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('IEEE')
    })

    it('应该正确识别 ACM Digital Library 文章页', () => {
      const result = detector.detect('https://dl.acm.org/doi/abs/10.1145/1234567', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('ACM')
    })

    it('应该正确识别 Springer Link 文章页', () => {
      const result = detector.detect('https://link.springer.com/article/10.1007/s12345', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('Springer')
    })

    it('应该正确识别 ScienceDirect 文章页', () => {
      const result = detector.detect(
        'https://www.sciencedirect.com/science/article/pii/S1234567890123456',
        document
      )
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('ScienceDirect')
    })

    it('应该正确识别 Nature 文章页', () => {
      const result = detector.detect('https://www.nature.com/articles/s41586-023-01234-5', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('Nature')
    })

    it('应该正确识别 Science 文章页', () => {
      const result = detector.detect('https://www.science.org/doi/10.1126/science.1234567', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('Science')
    })

    it('应该正确识别 DOI 落地页', () => {
      const result = detector.detect('https://doi.org/10.1234/example.2023.001', document)
      expect(result.pageType).toBe('paper')
      expect(result.platform).toBe('DOI')
    })

    it('应该正确识别 URL 中包含 DOI 模式的页面', () => {
      const result = detector.detect(
        'https://example.com/journal/article/doi/10.1234/example',
        document
      )
      expect(result.pageType).toBe('paper')
    })

    it('非论文 URL 应返回 null', () => {
      const result = detector.detect('https://www.google.com/search?q=test', document)
      expect(result.pageType).toBe('webpage')
    })
  })

  // ==================== Meta 标签检测测试 ====================
  describe('detectByMeta', () => {
    it('应该通过 citation_title 和 citation_author 识别论文页面', () => {
      document.head.innerHTML = `
        <meta name="citation_title" content="Test Paper Title">
        <meta name="citation_author" content="John Doe">
        <meta name="citation_journal_title" content="Test Journal">
      `
      const result = detector.detect('https://example.com/paper', document)
      expect(result.pageType).toBe('paper')
      expect(result.source).toBe('meta-tag')
    })

    it('应该通过 dc.title 和 dc.creator 识别论文页面', () => {
      document.head.innerHTML = `
        <meta name="dc.title" content="Test Paper Title">
        <meta name="dc.creator" content="Jane Smith">
        <meta name="dc.date" content="2023">
      `
      const result = detector.detect('https://example.com/paper', document)
      expect(result.pageType).toBe('paper')
    })

    it('只有 citation_title 但无作者信息时不应识别为论文', () => {
      document.head.innerHTML = `
        <meta name="citation_title" content="Test Paper Title">
      `
      const result = detector.detect('https://example.com/paper', document)
      // 由于 minTagCount = 2，只有一个标签不满足条件
      expect(result.pageType).toBe('webpage')
    })

    it('没有论文相关 meta 标签时应返回 null', () => {
      document.head.innerHTML = `
        <meta name="description" content="A random webpage">
        <meta name="keywords" content="test, webpage">
      `
      const result = detector.detect('https://example.com/page', document)
      expect(result.pageType).toBe('webpage')
    })
  })

  // ==================== JSON-LD 检测测试 ====================
  describe('detectByJsonLd', () => {
    it('应该识别 ScholarlyArticle 类型的 JSON-LD', () => {
      document.body.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          "headline": "Test Paper",
          "author": "John Doe"
        }
        </script>
      `
      const result = detector.detect('https://example.com/paper', document)
      expect(result.pageType).toBe('paper')
      expect(result.source).toBe('json-ld')
    })

    it('应该识别 Article 类型的 JSON-LD', () => {
      document.body.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article"
        }
        </script>
      `
      const result = detector.detect('https://example.com/article', document)
      expect(result.pageType).toBe('paper')
    })

    it('非学术类 JSON-LD 不应识别为论文', () => {
      document.body.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Random Page"
        }
        </script>
      `
      const result = detector.detect('https://example.com/page', document)
      expect(result.pageType).toBe('webpage')
    })

    it('应该处理 @graph 结构的 JSON-LD', () => {
      document.body.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ScholarlyArticle",
              "headline": "Test Paper"
            }
          ]
        }
        </script>
      `
      const result = detector.detect('https://example.com/paper', document)
      expect(result.pageType).toBe('paper')
    })
  })

  // ==================== 手动标记测试 ====================
  describe('detectByManualMark', () => {
    it('应该根据用户手动标记识别论文页面', () => {
      detector.addManualMark('https://internal.company.com/papers/*', 'paper')
      const result = detector.detect('https://internal.company.com/papers/2023/001', document)
      expect(result.pageType).toBe('paper')
      expect(result.source).toBe('manual-mark')
    })

    it('应该根据用户手动标记识别普通网页', () => {
      detector.addManualMark('https://arxiv.org/*', 'webpage') // 用户明确标记 arXiv 为普通网页
      const result = detector.detect('https://arxiv.org/abs/2301.12345', document)
      // 手动标记优先级低于 URL 规则，所以仍然应该是 paper
      // 需要根据实际优先级设计调整此测试
      expect(result.pageType).toBe('paper') // URL 规则优先
    })

    it('移除手动标记后应恢复默认行为', () => {
      detector.addManualMark('https://example.com/*', 'paper')
      detector.removeManualMark('https://example.com/*')
      const result = detector.detect('https://example.com/page', document)
      expect(result.pageType).toBe('webpage')
    })

    it('过期的手动标记不应生效', async () => {
      detector.addManualMark(
        'https://expired.com/*',
        'paper',
        Date.now() - 1000 // 1秒前过期
      )
      const result = detector.detect('https://expired.com/paper', document)
      expect(result.pageType).toBe('webpage')
    })
  })

  // ==================== 缓存机制测试 ====================
  describe('cache', () => {
    it('相同 URL 的第二次检测应使用缓存', async () => {
      const url = 'https://arxiv.org/abs/2301.12345'
      const result1 = await detector.detect(url, document)
      const result2 = await detector.detect(url, document)

      expect(result1.duration).toBeGreaterThan(0)
      expect(result2.duration).toBeLessThan(result1.duration) // 缓存命中更快
    })

    it('清除缓存后应重新检测', async () => {
      const url = 'https://arxiv.org/abs/2301.12345'
      await detector.detect(url, document)
      detector.clearCache(url)
      // 再次检测时应该重新执行检测逻辑
      const result = await detector.detect(url, document)
      expect(result).toBeDefined()
    })

    it('清除所有缓存应清空缓存', () => {
      detector.detect('https://arxiv.org/abs/2301.12345', document)
      detector.detect('https://pubmed.ncbi.nlm.nih.gov/12345678/', document)
      detector.clearCache()
      // 缓存应该被清空
      expect(detector.getCacheSize()).toBe(0)
    })
  })

  // ==================== 配置更新测试 ====================
  describe('updateConfig', () => {
    it('禁用 URL 规则后应不进行 URL 匹配', async () => {
      detector.updateConfig({ enableUrlRules: false })
      const result = await detector.detect('https://arxiv.org/abs/2301.12345', document)
      // 如果没有其他检测方式匹配，应该是 webpage
      expect(result.source).not.toBe('url-rule')
    })

    it('禁用 Meta 标签检测后应不进行 meta 匹配', async () => {
      document.head.innerHTML = `
        <meta name="citation_title" content="Test Paper">
        <meta name="citation_author" content="John Doe">
      `
      detector.updateConfig({ enableMetaTags: false })
      const result = await detector.detect('https://example.com/paper', document)
      expect(result.source).not.toBe('meta-tag')
    })
  })

  // ==================== 性能测试 ====================
  describe('performance', () => {
    it('检测时间应小于 100ms', async () => {
      const url = 'https://arxiv.org/abs/2301.12345'
      const start = performance.now()
      await detector.detect(url, document)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })

    it('缓存命中时应小于 1ms', async () => {
      const url = 'https://arxiv.org/abs/2301.12345'
      await detector.detect(url, document) // 第一次检测，填充缓存
      const start = performance.now()
      await detector.detect(url, document) // 第二次检测，应命中缓存
      const duration = performance.now() - start
      expect(duration).toBeLessThan(1)
    })
  })

  // ==================== 边界情况测试 ====================
  describe('edge cases', () => {
    it('空 URL 应返回默认值', async () => {
      const result = await detector.detect('', document)
      expect(result.pageType).toBe('webpage')
    })

    it('无效 URL 应返回默认值', async () => {
      const result = await detector.detect('not-a-url', document)
      expect(result.pageType).toBe('webpage')
    })

    it('空 document 应仅使用 URL 检测', async () => {
      const emptyDoc = document.implementation.createHTMLDocument('')
      const result = await detector.detect('https://arxiv.org/abs/2301.12345', emptyDoc)
      expect(result.pageType).toBe('paper')
      expect(result.source).toBe('url-rule')
    })

    it('多个 JSON-LD 脚本时应正确处理', async () => {
      document.body.innerHTML = `
        <script type="application/ld+json">
        { "@type": "WebSite", "name": "Test Site" }
        </script>
        <script type="application/ld+json">
        { "@type": "ScholarlyArticle", "headline": "Test Paper" }
        </script>
      `
      const result = await detector.detect('https://example.com/paper', document)
      expect(result.pageType).toBe('paper')
    })
  })
})
```

---

## 六、实现步骤（按天划分）

### Day 1: 接口定义与基础架构

**预计时间：2-3 小时**

#### 任务清单
- [ ] 创建 `src/logic/page-detector.ts` 文件
- [ ] 定义所有 TypeScript 接口：
  - `DetectionResult`
  - `DetectionSource`
  - `UrlRule`
  - `MetaTagConfig`
  - `ManualMark`
  - `DetectionConfig`
  - `CacheEntry`
- [ ] 实现 `PageDetector` 类的基础结构
- [ ] 定义 `BUILTIN_URL_RULES` 常量

#### 验证方法
```bash
pnpm typecheck
```

### Day 2: URL 规则检测实现

**预计时间：2-3 小时**

#### 任务清单
- [ ] 实现 `detectByUrl()` 方法
- [ ] 实现 URL 正则匹配逻辑
- [ ] 处理优先级排序
- [ ] 添加自定义 URL 规则支持
- [ ] 编写 URL 检测的单元测试

#### 验证方法
```bash
pnpm test page-detector
```

### Day 3: Meta 标签与 JSON-LD 检测实现

**预计时间：2-3 小时**

#### 任务清单
- [ ] 实现 `detectByMeta()` 方法
- [ ] 定义 `DEFAULT_META_TAG_CONFIG`
- [ ] 实现 meta 标签解析逻辑
- [ ] 实现 `detectByJsonLd()` 方法
- [ ] 定义 `SCHOLARLY_JSONLD_TYPES`
- [ ] 实现 JSON-LD 脚本解析逻辑
- [ ] 编写 Meta 标签和 JSON-LD 检测的单元测试

#### 验证方法
```bash
pnpm test page-detector
```

### Day 4: 手动标记与缓存机制实现

**预计时间：2-3 小时**

#### 任务清单
- [ ] 实现 `detectByManualMark()` 方法
- [ ] 实现 `addManualMark()` 方法
- [ ] 实现 `removeManualMark()` 方法
- [ ] 实现缓存机制：
  - `getFromCache()`
  - `saveToCache()`
  - `cleanupExpiredCache()`
  - `clearCache()`
- [ ] 实现 LRU 淘汰策略
- [ ] 编写手动标记和缓存的单元测试

#### 验证方法
```bash
pnpm test page-detector
```

### Day 5: 存储集成与主检测方法实现

**预计时间：2-3 小时**

#### 任务清单
- [ ] 修改 `src/logic/storage.ts`，添加检测配置和手动标记存储
- [ ] 实现 `detect()` 主方法，整合所有检测策略
- [ ] 实现配置加载与更新逻辑
- [ ] 实现 `updateConfig()` 方法
- [ ] 修改 `src/logic/index.ts`，导出所有相关类型和类
- [ ] 编写集成测试

#### 验证方法
```bash
pnpm test
pnpm typecheck
```

### Day 6: 性能优化与文档

**预计时间：2-3 小时**

#### 任务清单
- [ ] 性能测试，确保检测时间 < 100ms
- [ ] 优化正则表达式匹配性能
- [ ] 优化 DOM 操作性能
- [ ] 添加详细的代码注释
- [ ] 编写性能测试用例
- [ ] 编写边界情况测试用例
- [ ] 在真实浏览器环境中测试

#### 验证方法
```bash
pnpm test
pnpm typecheck
pnpm build
```

### Day 7: 集成测试与修复

**预计时间：2-3 小时**

#### 任务清单
- [ ] 在 Chrome 开发者模式下加载扩展
- [ ] 在 arXiv 页面测试（如 https://arxiv.org/abs/2301.07049）
- [ ] 在 PubMed 页面测试
- [ ] 在 IEEE Xplore 页面测试
- [ ] 在 Nature/Science 页面测试
- [ ] 在非论文页面测试
- [ ] 修复发现的问题
- [ ] 更新测试用例

#### 验证方法
```bash
# 构建扩展
pnpm build

# 在浏览器中加载 extension/ 目录进行测试
```

---

## 七、验证方法总结

### 7.1 自动化验证

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test page-detector

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 构建验证
pnpm build
```

### 7.2 手动验证

1. **开发模式加载扩展**
   ```bash
   pnpm dev
   ```
   在 Chrome 中访问 `chrome://extensions/`，启用开发者模式，加载 `extension/` 目录。

2. **测试页面**
   - arXiv: https://arxiv.org/abs/2301.07049
   - PubMed: https://pubmed.ncbi.nlm.nih.gov/36494139/
   - IEEE: https://ieeexplore.ieee.org/document/10004523
   - Nature: https://www.nature.com/articles/s41586-023-05784-w
   - 非论文页面: https://www.google.com, https://github.com

3. **控制台验证**
   在浏览器开发者工具控制台中执行：
   ```javascript
   // 假设 PageDetector 已全局暴露或可通过扩展 API 访问
   const detector = new PageDetector()
   const result = await detector.detect(window.location.href, document)
   console.log(result)
   ```

### 7.3 性能验证

在测试用例中已包含性能测试，确保：
- 首次检测时间 < 100ms
- 缓存命中时间 < 1ms

---

## 八、风险与应对

### 8.1 潜在风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| URL 规则覆盖不全 | 部分论文页面无法识别 | 持续收集用户反馈，定期更新规则列表 |
| Meta 标签格式多样 | 误判或漏判 | 配置灵活的检测规则，支持用户自定义 |
| JSON-LD 解析失败 | 漏判 | 添加 try-catch，降级到其他检测方式 |
| 性能不达标 | 用户体验差 | 优化正则表达式，使用高效的选择器 |
| 缓存一致性问题 | 检测结果过时 | 设置合理的 TTL，提供手动刷新机制 |

### 8.2 回滚计划

如果模块出现严重问题，可以：
1. 禁用特定检测策略（通过配置）
2. 回退到仅使用 URL 规则检测
3. 完全禁用检测模块，默认所有页面为 `webpage`

---

## 九、后续优化方向

1. **机器学习增强**：使用轻量级 ML 模型辅助页面类型判断
2. **用户行为学习**：根据用户的实际操作习惯调整检测规则
3. **社区规则库**：支持从远程服务器同步最新的论文平台规则
4. **批量检测**：支持对多个标签页同时进行类型检测
5. **检测报告**：生成检测日志，便于调试和优化

---

## 十、参考资源

- [Highwire Press Meta Tags](https://web.archive.org/web/20150314144040/https://s3.amazonaws.com/academia.edu.documents/1854470/HighwirePressTags.html)
- [Google Scholar Meta Tags](https://scholar.google.com/intl/en/scholar/inclusion.html#indexing)
- [Schema.org ScholarlyArticle](https://schema.org/ScholarlyArticle)
- [MDN: JSON-LD](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/jsonld)
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

---

**文档版本**: 1.0
**创建日期**: 2026-02-13
**最后更新**: 2026-02-13
