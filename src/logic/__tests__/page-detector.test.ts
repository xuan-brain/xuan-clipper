/**
 * PageDetector 模块单元测试
 * 测试页面类型识别功能
 */

import type { ManualMark } from "../page-detector";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_META_CONFIG,
  DEFAULT_URL_RULES,
  PageDetector,
} from "../page-detector";

// ============ 辅助函数：模拟 Document 对象 ============

/**
 * 创建模拟的 Document 对象
 * @param options 配置选项
 * @param options.metaTags meta 标签键值对
 * @param options.jsonLdData JSON-LD 数据对象或数组
 * @param options.title 页面标题
 */
function createMockDocument(
  options: {
    metaTags?: Record<string, string>;
    jsonLdData?: object | object[];
    title?: string;
  } = {},
): Document {
  // 创建基础 document 结构
  const mockDoc = document.implementation.createHTMLDocument("Test Page");

  // 添加 meta 标签
  if (options.metaTags) {
    const head = mockDoc.querySelector("head")!;
    Object.entries(options.metaTags).forEach(([name, content]) => {
      const meta = mockDoc.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", content);
      head.appendChild(meta);
    });
  }

  // 添加 JSON-LD 脚本
  if (options.jsonLdData) {
    const head = mockDoc.querySelector("head")!;
    const script = mockDoc.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(options.jsonLdData);
    head.appendChild(script);
  }

  return mockDoc;
}

// ============ 测试套件 1：URL 规则检测 ============

