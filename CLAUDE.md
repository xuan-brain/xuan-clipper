# Xuan Clipper - 浏览器扩展项目

## 项目概述

**目标：** 构建一个跨浏览器（Chrome / Edge / Firefox，Manifest V3）扩展，实现论文和网页内容的智能提取与本地程序通信。

**核心功能：**
1. 自动识别当前页面是否为"论文页面"
2. 论文页面：提取论文元信息，按 JSON 协议发送给本地程序
3. 非论文页面：将网页内容转换为 Markdown，发送给本地程序
4. 本地程序负责后续处理（入库、AI 分析、导出等）

## 技术栈

- **框架**: Vue 3 + TypeScript + Vite
- **扩展基础**: [Vitesse WebExt](https://github.com/antfu/vitesse-webext) 模板
- **通信**: `webext-bridge` + `webextension-polyfill`
- **样式**: UnoCSS
- **包管理器**: pnpm

## 项目结构

```
xuan-clipper/
├── src/
│   ├── background/          # 后台脚本/Service Worker
│   ├── contentScripts/      # 内容脚本（注入页面）
│   ├── popup/              # 弹窗页面
│   ├── options/            # 选项页面
│   ├── sidepanel/          # 侧边栏页面
│   ├── components/         # 共享组件（自动导入）
│   ├── logic/              # 业务逻辑
│   │   ├── common-setup.ts # 通用设置
│   │   ├── storage.ts      # 存储逻辑
│   │   └── index.ts        # 主入口
│   ├── manifest.ts         # 扩展清单（动态生成）
│   └── styles/             # 共享样式
├── extension/              # 构建输出目录
├── docs/                   # 文档
│   └── xuan-clipper.md     # 详细需求文档
└── scripts/               # 构建脚本
```

## 开发命令

```bash
# 开发模式（Chrome）
pnpm dev

# 开发模式（Firefox）
pnpm dev-firefox

# 构建
pnpm build

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 测试
pnpm test
```

## 核心模块说明

### 1. 页面类型识别 (`src/logic/page-detector.ts`)

识别规则（按优先级）：
1. **URL 规则匹配** - arXiv、PubMed、DOI 等已知论文平台
2. **HTML meta 标签** - citation_* 系列标签
3. **JSON-LD / schema.org** - ScholarlyArticle 类型
4. **手动标记** - 用户覆盖自动判断

### 2. 论文元信息提取 (`src/logic/paper-extractor.ts`)

元数据字段：
- `title` (必填) - 论文标题
- `authors` (必填) - 作者列表
- `year` (必填) - 出版年份
- `abstract` - 摘要
- `journal` - 期刊名
- `doi` - DOI
- `url` (必填) - 当前页面 URL
- `sourcePlatform` (必填) - 来源平台

### 3. Markdown 转换 (`src/logic/markdown-converter.ts`)

使用 Turndown.js 将 HTML 转换为 Markdown：
- 支持正文识别（`<main>`, `<article>` 等选择器）
- 过滤无关内容（导航、广告等）
- 可配置转换规则

### 4. 本地程序通信 (`src/logic/native-messaging.ts`)

使用 Native Messaging 与本地程序通信：
- 协议：32 位长度前缀 + UTF-8 JSON
- 消息类型：`paper` | `webpage`
- 错误处理与重试机制

## 权限需求

- `activeTab` - 访问当前标签页内容
- `tabs` - 获取标签页信息
- `storage` - 保存配置和临时数据
- `nativeMessaging` - 与本地程序通信
- `contextMenus` - 右键菜单
- `sidePanel` - 侧边栏（可选）

## 开发规范

### 代码风格
- 使用 Composition API 和 `<script setup>` 语法
- ESLint 配置：单引号、无分号
- 组件自动导入（`src/components`）
- 自动导入 Vue Composition API 和浏览器 API

### 存储管理
- 使用 `~/composables/useWebExtensionStorage.ts` 管理扩展存储
- 配置数据定义在 `src/logic/storage.ts`

### 组件通信
- 使用 `webext-bridge` 进行跨上下文通信
- Background ↔ Content Script ↔ Popup 之间的消息传递

## 性能要求

- 页面类型判断：< 100ms
- 论文元信息提取：< 1s
- Markdown 转换（普通网页）：< 2s

## 兼容性

- 浏览器：Chrome、Edge、Firefox（最新两个主版本）
- Manifest V3

## 下一步开发计划

### 阶段 1：基础架构
- [ ] 创建页面类型识别模块
- [ ] 创建论文元信息提取模块
- [ ] 创建 Markdown 转换模块
- [ ] 设置基础 UI（Popup、Options）

### 阶段 2：核心功能
- [ ] 实现论文页面元信息提取
- [ ] 实现 Markdown 转换功能
- [ ] 添加右键菜单支持

### 阶段 3：通信与集成
- [ ] 实现 Native Messaging
- [ ] 创建本地程序通信协议
- [ ] 添加错误处理与重试

### 阶段 4：UI 完善
- [ ] 完善弹窗界面
- [ ] 完善选项页配置
- [ ] 添加配置导入/导出

## 参考文档

详细需求请参考 [`docs/xuan-clipper.md`](./docs/xuan-clipper.md)
