<script setup lang="ts">
import { marked } from "marked";
import { computed, onMounted, ref } from "vue";

// 从 URL hash 获取 Markdown 内容
const markdown = ref("");
const isSourceView = ref(false);
const copySuccess = ref(false);

// 渲染后的 HTML
const renderedHtml = computed(() => {
  return marked.parse(markdown.value) as string;
});

// 切换视图
function toggleView() {
  isSourceView.value = !isSourceView.value;
}

// 复制到剪贴板
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(markdown.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch {
    copySuccess.value = false;
  }
}

onMounted(() => {
  // 从 URL hash 获取 base64 编码的 Markdown
  const hash = window.location.hash.slice(1);
  if (hash) {
    try {
      markdown.value = decodeURIComponent(atob(hash));
    } catch {
      markdown.value = "无法解析 Markdown 内容";
    }
  }
});
</script>

<template>
  <div class="container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button class="toggle-btn" @click="toggleView">
        {{ isSourceView ? "切换渲染" : "切换源码" }}
      </button>
      <button
        class="copy-btn"
        :class="{ success: copySuccess }"
        @click="copyToClipboard"
      >
        {{ copySuccess ? "已复制" : "复制内容" }}
      </button>
    </div>

    <!-- 渲染视图 -->
    <div v-if="!isSourceView" class="markdown-rendered" v-html="renderedHtml" />

    <!-- 源码视图 -->
    <pre v-else class="markdown-source">{{ markdown }}</pre>
  </div>
</template>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px 80px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #fafafa;
  min-height: 100vh;
}

.toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.toggle-btn,
.copy-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.toggle-btn {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.toggle-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.copy-btn {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.copy-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.copy-btn.success {
  background: #059669;
}

.markdown-source {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "SF Mono", "Fira Code", "Consolas", "Monaco", monospace;
  font-size: 14px;
  line-height: 1.6;
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>

<style>
/* Markdown 渲染样式（全局） */
.markdown-rendered {
  background: #fff;
  padding: 24px 32px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.markdown-rendered h1 {
  font-size: 2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
  margin-top: 24px;
}

.markdown-rendered h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
  margin-top: 20px;
}

.markdown-rendered h3 {
  font-size: 1.25em;
  margin-top: 16px;
}

.markdown-rendered h4 {
  font-size: 1em;
  margin-top: 16px;
}

.markdown-rendered p {
  margin: 1em 0;
}

.markdown-rendered a {
  color: #3b82f6;
  text-decoration: none;
}

.markdown-rendered a:hover {
  text-decoration: underline;
}

.markdown-rendered ul,
.markdown-rendered ol {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-rendered li {
  margin: 0.5em 0;
}

.markdown-rendered blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1em;
  margin: 1em 0;
  color: #666;
  background: #f8fafc;
  padding: 0.5em 1em;
  border-radius: 0 8px 8px 0;
}

.markdown-rendered code {
  background: #f1f5f9;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  font-size: 0.9em;
}

.markdown-rendered pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-rendered pre code {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown-rendered img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.markdown-rendered table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-rendered th,
.markdown-rendered td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.markdown-rendered th {
  background: #f8fafc;
  font-weight: 600;
}

.markdown-rendered hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 2em 0;
}
</style>