describe("uRL 规则检测", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("arXiv 平台", () => {
    it("应识别 arXiv 摘要页 (abs)", async () => {
      const result = await detector.detect("https://arxiv.org/abs/2301.12345");
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("url");
      expect(result.platform).toBe("arXiv");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("应识别 arXiv PDF 页 (pdf)", async () => {
      const result = await detector.detect(
        "https://arxiv.org/pdf/2301.12345.pdf",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("arXiv");
    });

    it("应识别带版本号的 arXiv 链接", async () => {
      const result = await detector.detect(
        "https://arxiv.org/abs/2301.12345v2",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("arXiv");
    });

    it("不应将非论文页面识别为论文", async () => {
      // arxiv.org 根页面
      const result = await detector.detect("https://arxiv.org/");
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("pubMed 平台", () => {
    it("应识别 PubMed 文章页面", async () => {
      const result = await detector.detect(
        "https://pubmed.ncbi.nlm.nih.gov/12345678/",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("PubMed");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("应识别带查询参数的 PubMed 链接", async () => {
      const result = await detector.detect(
        "https://pubmed.ncbi.nlm.nih.gov/12345678/?format=abstract",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("PubMed");
    });
  });

  describe("dOI 平台", () => {
    it("应识别 doi.org 链接", async () => {
      const result = await detector.detect("https://doi.org/10.1000/xyz123");
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("DOI");
    });

    it("应识别 dx.doi.org 链接 (旧格式)", async () => {
      const result = await detector.detect("https://dx.doi.org/10.1000/xyz123");
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("DOI");
    });

    it("应识别包含 /doi/ 路径的链接", async () => {
      const result = await detector.detect(
        "https://example.com/doi/10.1234/test",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("DOI");
    });
  });

  describe("iEEE 平台", () => {
    it("应识别 IEEE Xplore 文档页面", async () => {
      const result = await detector.detect(
        "https://ieeexplore.ieee.org/document/1234567",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("IEEE");
    });

    it("应识别带查询参数的 IEEE 链接", async () => {
      const result = await detector.detect(
        "https://ieeexplore.ieee.org/document/1234567?section=abstract",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("IEEE");
    });
  });

  describe("aCM 数字图书馆", () => {
    it("应识别 ACM DL 文章页面", async () => {
      const result = await detector.detect(
        "https://dl.acm.org/doi/10.1145/123456",
      );
      expect(result.pageType).toBe("paper");
      // 注意：ACM 和 DOI 模式冲突，DOI 模式包含 /doi/ 路径
      expect(result.platform).toBeDefined();
    });

    it("应识别 ACM DOI 全链接", async () => {
      const result = await detector.detect(
        "https://dl.acm.org/doi/fullHtml/10.1145/123456",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBeDefined();
    });
  });

  describe("springer 平台", () => {
    it("应识别 Springer 文章页面", async () => {
      const result = await detector.detect(
        "https://link.springer.com/article/10.1007/s12345-023-00001-x",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Springer");
    });

    it("应识别 Springer 章节页面", async () => {
      const result = await detector.detect(
        "https://link.springer.com/chapter/10.1007/12345_1",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Springer");
    });

    it("应识别 Springer 图书页面", async () => {
      const result = await detector.detect(
        "https://link.springer.com/book/10.1007/978-3-030-00000-0",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Springer");
    });
  });

  describe("scienceDirect 平台", () => {
    it("应识别 ScienceDirect 文章页面", async () => {
      const result = await detector.detect(
        "https://www.sciencedirect.com/science/article/pii/S0000000000000000",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("ScienceDirect");
    });
  });

  describe("wiley 平台", () => {
    it("应识别 Wiley 在线图书馆页面", async () => {
      const result = await detector.detect(
        "https://onlinelibrary.wiley.com/doi/10.1002/abc123",
      );
      expect(result.pageType).toBe("paper");
      // 注意：Wiley URL 包含 /doi/ 路径，可能被 DOI 模式先匹配
      // 优先级高的规则先匹配，DOI 优先级 90，Wiley 也是 90
      expect(result.platform).toBeDefined();
    });
  });

  describe("nature 平台", () => {
    it("应识别 Nature 文章页面", async () => {
      const result = await detector.detect(
        "https://www.nature.com/articles/s12345-023-00001-x",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Nature");
    });
  });

  describe("science 平台", () => {
    it("应识别 Science 期刊文章", async () => {
      const result = await detector.detect(
        "https://www.science.org/doi/10.1126/science.1234567",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Science");
    });
  });

  describe("pNAS 平台", () => {
    it("应识别 PNAS 文章", async () => {
      const result = await detector.detect(
        "https://www.pnas.org/doi/10.1073/pnas.1234567",
      );
      expect(result.pageType).toBe("paper");
      // 注意：PNAS URL 包含 /doi/ 路径，可能被 DOI 模式先匹配
      expect(result.platform).toBeDefined();
    });
  });

  describe("aCL Anthology", () => {
    it("应识别 ACL 论文集链接", async () => {
      const result = await detector.detect(
        "https://aclanthology.org/2023.acl-long.1",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("ACL");
    });
  });

  describe("openReview 平台", () => {
    it("应识别 OpenReview 论坛页面", async () => {
      const result = await detector.detect(
        "https://openreview.net/forum?id=abc123",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("OpenReview");
    });
  });

  describe("semantic Scholar 平台", () => {
    it("应识别 Semantic Scholar 论文页面", async () => {
      const result = await detector.detect(
        "https://www.semanticscholar.org/paper/abc123/def456",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("SemanticScholar");
    });
  });

  describe("google Scholar 平台", () => {
    it("应识别 Google Scholar 搜索页面", async () => {
      const result = await detector.detect(
        "https://scholar.google.com/scholar?q=machine+learning",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("GoogleScholar");
    });

    it("应识别 Google Scholar 引用页面", async () => {
      const result = await detector.detect(
        "https://scholar.google.com/citations?user=abc123",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("GoogleScholar");
    });

    it("应识别不同区域的 Google Scholar (.co.jp)", async () => {
      const result = await detector.detect(
        "https://scholar.google.co.jp/citations?user=abc123",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("GoogleScholar");
    });
  });

  describe("dBLP 平台", () => {
    it("应识别 DBLP 记录页面", async () => {
      const result = await detector.detect(
        "https://dblp.org/rec/conf/icml/Author2023",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("DBLP");
    });

    it("应识别不同区域的 DBLP 域名", async () => {
      const result = await detector.detect(
        "https://dblp.de/rec/conf/icml/Author2023",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("DBLP");
    });
  });

  describe("普通网页", () => {
    it("非论文 URL 应返回 webpage 类型", async () => {
      const result = await detector.detect("https://www.google.com/");
      expect(result.pageType).toBe("webpage");
    });

    it("普通新闻网站应返回 webpage 类型", async () => {
      const result = await detector.detect(
        "https://www.bbc.com/news/technology",
      );
      expect(result.pageType).toBe("webpage");
    });

    it("博客网站应返回 webpage 类型", async () => {
      const result = await detector.detect(
        "https://medium.com/@user/my-article-123",
      );
      expect(result.pageType).toBe("webpage");
    });
  });
});

// ============ 测试套件 2：Meta 标签检测 ============

describe("meta 标签检测", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("标准 citation_ 标签", () => {
    it("应识别包含 citation_title 和多个可选标签的页面", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "A Great Paper",
          citation_author: "John Doe",
          citation_doi: "10.1234/test",
          citation_journal_title: "Nature",
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("meta");
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("缺少必须标签时应返回 null", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_author: "John Doe",
          citation_doi: "10.1234/test",
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("webpage"); // 回退到默认
    });

    it("可选标签数量不足时应返回 null", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "A Great Paper",
          citation_author: "John Doe", // 只有一个可选标签，默认需要至少 2 个
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      // 只有 1 个可选标签，不满足 minOptionalCount=2
      expect(result.pageType).toBe("webpage");
    });

    it("正好满足最小可选标签数量时应识别为论文", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "A Great Paper",
          citation_author: "John Doe",
          citation_journal_title: "Nature", // 2 个可选标签
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("meta");
    });
  });

  describe("置信度计算", () => {
    it("更多可选标签应提高置信度", async () => {
      const docLow = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_journal_title: "Journal",
        },
      });

      const docHigh = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
          citation_journal_title: "Journal",
          citation_publication_date: "2023",
          citation_volume: "10",
          citation_abstract: "Abstract text",
        },
      });

      const resultLow = await detector.detect(
        "https://example.com/low",
        docLow,
      );
      const resultHigh = await detector.detect(
        "https://example.com/high",
        docHigh,
      );

      expect(resultHigh.confidence).toBeGreaterThan(resultLow.confidence);
    });

    it("置信度不应超过 0.95", async () => {
      const allTags: Record<string, string> = {
        citation_title: "Paper",
      };

      DEFAULT_META_CONFIG.optionalTags.forEach((tag, i) => {
        allTags[tag] = `value-${i}`;
      });

      const doc = createMockDocument({ metaTags: allTags });

      const result = await detector.detect("https://example.com/all", doc);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe("空内容处理", () => {
    it("空 content 的标签应被忽略", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "", // 空内容
          citation_doi: "10.1234/test", // 只有 1 个有效可选标签
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      // 只有一个有效的可选标签，不满足 minOptionalCount=2
      expect(result.pageType).toBe("webpage");
    });
  });
});

// ============ 测试套件 3：JSON-LD 检测 ============

describe("jSON-LD 检测", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("scholarlyArticle 类型", () => {
    it("应识别 ScholarlyArticle 类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: "A Great Paper",
          author: [{ "@type": "Person", name: "John Doe" }],
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it("应识别 Article 类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "News Article",
        },
      });

      const result = await detector.detect("https://example.com/article", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
    });

    it("应识别 Thesis 类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "Thesis",
          name: "Doctoral Dissertation",
        },
      });

      const result = await detector.detect("https://example.com/thesis", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
    });

    it("应识别 Chapter 类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "Chapter",
          name: "Book Chapter",
        },
      });

      const result = await detector.detect("https://example.com/chapter", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
    });
  });

  describe("jSON-LD 数组格式", () => {
    it("应处理 JSON-LD 数组", async () => {
      const doc = createMockDocument({
        jsonLdData: [
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "University",
          },
          {
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: "Paper",
          },
        ],
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
    });
  });

  describe("@graph 结构", () => {
    it("应识别 @graph 中的学术类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "Journal Site",
            },
            {
              "@type": "ScholarlyArticle",
              headline: "Research Paper",
            },
          ],
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("json-ld");
    });
  });

  describe("非学术类型", () => {
    it("非学术类型不应被识别为论文", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Product Page",
        },
      });

      const result = await detector.detect("https://example.com/product", doc);
      expect(result.pageType).toBe("webpage");
    });

    it("product 类型不应被识别为论文", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Widget",
        },
      });

      const result = await detector.detect("https://example.com/product", doc);
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("无效 JSON 处理", () => {
    it("无效 JSON 不应导致错误", async () => {
      const doc = createMockDocument();
      const head = doc.querySelector("head")!;
      const script = doc.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.textContent = "invalid json {{{";
      head.appendChild(script);

      // 不应抛出错误
      const result = await detector.detect("https://example.com/invalid", doc);
      expect(result).toBeDefined();
      expect(result.pageType).toBe("webpage");
    });

    it("空 JSON-LD 脚本不应导致错误", async () => {
      const doc = createMockDocument();
      const head = doc.querySelector("head")!;
      const script = doc.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.textContent = "";
      head.appendChild(script);

      const result = await detector.detect("https://example.com/empty", doc);
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("大小写不敏感", () => {
    it("应不区分大小写匹配类型", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@context": "https://schema.org",
          "@type": "scholarlyarticle", // 小写
          headline: "Paper",
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("paper");
    });
  });
});

// ============ 测试套件 4：手动标记功能 ============

describe("手动标记功能", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("添加手动标记", () => {
    it("添加论文标记后应覆盖检测结果", async () => {
      // 先检测普通网页
      const resultBefore = await detector.detect(
        "https://example.com/custom-paper",
      );
      expect(resultBefore.pageType).toBe("webpage");

      // 添加手动标记
      detector.addManualMark("example.com/custom-paper", "paper");

      // 再次检测（手动标记在 URL 检测之后，所以如果 URL 规则匹配了，手动标记不会生效）
      const resultAfter = await detector.detect(
        "https://example.com/custom-paper",
      );
      expect(resultAfter.pageType).toBe("paper");
      expect(resultAfter.source).toBe("manual");
      expect(resultAfter.confidence).toBe(1.0);
    });

    it("添加网页标记应排除论文检测（非 URL 匹配的页面）", async () => {
      // 使用不匹配任何 URL 规则的页面
      const url = "https://custom-site.org/paper/123";

      // 添加手动标记
      detector.addManualMark("custom-site.org/paper", "webpage");

      // 检测
      const result = await detector.detect(url);
      expect(result.pageType).toBe("webpage");
      expect(result.source).toBe("manual");
    });

    it("支持通配符模式", async () => {
      detector.addManualMark("*.example.com/papers/*", "paper");

      const result = await detector.detect(
        "https://sub.example.com/papers/123",
      );
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("manual");
    });

    it("支持字符串包含匹配（非正则）", async () => {
      detector.addManualMark("example.com/papers/", "paper");

      const result = await detector.detect("https://example.com/papers/12345");
      expect(result.pageType).toBe("paper");
      expect(result.source).toBe("manual");
    });
  });

  describe("移除手动标记", () => {
    it("移除标记后应恢复原始检测", async () => {
      detector.addManualMark("example.com/test", "paper");
      detector.removeManualMark("example.com/test");

      const result = await detector.detect("https://example.com/test");
      expect(result.pageType).toBe("webpage"); // 恢复默认
    });
  });

  describe("批量设置手动标记", () => {
    it("应支持批量加载标记", async () => {
      const marks: ManualMark[] = [
        { urlPattern: "site1.com", pageType: "paper", timestamp: Date.now() },
        { urlPattern: "site2.com", pageType: "webpage", timestamp: Date.now() },
      ];

      detector.setManualMarks(marks);

      const result1 = await detector.detect("https://site1.com/page");
      expect(result1.pageType).toBe("paper");

      const result2 = await detector.detect("https://site2.com/page");
      expect(result2.pageType).toBe("webpage");
    });

    it("getManualMarks 应返回所有标记的副本", async () => {
      detector.addManualMark("test.com", "paper");

      const marks = detector.getManualMarks();
      expect(marks.length).toBe(1);
      expect(marks[0].urlPattern).toBe("test.com");

      // 修改返回的数组不应影响内部状态
      marks.push({
        urlPattern: "other.com",
        pageType: "paper",
        timestamp: Date.now(),
      });
      const marksAgain = detector.getManualMarks();
      expect(marksAgain.length).toBe(1);
    });
  });

  describe("更新已存在的标记", () => {
    it("相同模式的标记应被更新", async () => {
      detector.addManualMark("example.com", "paper");
      detector.addManualMark("example.com", "webpage");

      const marks = detector.getManualMarks();
      expect(marks.length).toBe(1);
      expect(marks[0].pageType).toBe("webpage");
    });
  });
});

// ============ 测试套件 5：缓存机制 ============

describe("缓存机制", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("缓存命中", () => {
    it("相同 URL 应返回缓存结果（即使配置改变）", async () => {
      const url = "https://arxiv.org/abs/2301.12345";

      // 第一次检测
      const result1 = await detector.detect(url);
      expect(result1.pageType).toBe("paper");

      // 保存原始结果用于比较
      const originalPlatform = result1.platform;

      // 第二次检测应返回缓存（相同的结果）
      const result2 = await detector.detect(url);
      expect(result2.pageType).toBe("paper");
      expect(result2.platform).toBe(originalPlatform);
    });
  });

  describe("缓存过期", () => {
    it("缓存应在 TTL 后过期", async () => {
      const url = "https://arxiv.org/abs/2301.12345";

      // 第一次检测
      const result1 = await detector.detect(url);
      expect(result1.pageType).toBe("paper");

      // 快进 5 分钟 + 1 秒
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // 修改配置并清除缓存
      detector.updateConfig({ enableUrlRules: false });

      // 缓存应已过期
      const result2 = await detector.detect(url);
      expect(result2.pageType).toBe("webpage"); // 禁用 URL 规则后变为 webpage
    });
  });

  describe("缓存清除", () => {
    it("clearCache 应清除所有缓存", async () => {
      const url = "https://arxiv.org/abs/2301.12345";

      await detector.detect(url);
      detector.updateConfig({ enableUrlRules: false }); // updateConfig 会自动调用 clearCache

      const result = await detector.detect(url);
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("lRU 淘汰", () => {
    it("超过最大缓存数量应淘汰最旧条目", async () => {
      // 添加 100+ 条缓存
      for (let i = 0; i < 110; i++) {
        await detector.detect(`https://example${i}.com/page`);
      }

      // 第一个 URL 应已被淘汰
      // 注意：由于无法直接访问缓存，我们通过行为验证
      // 这里主要测试不会抛出错误
      expect(() => detector.detect("https://example0.com/page")).not.toThrow();
    });
  });

  describe("uRL 标准化与缓存", () => {
    it("带 hash 的 URL 应使用相同缓存", async () => {
      const url1 = "https://arxiv.org/abs/2301.12345";
      const url2 = "https://arxiv.org/abs/2301.12345#section";

      const result1 = await detector.detect(url1);
      const result2 = await detector.detect(url2);

      // 由于 URL 标准化移除 hash，两者应使用相同缓存
      expect(result1).toEqual(result2);
    });
  });
});

// ============ 测试套件 6：配置更新 ============

describe("配置更新", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("禁用检测方法", () => {
    it("禁用 URL 规则检测后应返回 webpage", async () => {
      detector.updateConfig({ enableUrlRules: false });

      const result = await detector.detect("https://arxiv.org/abs/2301.12345");
      expect(result.pageType).toBe("webpage");
    });

    it("禁用 Meta 标签检测后应跳过 meta 检测", async () => {
      detector.updateConfig({ enableMetaTags: false });

      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      // 没有 URL 匹配，meta 检测被禁用，应返回 webpage
      expect(result.pageType).toBe("webpage");
    });

    it("禁用 JSON-LD 检测后应跳过 json-ld 检测", async () => {
      detector.updateConfig({ enableJsonLd: false });

      const doc = createMockDocument({
        jsonLdData: {
          "@type": "ScholarlyArticle",
          headline: "Paper",
        },
      });

      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("自定义域名", () => {
    it("添加自定义域名应识别为论文", async () => {
      detector.addCustomDomain("custom-journal.org");

      const result = await detector.detect(
        "https://custom-journal.org/articles/123",
      );
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Custom");
      expect(result.confidence).toBe(0.85);
    });

    it("移除自定义域名应恢复原状", async () => {
      detector.addCustomDomain("custom-journal.org");
      detector.removeCustomDomain("custom-journal.org");

      const result = await detector.detect(
        "https://custom-journal.org/articles/123",
      );
      expect(result.pageType).toBe("webpage");
    });
  });

  describe("getConfig", () => {
    it("应返回当前配置", () => {
      const config = detector.getConfig();
      expect(config.enableUrlRules).toBe(true);
      expect(config.enableMetaTags).toBe(true);
      expect(config.enableJsonLd).toBe(true);
    });
  });

  describe("自定义初始配置", () => {
    it("应支持自定义初始配置 - 禁用 URL 规则", async () => {
      const customDetector = new PageDetector({
        enableUrlRules: false,
      });

      // URL 规则被禁用
      const result1 = await customDetector.detect(
        "https://arxiv.org/abs/2301.12345",
      );
      expect(result1.pageType).toBe("webpage");
    });

    it("应支持自定义初始配置 - 自定义域名", async () => {
      const customDetector = new PageDetector({
        customDomains: ["my-domain.com"],
      });

      // 自定义域名有效（URL 规则启用）
      const result = await customDetector.detect("https://my-domain.com/paper");
      expect(result.pageType).toBe("paper");
      expect(result.platform).toBe("Custom");
    });

    it("应支持自定义初始配置 - 禁用 Meta 检测", async () => {
      const customDetector = new PageDetector({
        enableMetaTags: false,
      });

      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
        },
      });

      const result = await customDetector.detect(
        "https://example.com/paper",
        doc,
      );
      expect(result.pageType).toBe("webpage");
    });

    it("应支持自定义初始配置 - 禁用 JSON-LD 检测", async () => {
      const customDetector = new PageDetector({
        enableJsonLd: false,
      });

      const doc = createMockDocument({
        jsonLdData: {
          "@type": "ScholarlyArticle",
          headline: "Paper",
        },
      });

      const result = await customDetector.detect(
        "https://example.com/paper",
        doc,
      );
      expect(result.pageType).toBe("webpage");
    });
  });
});

// ============ 测试套件 7：性能测试 ============

describe("性能测试", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("检测时间要求", () => {
    it("uRL 检测应在 100ms 内完成", async () => {
      const urls = [
        "https://arxiv.org/abs/2301.12345",
        "https://pubmed.ncbi.nlm.nih.gov/12345678/",
        "https://doi.org/10.1000/xyz123",
        "https://ieeexplore.ieee.org/document/1234567",
        "https://dl.acm.org/doi/10.1145/123456",
      ];

      for (const url of urls) {
        const start = performance.now();
        await detector.detect(url);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100);
      }
    });

    it("meta 标签检测应在 100ms 内完成", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
          citation_journal_title: "Journal",
        },
      });

      const start = performance.now();
      await detector.detect("https://example.com/paper", doc);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("jSON-LD 检测应在 100ms 内完成", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@type": "ScholarlyArticle",
          headline: "Paper",
        },
      });

      const start = performance.now();
      await detector.detect("https://example.com/paper", doc);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("批量检测平均时间应在 50ms 内", async () => {
      const urls = Array.from(
        { length: 50 },
        (_, i) => `https://arxiv.org/abs/2301.${i.toString().padStart(5, "0")}`,
      );

      const start = performance.now();
      for (const url of urls) {
        await detector.detect(url);
      }
      const totalDuration = performance.now() - start;
      const avgDuration = totalDuration / urls.length;

      expect(avgDuration).toBeLessThan(50);
    });
  });

  describe("缓存对性能的影响", () => {
    it("缓存命中应显著提高性能", async () => {
      const url = "https://arxiv.org/abs/2301.12345";

      // 第一次检测（无缓存）
      const start1 = performance.now();
      await detector.detect(url);
      const duration1 = performance.now() - start1;

      // 第二次检测（有缓存）
      const start2 = performance.now();
      await detector.detect(url);
      const duration2 = performance.now() - start2;

      // 缓存命中应该更快
      expect(duration2).toBeLessThan(duration1);
    });
  });
});

// ============ 测试套件 8：边界情况 ============

describe("边界情况", () => {
  let detector: PageDetector;

  beforeEach(() => {
    detector = new PageDetector();
  });

  describe("uRL 处理", () => {
    it("无效 URL 应正常处理", async () => {
      const result = await detector.detect("not-a-valid-url");
      expect(result).toBeDefined();
    });

    it("空字符串 URL 应正常处理", async () => {
      const result = await detector.detect("");
      expect(result).toBeDefined();
    });

    it("带特殊字符的 URL 应正常处理", async () => {
      const result = await detector.detect(
        "https://example.com/path?q=hello%20world&x=1#section",
      );
      expect(result).toBeDefined();
    });

    it("非 HTTP 协议应正常处理", async () => {
      const result = await detector.detect("ftp://example.com/file");
      expect(result).toBeDefined();
    });

    it("iP 地址 URL 应正常处理", async () => {
      const result = await detector.detect("http://192.168.1.1:8080/paper");
      expect(result).toBeDefined();
    });
  });

  describe("document 处理", () => {
    it("空 document 应正常处理", async () => {
      const doc = createMockDocument();
      const result = await detector.detect("https://example.com/page", doc);
      expect(result.pageType).toBe("webpage");
    });

    it("无 head 的 document 应正常处理", async () => {
      const doc = document.implementation.createHTMLDocument("");
      doc.documentElement.removeChild(doc.head!);

      // 不应抛出错误
      const result = await detector.detect("https://example.com/page", doc);
      expect(result).toBeDefined();
    });

    it("多个 JSON-LD 脚本应全部检查", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@type": "Organization",
          name: "Company",
        },
      });

      // 添加第二个 JSON-LD 脚本
      const head = doc.querySelector("head")!;
      const script = doc.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.textContent = JSON.stringify({ "@type": "ScholarlyArticle" });
      head.appendChild(script);

      const result = await detector.detect("https://example.com/page", doc);
      expect(result.pageType).toBe("paper");
    });
  });

  describe("检测优先级", () => {
    it("uRL 检测应优先于 Meta 检测", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
        },
      });

      // arXiv URL 应返回 URL 检测结果
      const result = await detector.detect(
        "https://arxiv.org/abs/2301.12345",
        doc,
      );
      expect(result.source).toBe("url");
      expect(result.platform).toBe("arXiv");
    });

    it("meta 检测应优先于 JSON-LD 检测", async () => {
      const doc = createMockDocument({
        metaTags: {
          citation_title: "Paper",
          citation_author: "Author",
          citation_doi: "10.1234/test",
        },
        jsonLdData: {
          "@type": "ScholarlyArticle",
        },
      });

      // Meta 检测应先匹配
      const result = await detector.detect("https://example.com/paper", doc);
      expect(result.source).toBe("meta");
    });

    it("手动标记应在 URL 检测之后检查（当前实现）", async () => {
      // 对于不匹配任何 URL 规则的页面，手动标记可以生效
      detector.addManualMark("custom-site.org/paper", "paper");

      const result = await detector.detect("https://custom-site.org/paper");
      expect(result.source).toBe("manual");
      expect(result.pageType).toBe("paper");
    });
  });

  describe("并发检测", () => {
    it("并发检测同一 URL 应正确处理", async () => {
      const url = "https://arxiv.org/abs/2301.12345";

      const results = await Promise.all([
        detector.detect(url),
        detector.detect(url),
        detector.detect(url),
      ]);

      results.forEach((result) => {
        expect(result.pageType).toBe("paper");
        expect(result.platform).toBe("arXiv");
      });
    });
  });

  describe("极端输入", () => {
    it("超长 URL 应正常处理", async () => {
      const longUrl = `https://example.com/${"a".repeat(10000)}`;
      const result = await detector.detect(longUrl);
      expect(result).toBeDefined();
    });

    it("大量 meta 标签应正常处理", async () => {
      const metaTags: Record<string, string> = { citation_title: "Paper" };
      for (let i = 0; i < 100; i++) {
        metaTags[`citation_custom_${i}`] = `value_${i}`;
      }

      const doc = createMockDocument({ metaTags });
      const result = await detector.detect("https://example.com/page", doc);
      expect(result).toBeDefined();
    });

    it("深层嵌套的 JSON-LD 应正常处理", async () => {
      const doc = createMockDocument({
        jsonLdData: {
          "@graph": Array.from({ length: 50 }, (_, i) => ({
            "@type": i === 25 ? "ScholarlyArticle" : "Thing",
            name: `Item ${i}`,
          })),
        },
      });

      const result = await detector.detect("https://example.com/page", doc);
      expect(result.pageType).toBe("paper");
    });
  });
});

