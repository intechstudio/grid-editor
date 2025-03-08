import { writable } from "svelte/store";

const componentKeyMap = new Map();
export const latestComponentVersionKeys = writable(componentKeyMap);
let setVersionKeysTimeout;

let config_components = [];
let package_infos = [];

let packageComponent;

export async function init_config_block_library() {
  console.info("Init config block library!");

  let importModules = import.meta.glob("../config-blocks/*.svelte");

  try {
    config_components = await Promise.all(
      Object.values(importModules).map((importModule) => importModule())
    );
    packageComponent = await import("../config-blocks/package/Package.svelte");
    console.info("Config blocks imported!");
  } catch (err) {
    console.warn("Failed to import!", err);
  }
}

export function getComponentInformation(short) {
  const comps = getAllComponents();
  let result = comps?.find((c) => c.information.short == short);
  if (!result) {
    result = comps?.find((c) => c.information.short == "raw");
  }
  return result;
}

export function getAllComponents() {
  var configs = config_components?.map((c) => ({
    component: c.default,
    information: c.information,
    header: c.header,
  }));
  for (let info of package_infos) {
    configs?.push({
      component: packageComponent.default,
      header: packageComponent.header,
      information: info,
    });
  }
  return configs;
}

export function addPackageAction(info) {
  removePackageAction(info.packageId, info.actionId);
  package_infos.push(info);
  componentKeyMap.set(info.short, new Date().getTime());
  clearTimeout(setVersionKeysTimeout);
  setVersionKeysTimeout = setTimeout(
    () => latestComponentVersionKeys.set(new Map(componentKeyMap)),
    20
  );
}

export function removePackageAction(packageId, actionId) {
  let info = package_infos.find(
    (e) => e.packageId === packageId && e.actionId === actionId
  );
  if (info) {
    package_infos = package_infos.filter(
      (e) => e.packageId !== packageId || e.actionId !== actionId
    );
    componentKeyMap.set(info.short, new Date().getTime());
    clearTimeout(setVersionKeysTimeout);
    setVersionKeysTimeout = setTimeout(
      () => latestComponentVersionKeys.set(new Map(componentKeyMap)),
      20
    );
  }
}
