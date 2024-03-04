export let config_components = [];
export let package_infos = [];

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

export function getComponentInformation({ short }) {
  const comps = getAllComponents();

  return comps?.find((c) => c.information.short == short);
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
  package_infos.push(info);
}

export function removePackageAction(packageId, actionId) {
  package_infos = package_infos.filter(
    (e) => e.packageId !== packageId || e.actionId !== actionId
  );
}
