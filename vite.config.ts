import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver({importStyle:'sass'})],
    }),
  ],
  // css: {
  //   preprocessorOptions: {
  //     sass: {
  //       additionalData: `
  //         @import "@/styles/main.scss";
  //       `,
  //     },
  //   },
  // },
  server: {
    host: '0.0.0.0',
    port: 9021,
    proxy: {
      '/api': {
        // target: 'http://ipologo.com/', //jyh
        // target: 'http://127.0.0.1:9211',
        target:'https://119.84.246.217:56104',//测试环境
        changeOrigin: true,
        secure: false,   // ← 关闭 TLS 证书校验
      },
      '/images': {
        target: 'http://ipologo.com/',
        changeOrigin: true,
      },
    },
  },

  // server: {
  //   host: '0.0.0.0',
  //   port: 9021,
  //   proxy: {
  //     '/api': {
  //       target: 'http://www.deci-central.com/', //jyh
  //       changeOrigin: true,
  //     },
  //   },
  // },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  envPrefix: 'IPG_',
});
