import Package from '../config-blocks/package/Package.svelte';

export let config_components = [];
export let package_infos = [];

export async function init_config_block_library() {
  console.info("Init config block library!");

  let importModules = import.meta.glob("../config-blocks/*.svelte");

  try {
    config_components =  await Promise.all(Object.values(importModules).map((importModule) => importModule()));
    console.info("Config blocks imported!");
  } catch (err) {
    console.error("Failed to import!", err);
  }
}

init_config_block_library();

export function getComponentInformation({ short }) {
  const comps = getAllComponents();

  let res = comps?.find((c) => c.information.short == short);

  //Backward compatibility
  if (typeof res === "undefined") {
    return comps?.find((c) => c.information.short == "raw");
  }

  return res;
}

export function getAllComponents() {
  var configs = config_components?.map(
    (c) =>
      ({
        component: c.default,
        information: c.information,
        header: c.header,
      })
  );
  for (let info of package_infos){
    normal_configs.push({
      component: Package.default,
      header: Package.header,
      information: info,
    })
  }
}
