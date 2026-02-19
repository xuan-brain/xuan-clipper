import { createI18n } from "vue-i18n";
import en from "./en";
import zh from "./zh";

// 获取浏览器语言
function getBrowserLocale(): string {
  const navigatorLocale =
    navigator.languages !== undefined
      ? navigator.languages[0]
      : navigator.language;

  if (!navigatorLocale) {
    return "en";
  }

  // 提取主语言代码 (zh-CN -> zh, en-US -> en)
  const locale = navigatorLocale.split("-")[0];
  return locale;
}

// 支持的语言列表
const supportedLocales = ["zh", "en"];

// 获取匹配的语言
function getSupportedLocale(): string {
  const browserLocale = getBrowserLocale();
  return supportedLocales.includes(browserLocale) ? browserLocale : "en";
}

const messages = {
  en,
  zh,
};

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getSupportedLocale(),
  fallbackLocale: "en",
  messages,
});

export default i18n;

// 导出当前语言，供非 Vue 组件使用
export function getCurrentLocale(): string {
  return getSupportedLocale();
}

// 导出翻译函数，供非 Vue 组件使用
export function getMessages() {
  const locale = getSupportedLocale();
  return messages[locale as keyof typeof messages];
}
