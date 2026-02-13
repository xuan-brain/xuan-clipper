# Xuan Clipper - 智能论文与网页提取工具

一个基于 [Vite](https://vitejs.dev/) 的跨浏览器扩展 ([Chrome](https://developer.chrome.com/docs/extensions/reference/), [Firefox](https://addons.mozilla.org/en-US/developers/), [Edge](https://microsoftedge.microsoft.com/addons/))，能够智能识别并提取论文元信息，将网页转换为 Markdown，并通过 Native Messaging 与本地程序通信。

## ✨ 核心功能

- 🎯 **智能页面识别** - 自动识别论文页面（arXiv、PubMed、IEEE、ACM 等）
- 📄 **论文元信息提取** - 提取标题、作者、摘要、DOI、期刊等结构化信息
- 📝 **Markdown 转换** - 将普通网页转换为干净的 Markdown 格式
- 🔗 **本地程序通信** - 通过 Native Messaging 协议与本地程序交互
- ⚙️ **灵活配置** - 自定义识别规则、转换选项、域名白名单
- 🎨 **现代化 UI** - 基于 Vue 3 和 UnoCSS 的简洁界面
- 🌓 **深色模式** - 支持深色/浅色主题切换

## 🚀 技术栈

- ⚡️ **Vite** - 极速的开发体验，支持 HMR
- 🥝 **Vue 3** - Composition API + `<script setup>` 语法
- 💬 **webext-bridge** - 轻松实现跨上下文通信
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

### UI Frameworks

- [UnoCSS](https://github.com/unocss/unocss) - the instant on-demand Atomic CSS engine

### Coding Style

- Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
- [ESLint](https://eslint.org/) with [@antfu/eslint-config](https://github.com/antfu/eslint-config), single quotes, no semi

### Dev tools

- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.js.org/) - fast, disk space efficient package manager
- [esno](https://github.com/antfu/esno) - TypeScript / ESNext node runtime powered by esbuild
- [npm-run-all](https://github.com/mysticatea/npm-run-all) - Run multiple npm-scripts in parallel or sequential
- [web-ext](https://github.com/mozilla/web-ext) - Streamlined experience for developing web extensions

## Use the Template

### GitHub Template

[Create a repo from this template on GitHub](https://github.com/antfu/vitesse-webext/generate).

### Clone to local

If you prefer to do it manually with the cleaner git history

> If you don't have pnpm installed, run: npm install -g pnpm

```bash
npx degit antfu/vitesse-webext my-webext
cd my-webext
pnpm i
```

## 📦 项目结构

### Folders

- `src` - 主要源代码目录
  - `contentScripts` - 注入到页面的内容脚本和组件
  - `background` - 后台服务 worker 脚本
  - `popup` - 弹窗页面
  - `options` - 选项配置页面
  - `sidepanel` - 侧边栏页面
  - `components` - 自动导入的共享 Vue 组件
  - `composables` - 可复用的组合式函数
  - `logic` - 核心业务逻辑
    - `page-detector.ts` - 页面类型识别
    - `paper-extractor.ts` - 论文元信息提取
    - `markdown-converter.ts` - Markdown 转换
    - `native-messaging.ts` - 本地程序通信
    - `storage.ts` - 存储管理
  - `styles` - 共享样式
  - `assets` - Vue 组件中使用的资源
  - `manifest.ts` - 扩展清单配置
- `extension` - 扩展包根目录
  - `assets` - 静态资源（主要用于 `manifest.json`）
  - `dist` - 构建输出文件
- `scripts` - 开发和构建辅助脚本
- `docs` - 项目文档
  - `xuan-clipper.md` - 详细需求文档
  - `development-plan.md` - 开发计划

## 🛠️ 开发指南

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# Chrome/Edge 开发模式
pnpm dev

# Firefox 开发模式
pnpm dev-firefox
```

### 构建

```bash
# 生产构建
pnpm build

# 打包扩展
pnpm pack
```

### 其他命令

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# E2E 测试
pnpm test:e2e
```

## 📝 使用说明

1. **安装扩展**
   - 开发模式：加载 `extension` 目录作为未打包的扩展
   - 生产模式：安装打包后的 `.crx` (Chrome/Edge) 或 `.xpi` (Firefox) 文件

2. **配置**
   - 点击扩展图标打开弹窗
   - 进入选项页面配置识别规则、Markdown 转换选项等

3. **使用功能**
   - 访问论文页面：自动识别并提取元信息
   - 访问普通网页：转换为 Markdown
   - 右键菜单：快速发送选中内容或整页内容
   - Native Messaging：需要先安装配套的本地程序

## 📖 文档

- [详细需求文档](./docs/xuan-clipper.md)
- [开发计划](./docs/development-plan.md)
- [项目概述](./CLAUDE.md)

## 🔧 技术细节

### 预装库

#### WebExtension 库
- [`webextension-polyfill`](https://github.com/mozilla/webextension-polyfill) - WebExtension API Polyfill
- [`webext-bridge`](https://github.com/antfu/webext-bridge) - 跨上下文通信

#### Vite 插件
- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - 自动导入 API
- [`unplugin-vue-components`](https://github.com/antfu/vite-plugin-components) - 组件自动导入
- [`unplugin-icons`](https://github.com/antfu/unplugin-icons) - 图标组件化

#### Vue 插件
- [VueUse](https://github.com/antfu/vueuse) - 实用的组合式 API 集合

#### UI 框架
- [UnoCSS](https://github.com/unocss/unocss) - 即时原子化 CSS 引擎

#### 功能库
- [Turndown](https://github.com/mixmark-io/turndown) - HTML 转 Markdown

### 编码规范

- 使用 Composition API 和 `<script setup>` 语法
- [ESLint](https://eslint.org/) + [@antfu/eslint-config](https://github.com/antfu/eslint-config)
- 单引号，无分号

### 开发工具

- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.js.org/) - 快速、节省磁盘空间的包管理器
- [esno](https://github.com/antfu/esno) - TypeScript/ESNext 运行时
- [web-ext](https://github.com/mozilla/web-ext) - 扩展开发工具

## 🚧 开发路线图

- [x] 项目初始化和基础配置
- [ ] 核心逻辑模块开发（页面识别、论文提取、Markdown 转换）
- [ ] 存储与配置管理
- [ ] Native Messaging 通信
- [ ] Content Script 实现
- [ ] Background Service Worker
- [ ] Popup 页面
- [ ] Options 页面
- [ ] 测试与优化
- [ ] 文档完善
- [ ] 发布准备

详见 [开发计划](./docs/development-plan.md)

## 💡 加载扩展

开发模式下，在浏览器中加载 `extension/` 目录：

**Chrome/Edge:**
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extension` 目录

**Firefox:**
```bash
pnpm start-firefox
```

或者手动加载：
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择 `extension/manifest.json`

> 💡 提示：使用 [Extensions Reloader](https://chrome.google.com/webstore/detail/fimgfedafeadlieiabdeeaodndnlbhid) 可以更方便地重新加载扩展。

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

本项目基于 [Vitesse WebExt](https://github.com/antfu/vitesse-webext) 模板构建。

感谢 [@antfu](https://github.com/antfu) 创建的优秀模板和工具链。
