interface ImportMetaEnv {
    readonly RENDERER_VITE_WEB_MODE: string // for electron environment test
    readonly VITE_WEB_MODE: string // for web:dev
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}