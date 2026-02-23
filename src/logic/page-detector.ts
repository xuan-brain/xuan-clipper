/**
 * 页面类型识别模块
 * 用于检测当前页面是"论文页面"还是"普通网页"
 */

// ============ 类型定义 ============

/**
 * 检测来源
 */
export type DetectionSource = "url" | "meta" | "json-ld" | "manual";

/**
 * 检测结果
 */
export interface DetectionResult {
  /** 页面类型 */
  pageType: "paper" | "webpage";
  /** 置信度 0-1 */
  confidence: number;
  /** 检测来源 */
  source: DetectionSource;
  /** 识别的平台 (仅当 source 为 url 时) */
  platform?: string;
}

/**
 * URL 规则配置
 */
export interface UrlRule {
  /** 平台名称 */
  platform: string;
  /** 匹配模式 (字符串或正则表达式) */
  patterns: (string | RegExp)[];
  /** 优先级 (越高越先检查) */
  priority: number;
}

/**
 * Meta 标签检测配置
 */
export interface MetaTagConfig {
  /** 必须存在的标签 */
  requiredTags: string[];
  /** 可选标签列表 */
  optionalTags: string[];
  /** 需要至少存在的可选标签数量 */
  minOptionalCount: number;
}

/**
 * 手动标记条目
 */
export interface ManualMark {
  /** URL 或域名模式 */
  urlPattern: string;
  /** 页面类型 */
  pageType: "paper" | "webpage";
  /** 创建时间戳 */
  timestamp: number;
}

/**
 * 检测配置
 */
export interface DetectionConfig {
  /** 启用 URL 规则检测 */
  enableUrlRules: boolean;
  /** 启用 Meta 标签检测 */
  enableMetaTags: boolean;
  /** 启用 JSON-LD 检测 */
  enableJsonLd: boolean;
  /** 自定义域名列表 */
  customDomains: string[];
  /** Meta 标签配置 */
  metaTagConfig: MetaTagConfig;
}

/**
 * 缓存条目
 */
interface CacheEntry {
  result: DetectionResult;
  timestamp: number;
}

// ============ 默认配置 ============

/**
 * 默认 URL 规则列表
 */
