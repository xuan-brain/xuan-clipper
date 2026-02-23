import { createApp } from "vue";
import i18n from "~/locales";
import { setupApp } from "~/logic/common-setup";
import App from "./Popup.vue";
import "../styles";

const app = createApp(App);
setupApp(app);
app.use(i18n);
app.mount("#app");
