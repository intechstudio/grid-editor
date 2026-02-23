interface ImportMetaEnv {
  readonly VITE_BUILD_TARGET: string;
  readonly VITE_BUILD_ENV: string;
  readonly VITE_BRANCH_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite worker imports (e.g. `?worker` suffix)
declare module "monaco-editor/esm/vs/editor/editor.worker?worker" {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
