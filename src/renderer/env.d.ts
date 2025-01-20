interface ImportMetaEnv {
  readonly VITE_BUILD_TARGET: string;
  readonly VITE_BUILD_ENV: string;
  readonly VITE_BRANCH_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
