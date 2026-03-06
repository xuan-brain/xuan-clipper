# Xuan Clipper - 智能论文与网页提取工具

一个基于 [Vite](https://vitejs.dev/) 的跨浏览器扩展 ([Chrome](https://developer.chrome.com/docs/extensions/reference/), [Firefox](https://addons.mozilla.org/en-US/developers/), [Edge](https://microsoftedge.microsoft.com/addons/))，能够智能识别并提取论文元信息，将网页转换为 Markdown，并通过 REST API 与本地程序通信。

## ✨ 核心功能

- 🎯 **智能页面识别** - 自动识别论文页面（arXiv、PubMed、IEEE、ACM 等）
- 📄 **论文元信息提取** - 提取标题、作者、摘要、DOI、期刊等结构化信息
- 📝 **Markdown 转换** - 将普通网页转换为干净的 Markdown 格式
- 🔗 **本地程序通信** - 通过 REST API 发送论文/网页到本地程序
- 📌 **Clips 网页剪藏** - 保存网页内容为 Clips，自动提取元数据
- ⚙️ **灵活配置** - 自定义识别规则、API 配置
- 🌍 **多语言支持** - 支持简体中文、英文界面切换
- 🎨 **现代化 UI** - 基于 Vue 3 和 UnoCSS 的简洁界面
- 🌓 **深色模式** - 支持深色/浅色主题切换

## 🚀 技术栈

- ⚡️ **Vite** - 极速的开发体验，支持 HMR
- 🥝 **Vue 3** - Composition API + `<script setup>` 语法
- 💬 **webext-bridge** - 轻松实现跨上下文通信
- 🌍 **vue-i18n** - 国际化支持
- 🌈 **UnoCSS** - 即时的原子化 CSS 引擎
- 🦾 **TypeScript** - 类型安全
- 📦 **自动导入** - 组件和 Composition API 自动导入
- 🌟 **Iconify** - 访问任意图标集
- 🖥 **Content Script** - 在内容脚本中使用 Vue
- 🌍 **跨浏览器** - 支持 Chrome、Firefox、Edge 等
- 📃 **动态 Manifest** - 完整类型支持的 `manifest.json`

## Pre-packed

### WebExtension Libraries

- [`webextension-polyfill`](https://github.com/mozilla/webextension-polyfill) - WebExtension browser API Polyfill with types
- [`webext-bridge`](https://github.com/antfu/webext-bridge) - effortlessly communication between contexts

### Vite Plugins

- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - Directly use `browser` and Vue Composition API without importing
- [`unplugin-vue-components`](https://github.com/antfu/vite-plugin-components) - components auto import
- [`unplugin-icons`](https://github.com/antfu/unplugin-icons) - icons as components
  - [Iconify](https://iconify.design) - use icons from any icon sets [🔍Icônes](https://icones.netlify.app/)

### Vue Plugins

- [VueUse](https://github.com/antfu/vueuse) - collection of useful composition APIs
- [vue-i18n](https://vue-i18n.intlify.dev/) - internationalization

### UI Frameworks

- [UnoCSS](https://github.com/unocss/unocss) - the instant on-demand Atomic CSS engine

### Coding Style

- Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
- [ESLint](https://eslint.org/) with [@antfu/eslint-config](https://github.com/antfu/eslint-config), single quotes, no semi

### Dev tools

- [TypeScript](https://www.typescriptlang.org/)
- [yarn](https://yarnpkg.com/) - fast, reliable package manager
- [esno](https://github.com/antfu/esno) - TypeScript / ESNext node runtime powered by esbuild
- [npm-run-all](https://github.com/mysticatea/npm-run-all) - Run multiple npm-scripts in parallel or sequential
- [web-ext](https://github.com/mozilla/web-ext) - Streamlined experience for developing web extensions

### 功能库

- [Turndown](https://github.com/mixmark-io/turndown) - HTML 转 Markdown
- [Readability](https://github.com/mozilla/readability) - 网页正文提取

## 📦 项目结构

### Folders

- `src` - 主要源代码目录
  - `contentScripts` - 注入到页面的内容脚本和组件
  - `background` - 后台服务 worker 脚本
  - `popup` - 弹窗页面
  - `options` - 选项配置页面（两栏布局）
  - `markdown-viewer` - Markdown 查看器页面
  - `components` - 自动导入的共享 Vue 组件
  - `composables` - 可复用的组合式函数
  - `logic` - 核心业务逻辑
    - `page-detector.ts` - 页面类型识别
    - `paper-extractor.ts` - 论文元信息提取
    - `markdown-converter.ts` - Markdown 转换
    - `webpage-metadata-extractor.ts` - 网页元数据提取
    - `storage.ts` - 存储管理
    - `messaging.ts` - 消息通信
  - `locales` - 国际化翻译文件
  - `styles` - 共享样式
  - `assets` - Vue 组件中使用的资源
  - `manifest.ts` - 扩展清单配置
- `extension` - 扩展包根目录
  - `assets` - 静态资源（主要用于 `manifest.json`）
  - `dist` - 构建输出文件
- `scripts` - 开发和构建辅助脚本
- `docs` - 项目文档

## 🛠️ 开发指南

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
# Chrome/Edge 开发模式
yarn dev

# Firefox 开发模式
yarn dev-firefox
```

### 构建

```bash
# 生产构建
yarn build
```

### 其他命令

```bash
# 代码检查
yarn lint

# 类型检查
yarn typecheck
```

## 📝 使用说明

1. **安装扩展**
   - 开发模式：加载 `extension` 目录作为未打包的扩展
   - 生产模式：安装打包后的扩展

2. **配置本地 API**
   - 右键扩展图标 → 选项
   - 在 Paper 标签页配置论文 API 端点（默认：`http://127.0.0.1:3030/api/papers/import-html`）
   - 在 Clips 标签页配置 Clips API 端点（默认：`http://127.0.0.1:3030/api/clips`）

3. **使用功能**
   - **论文页面**：自动识别并显示"导入该论文"按钮，点击发送论文信息到本地 API
   - **普通网页**：显示"导出 Markdown"和"保存为 Clips"按钮
     - 导出 Markdown：在新标签页查看转换后的 Markdown
     - 保存为 Clips：发送网页内容和元数据到本地 API
   - **选项页面**：配置检测规则、API 设置、语言切换

## 📖 文档

- [详细需求文档](./docs/xuan-clipper.md)
- [项目概述](./CLAUDE.md)

## 🔧 技术细节

### 页面类型识别

扩展通过以下方式识别论文页面：

1. **URL 规则匹配** - 识别 arXiv、PubMed、DOI、Google Scholar 等平台
2. **Meta 标签检测** - 检测 `citation_*` 系列元标签
3. **JSON-LD 检测** - 检测 `ScholarlyArticle` 类型结构化数据
4. **手动标记** - 用户可手动标记/取消标记

### API 通信格式

**论文导入 API** (`POST /api/papers/import-html`)：
```json
{
  "title": "论文标题",
  "authors": ["作者1", "作者2"],
  "year": 2024,
  "abstract": "摘要内容",
  "journal": "期刊名",
  "doi": "10.xxx/xxx",
  "url": "https://...",
  "source_platform": "arxiv",
  "html_content": "<html>...</html>"
}
```

**Clips 保存 API** (`POST /api/clips`)：
```json
{
  "title": "网页标题",
  "url": "https://...",
  "content": "# Markdown 内容",
  "excerpt": "摘要/简介",
  "author": "作者",
  "published_date": "2024-01-01",
  "source_domain": "example.com",
  "tags": ["tag1", "tag2"],
  "thumbnail_url": "https://..."
}
```

## 💡 加载扩展

开发模式下，在浏览器中加载 `extension/` 目录：

**Chrome/Edge:**
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extension` 目录

**Firefox:**
```bash
yarn start:firefox
```

或者手动加载：
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择 `extension/manifest.json`

## 🚧 已完成功能

- [x] 项目初始化和基础配置
- [x] 页面类型识别（URL 规则、Meta 标签、JSON-LD）
- [x] 论文元信息提取
- [x] Markdown 转换（Turndown + Readability）
- [x] 网页元数据提取
- [x] 弹窗页面
- [x] 选项页面（两栏布局）
- [x] Markdown 查看器
- [x] 多语言支持（中文/英文）
- [x] REST API 通信

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

本项目基于 [Vitesse WebExt](https://github.com/antfu/vitesse-webext) 模板构建。

感谢 [@antfu](https://github.com/antfu) 创建的优秀模板和工具链。
