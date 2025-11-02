import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import GoogleSignInPlugin from 'vue3-google-signin';
import App from './App.vue';
import router from './router';
import '@/styles/main.scss';
import 'element-plus/theme-chalk/el-message.css';
import 'element-plus/theme-chalk/el-message-box.css';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';
import VueLatex from 'vatex';
const app = createApp(App);
// dayjs使用插件
dayjs.extend(utc);
dayjs.extend(timezone);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.use(GoogleSignInPlugin, { clientId: import.meta.env.IPG_GOOGLE_CLIENT_ID });
app.use(VueLatex);
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
