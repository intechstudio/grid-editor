import { type SvelteComponent } from "svelte";
import { writable } from "svelte/store";
import { type ActionBlockInformation } from "../config-blocks/ActionBlockInformation";
import {
  registerComponentProvider,
  getComponentInformation,
  getAllComponents,
} from "./_config-registry";

// Re-export for backward compatibility with existing consumers
export { getComponentInformation, getAllComponents };

const componentKeyMap = new Map();
export const latestComponentVersionKeys = writable(componentKeyMap);
let setVersionKeysTimeout;

// Eagerly import all built-in config block components at build time
const importedModules = import.meta.glob("../config-blocks/*.svelte", {
  eager: true,
}) as Record<
  string,
  {
    default: typeof SvelteComponent;
    information: ActionBlockInformation;
    header: typeof SvelteComponent;
  }
>;
const config_components = Object.values(importedModules);
let package_infos = [];
let packageComponent: any;

export async function init_config_block_library() {
  // Package component must be loaded lazily to avoid being traced by the
  // vite:worker-import-meta-url plugin (which cannot parse .svelte files).
  packageComponent = await import("../config-blocks/package/Package.svelte");

  // Register the component provider with the lightweight registry so that
  // runtime.ts (and anything in the worker dependency chain) can look up
  // components without directly importing this file and its .svelte glob.
  registerComponentProvider(_getAllComponents);

  console.info(
    `Config block library initialized with ${config_components.length} built-in blocks.`,
  );
}

function _getAllComponents() {
  var configs = config_components?.map((c) => ({
    component: c.default,
    information: c.information,
    header: c.header,
  }));
  for (let info of package_infos) {
    configs?.push({
      component: packageComponent?.default,
      header: packageComponent?.header,
      information: info,
    });
  }
  return configs as Array<{
    header: typeof SvelteComponent;
    component: typeof SvelteComponent;
    information: ActionBlockInformation;
  }>;
}

export function addPackageAction(info) {
  removePackageAction(info.packageId, info.actionId);
  package_infos.push(info);
  componentKeyMap.set(info.short, new Date().getTime());
  clearTimeout(setVersionKeysTimeout);
  setVersionKeysTimeout = setTimeout(
    () => latestComponentVersionKeys.set(new Map(componentKeyMap)),
    20,
  );
}

export function removePackageAction(packageId, actionId) {
  let info = package_infos.find(
    (e) => e.packageId === packageId && e.actionId === actionId,
  );
  if (info) {
    package_infos = package_infos.filter(
      (e) => e.packageId !== packageId || e.actionId !== actionId,
    );
    componentKeyMap.set(info.short, new Date().getTime());
    clearTimeout(setVersionKeysTimeout);
    setVersionKeysTimeout = setTimeout(
      () => latestComponentVersionKeys.set(new Map(componentKeyMap)),
      20,
    );
  }
}
