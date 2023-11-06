export let config_components = [];

export async function init_config_block_library() {
  console.info("Init config block library!");

  let _files = import.meta.glob("../config-blocks/*.svelte");

  let files = [];

  for (const file in _files) {
    files.push(file);
  }

  try {
    Promise.all(
      files.map(async (file) => {
        const configBlockName = file.substring(17, file.length - 7);
        return await import(`../config-blocks/${configBlockName}.svelte`);
      })
    ).then((value) => {
      config_components = value;
      console.info("Config blocks imported!");
    });
  } catch (err) {
    console.error("Failed to import!", err);
  }
}

init_config_block_library();

export function getComponentInformation({ short }) {
  if (config_components === undefined) {
    return undefined;
  }

  const comps = config_components.map(
    (c) =>
      (c = {
        component: c.default,
        information: c.information,
        header: c.header,
      })
  );

  let res = comps.find((c) => c.information.short == short);

  //Backward compatibility
  if (typeof res === "undefined") {
    return comps.find((c) => c.information.short == "raw");
  }

  return res;
}

export function getAllComponents() {
  if (config_components === undefined) {
    return undefined;
  }

  return config_components.map(
    (c) =>
      (c = {
        component: c.default,
        information: c.information,
        header: c.header,
      })
  );
}