export const DEFAULT_URL_RULES: UrlRule[] = [
  {
    platform: "arXiv",
    patterns: [/arxiv\.org\/abs\//, /arxiv\.org\/pdf\//],
    priority: 100,
  },
  {
    platform: "PubMed",
    patterns: [/pubmed\.ncbi\.nlm\.nih\.gov\//],
    priority: 100,
  },
  {
    platform: "DOI",
    patterns: [/^https?:\/\/(dx\.)?doi\.org\//, /\/doi\/(10\.\d{4,})/],
    priority: 90,
  },
  {
    platform: "IEEE",
    patterns: [/ieeexplore\.ieee\.org\/document\//],
    priority: 95,
  },
  { platform: "ACM", patterns: [/dl\.acm\.org\/doi\//], priority: 95 },
  {
    platform: "Springer",
    patterns: [/link\.springer\.com\/(article|chapter|book)\//],
    priority: 90,
  },
  {
    platform: "ScienceDirect",
    patterns: [
      /sciencedirect\.com\/science\//,
      /sciencedirect\.com\/article\//,
    ],
    priority: 90,
  },
  {
    platform: "Wiley",
    patterns: [/onlinelibrary\.wiley\.com\/doi\//],
    priority: 90,
  },
  { platform: "Nature", patterns: [/nature\.com\/articles\//], priority: 95 },
  { platform: "Science", patterns: [/science\.org\/doi\//], priority: 95 },
  { platform: "PNAS", patterns: [/pnas\.org\/doi\//], priority: 90 },
  { platform: "ACL", patterns: [/aclanthology\.org\//], priority: 90 },
  {
    platform: "OpenReview",
    patterns: [/openreview\.net\/forum\?id=/],
    priority: 90,
  },
  {
    platform: "SemanticScholar",
    patterns: [/semanticscholar\.org\/paper\//],
    priority: 85,
  },
  {
    platform: "GoogleScholar",
    patterns: [
      /scholar\.google\.com\/scholar\?/,
      /scholar\.google\.[a-z.]+\/citations\?/,
    ],
    priority: 80,
  },
  {
    platform: "DBLP",
    patterns: [/dblp\.[a-z]+\/rec\//, /dblp\.org\/rec\//],
    priority: 85,
  },
];

/**
 * 默认 Meta 标签配置
 */
export const DEFAULT_META_CONFIG: MetaTagConfig = {
  requiredTags: ["citation_title"],
  optionalTags: [
    "citation_author",
    "citation_doi",
    "citation_journal_title",
    "citation_publication_date",
    "citation_volume",
    "citation_issue",
    "citation_publisher",
    "citation_abstract",
    "citation_pmid",
    "citation_issn",
    "citation_firstpage",
    "citation_lastpage",
  ],
  minOptionalCount: 2,
};

/**
 * 默认检测配置
 */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  enableUrlRules: true,
  enableMetaTags: true,
  enableJsonLd: true,
  customDomains: [],
  metaTagConfig: DEFAULT_META_CONFIG,
};

// ============ PageDetector 类 ============

/**
 * 页面类型检测器
 */
export class PageDetector {
  private config: DetectionConfig;
  private urlRules: UrlRule[];
  private cache: Map<string, CacheEntry> = new Map();
  private manualMarks: ManualMark[] = [];

  /** 缓存 TTL (5 分钟) */
  private readonly CACHE_TTL = 5 * 60 * 1000;
  /** 最大缓存数量 */
  private readonly MAX_CACHE_SIZE = 100;

  constructor(config?: Partial<DetectionConfig>) {
    // 深拷贝配置，避免修改默认配置
    this.config = {
      ...DEFAULT_DETECTION_CONFIG,
      ...config,
      // 确保数组被深拷贝
      customDomains: config?.customDomains
        ? [...config.customDomains]
        : [...DEFAULT_DETECTION_CONFIG.customDomains],
      metaTagConfig: config?.metaTagConfig
        ? { ...config.metaTagConfig }
        : { ...DEFAULT_DETECTION_CONFIG.metaTagConfig },
    };
    this.urlRules = [...DEFAULT_URL_RULES].sort(
      (a, b) => b.priority - a.priority,
    );
  }

  /**
   * 主检测方法
   * @param url 页面 URL
   * @param document 页面 Document 对象 (可选)
   * @returns 检测结果
   */
  async detect(url: string, document?: Document): Promise<DetectionResult> {
    const normalizedUrl = this.normalizeUrl(url);

    // 检查缓存
    const cached = this.getFromCache(normalizedUrl);
    if (cached) return cached;

    let result: DetectionResult | null = null;

    // 1. URL 规则检测
    result = this.detectByUrl(normalizedUrl);
    if (result) {
      this.setCache(normalizedUrl, result);
      return result;
    }

    // 2. Meta 标签检测 (需要 document)
    if (document) {
      result = this.detectByMeta(document);
      if (result) {
        this.setCache(normalizedUrl, result);
        return result;
      }

      // 3. JSON-LD 检测
      result = this.detectByJsonLd(document);
      if (result) {
        this.setCache(normalizedUrl, result);
        return result;
      }
    }

    // 4. 手动标记检测
    result = this.detectByManualMark(normalizedUrl);
    if (result) {
      this.setCache(normalizedUrl, result);
      return result;
    }

    // 5. 默认: 普通网页
    const defaultResult: DetectionResult = {
      pageType: "webpage",
      confidence: 0.5,
      source: "url",
    };

    this.setCache(normalizedUrl, defaultResult);
    return defaultResult;
  }

  /**
   * URL 规则检测
   */
  private detectByUrl(url: string): DetectionResult | null {
    if (!this.config.enableUrlRules) return null;

    // 检查内置规则
    for (const rule of this.urlRules) {
      for (const pattern of rule.patterns) {
        if (this.matchUrlPattern(url, pattern)) {
          return {
            pageType: "paper",
            confidence: 0.95,
            source: "url",
            platform: rule.platform,
          };
        }
      }
    }

    // 检查自定义域名
    for (const domain of this.config.customDomains) {
      if (url.includes(domain)) {
        return {
          pageType: "paper",
          confidence: 0.85,
          source: "url",
          platform: "Custom",
        };
      }
    }

    return null;
  }

  /**
   * Meta 标签检测
   */
  private detectByMeta(document: Document): DetectionResult | null {
    if (!this.config.enableMetaTags) return null;

    const metaConfig = this.config.metaTagConfig;

    // 检查必须标签
    for (const tag of metaConfig.requiredTags) {
      const meta = document.querySelector(`meta[name="${tag}"]`);
      if (!meta?.getAttribute("content")) return null;
    }

    // 计算可选标签数量
    let optionalCount = 0;
    for (const tag of metaConfig.optionalTags) {
      const meta = document.querySelector(`meta[name="${tag}"]`);
      if (meta?.getAttribute("content")) optionalCount++;
    }

    // 不满足最小可选标签数量
    if (optionalCount < metaConfig.minOptionalCount) return null;

    // 计算置信度
    const confidence =
      0.7 + (optionalCount / metaConfig.optionalTags.length) * 0.25;

    return {
      pageType: "paper",
      confidence: Math.min(confidence, 0.95),
      source: "meta",
    };
  }

  /**
   * JSON-LD 检测
   */
  private detectByJsonLd(document: Document): DetectionResult | null {
    if (!this.config.enableJsonLd) return null;

    const jsonLdScripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );

    // 学术文章类型
    const scholarlyTypes = [
      "ScholarlyArticle",
      "Article",
      "Thesis",
      "Chapter",
      "PublicationIssue",
      "PublicationVolume",
    ];

    for (const script of Array.from(jsonLdScripts)) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // 检查 @type
          const type = item["@type"];
          if (typeof type === "string") {
            if (
              scholarlyTypes.some((t) =>
                type.toLowerCase().includes(t.toLowerCase()),
              )
            ) {
              return {
                pageType: "paper",
                confidence: 0.8,
                source: "json-ld",
              };
            }
          }

          // 检查 @graph
          if (item["@graph"] && Array.isArray(item["@graph"])) {
            for (const graphItem of item["@graph"]) {
              const graphType = graphItem["@type"];
              if (
                typeof graphType === "string" &&
                scholarlyTypes.some((t) =>
                  graphType.toLowerCase().includes(t.toLowerCase()),
                )
              ) {
                return {
                  pageType: "paper",
                  confidence: 0.8,
                  source: "json-ld",
                };
              }
            }
          }
        }
      } catch {
        // JSON 解析失败，跳过
      }
    }

    return null;
  }

  /**
   * 手动标记检测
   */
  private detectByManualMark(url: string): DetectionResult | null {
    for (const mark of this.manualMarks) {
      if (this.matchUrlPattern(url, mark.urlPattern)) {
        return {
          pageType: mark.pageType,
          confidence: 1.0,
          source: "manual",
        };
      }
    }
    return null;
  }

  // ============ 配置方法 ============

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache();
  }

  /**
   * 获取当前配置
   */
  getConfig(): DetectionConfig {
    return {
      ...this.config,
      customDomains: [...this.config.customDomains],
    };
  }

  /**
   * 添加自定义域名
   */
  addCustomDomain(domain: string): void {
    if (!this.config.customDomains.includes(domain)) {
      this.config.customDomains.push(domain);
      this.clearCache();
    }
  }

  /**
   * 移除自定义域名
   */
  removeCustomDomain(domain: string): void {
    this.config.customDomains = this.config.customDomains.filter(
      (d) => d !== domain,
    );
    this.clearCache();
  }

  /**
   * 添加手动标记
   */
  addManualMark(urlPattern: string, pageType: "paper" | "webpage"): void {
    // 移除已存在的相同模式
    this.manualMarks = this.manualMarks.filter(
      (m) => m.urlPattern !== urlPattern,
    );

    this.manualMarks.push({
      urlPattern,
      pageType,
      timestamp: Date.now(),
    });
    this.clearCache();
  }

  /**
   * 移除手动标记
   */
  removeManualMark(urlPattern: string): void {
    this.manualMarks = this.manualMarks.filter(
      (m) => m.urlPattern !== urlPattern,
    );
    this.clearCache();
  }

  /**
   * 获取所有手动标记
   */
  getManualMarks(): ManualMark[] {
    return [...this.manualMarks];
  }

  /**
   * 设置手动标记 (从存储加载)
   */
  setManualMarks(marks: ManualMark[]): void {
    this.manualMarks = [...marks];
    this.clearCache();
  }

  // ============ 缓存方法 ============

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 从缓存获取
   */
  private getFromCache(url: string): DetectionResult | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    // 检查 TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(url);
      return null;
    }

    return cached.result;
  }

  /**
   * 设置缓存
   */
  private setCache(url: string, result: DetectionResult): void {
    // LRU 淘汰
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(url, { result, timestamp: Date.now() });
  }

  // ============ 工具方法 ============

  /**
   * 标准化 URL
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 移除 hash 和某些查询参数
      urlObj.hash = "";
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * 匹配 URL 模式
   */
  private matchUrlPattern(url: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }

    // 字符串模式: 支持通配符 *
    if (pattern.includes("*")) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      return regex.test(url);
    }

    return url.includes(pattern);
  }
}

// ============ 单例导出 ============

/** 默认页面检测器实例 */
export const pageDetector = new PageDetector();
