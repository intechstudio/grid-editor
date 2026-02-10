// Shim for $app/environment (SvelteKit module)
// Used by svelte-splitpanes in non-SvelteKit projects
export const browser = true;
export const building = false;
export const dev = import.meta.env.DEV;
export const version = "";
