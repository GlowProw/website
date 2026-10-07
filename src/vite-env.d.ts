/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// vite.config.ts 里的 snbI18nPlugin 虚拟模块
declare module 'virtual:snb-i18n-data' {
  const data: { zh_CN: Record<string, any>; en_US: Record<string, any>; zh_TW: Record<string, any> };
  export default data;
}
