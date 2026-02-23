import { marked } from "marked";
import { createApp } from "vue";
import i18n from "~/locales";
import App from "./App.vue";

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

const app = createApp(App);
app.use(i18n);
app.mount("#app");
