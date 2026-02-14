import { marked } from "marked";
import { createApp } from "vue";
import App from "./App.vue";

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

const app = createApp(App);
app.mount("#app");
