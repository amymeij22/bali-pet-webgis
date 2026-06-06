/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_ENV?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
