import { createI18n } from "vue-i18n";
import en from "./en";
import zh from "./zh";

// 支持的语言列表
export const supportedLocales = [
  { code: "zh", name: "简体中文" },
  { code: "en", name: "English" },
] as const;

export type LocaleCode = (typeof supportedLocales)[number]["code"];

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

// 获取匹配的语言
function getSupportedLocale(preferredLocale?: string): string {
  const locale = preferredLocale || getBrowserLocale();
  return supportedLocales.some((l) => l.code === locale) ? locale : "en";
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
  return i18n.locale.value as string;
}

// 导出翻译函数，供非 Vue 组件使用
export function getMessages() {
  const locale = i18n.locale.value as string;
  return messages[locale as keyof typeof messages];
}

// 设置语言
export function setLocale(locale: LocaleCode) {
  i18n.locale.value = locale;
}
