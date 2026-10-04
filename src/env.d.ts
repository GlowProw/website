/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_HOST?: string;
  readonly VITE_APP_HOST?: string;
  readonly APP_TITLE?: string;
  readonly APP_META_KEYWORDS?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
