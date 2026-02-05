- removed unused svelte- deps, still need to remove more as they are svelte 3? (popver)
- executed svelte migration script, suggested by docs
- eslint errors present, couldn't use stores
- upgraded vite, electron-vite and eslint, to overcome errors
- svelte splitpanes also upgraded, but it features sveltekit $app/env, which had to be put to `excludeDeps`
- upgraded svelte 5 to even newer version alongside its peer deps
- added shim workaround to use svelte-splitpanes
- started to add "type" wherever the new tsconfig change had issues
APP loaded with gray screen! Still has errors.
- in runtime manager, had to make sure its lazily loaded because of appsettings
- had to remove the appSetting fontsize from monaco editor (circular dependency? load order?)
- had to make sure on specific package, that only types are imported (builder-util-runtime)
APP loaded with actual UI! Still has errors.
- added svelte 4 component API compatibility, to ensure the app actually starts with the exports from intechstudio uikit 