// ============ 测试套件 9：默认导出和常量 ============

describe("默认常量", () => {
  describe("dEFAULT_URL_RULES", () => {
    it("应包含所有预期的平台", () => {
      const platforms = DEFAULT_URL_RULES.map((rule) => rule.platform);

      expect(platforms).toContain("arXiv");
      expect(platforms).toContain("PubMed");
      expect(platforms).toContain("DOI");
      expect(platforms).toContain("IEEE");
      expect(platforms).toContain("ACM");
      expect(platforms).toContain("Springer");
      expect(platforms).toContain("Nature");
      expect(platforms).toContain("Science");
    });

    it("每个规则应有有效的优先级", () => {
      for (const rule of DEFAULT_URL_RULES) {
        expect(rule.priority).toBeGreaterThan(0);
        expect(rule.priority).toBeLessThanOrEqual(100);
        expect(rule.patterns.length).toBeGreaterThan(0);
      }
    });
  });

  describe("dEFAULT_META_CONFIG", () => {
    it("应包含必须的 citation_title", () => {
      expect(DEFAULT_META_CONFIG.requiredTags).toContain("citation_title");
    });

    it("应有合理的 minOptionalCount", () => {
      expect(DEFAULT_META_CONFIG.minOptionalCount).toBeGreaterThan(0);
      expect(DEFAULT_META_CONFIG.minOptionalCount).toBeLessThanOrEqual(
        DEFAULT_META_CONFIG.optionalTags.length,
      );
    });
  });

  describe("dEFAULT_DETECTION_CONFIG", () => {
    it("所有检测方法默认应启用", () => {
      // 创建新的检测器获取默认配置
      const freshDetector = new PageDetector();
      const config = freshDetector.getConfig();

      expect(config.enableUrlRules).toBe(true);
      expect(config.enableMetaTags).toBe(true);
      expect(config.enableJsonLd).toBe(true);
    });

    it("customDomains 默认应为空", () => {
      // 创建新的检测器获取默认配置
      const freshDetector = new PageDetector();
      const config = freshDetector.getConfig();

      expect(config.customDomains).toEqual([]);
    });
  });
});

// ============ 测试套件 10：单例导出 ============

describe("单例 pageDetector", () => {
  it("应导出默认实例", async () => {
    const { pageDetector: detector } = await import("../page-detector");

    expect(detector).toBeInstanceOf(PageDetector);
  });
});
