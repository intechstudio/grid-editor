interface ImportMetaEnv {
  readonly VITE_WEB_MODE: string; // for web:dev
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
