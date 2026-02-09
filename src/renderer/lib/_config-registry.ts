/**
 * Lightweight registry for action block component lookups.
 *
 * This file exists to break the dependency chain between runtime.ts and
 * _configs.ts. The worker plugin (vite:worker-import-meta-url) traces static
 * imports and _configs.ts eagerly imports all .svelte config block files.
 * If runtime.ts imported _configs.ts directly, the worker (used by
 * MidiMonitor) would try to parse .svelte files as JavaScript and fail.
 *
 * Instead, runtime.ts imports this lightweight registry, and _configs.ts
 * populates it during init_config_block_library().
 */
import { type SvelteComponent } from "svelte";
import { type ActionBlockInformation } from "../config-blocks/ActionBlockInformation";

export type ComponentEntry = {
  header: typeof SvelteComponent;
  component: typeof SvelteComponent;
  information: ActionBlockInformation;
};

type GetAllComponentsFn = () => ComponentEntry[];

let _getAllComponents: GetAllComponentsFn | undefined;

export function registerComponentProvider(fn: GetAllComponentsFn) {
  _getAllComponents = fn;
}

export function getComponentInformation(short: string): ComponentEntry {
  if (!_getAllComponents) {
    throw new Error(
      "Config block library not initialized. Call init_config_block_library() first.",
    );
  }
  const comps = _getAllComponents();
  let result = comps?.find((c) => c.information.short === short);
  if (!result) {
    result = comps?.find((c) => c.information.short === "raw");
  }
  return result!;
}

export function getAllComponents(): ComponentEntry[] {
  if (!_getAllComponents) {
    throw new Error(
      "Config block library not initialized. Call init_config_block_library() first.",
    );
  }
  return _getAllComponents();
}
