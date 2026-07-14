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
- intechstudio uikit is already on svelte 5, remove svelte 4 compatibility!
- Modal manager used internally "new Component()" syntax, updated to mount()
- config blocks had to be updated to use "type" for type imports
- updated AddButton used on the layout to new svelte 5 props syntax - not sure why its not from uikit though
  APP now loads with a single MIDI midiWorker error
- updated monaco editor to latest version and removed unnecessary monaco vite plugins
- changed how midi store and midi types are imported to avoid circular dependencies
- updated grid-uikit LOCALLY to support svelte 5 syntax on contextMenu
- changed how \_configs are loaded because build failed at vite-import-meta
