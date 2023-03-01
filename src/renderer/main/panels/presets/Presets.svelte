<script>
  import { get } from "svelte/store";
  import { fade, blur, fly, slide, scale } from "svelte/transition";

  import { onMount } from "svelte";

  import {
    engine,
    logger,
    runtime,
    user_input,
  } from "../../../runtime/runtime.store.js";
  import {
    appSettings,
    presetListRefresh,
  } from "../../../runtime/app-helper.store.js";

  import { addOnDoubleClick } from "../../_actions/add-on-double-click";

  import TooltipSetter from "../../user-interface/tooltip/TooltipSetter.svelte";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";

  let selected = {
    name: "",
    description: "",
    type: "",
  };

  let newPreset = {
    name: "",
    description: "",
    type: "",
  };

  let selectedIndex = undefined;

  let PRESET_PATH = get(appSettings).persistant.profileFolder;

  let PRESETS = [];

  user_input.subscribe((ui) => {
    newPreset.type = ui.event.elementtype;
  });

  appSettings.subscribe((store) => {
    let new_folder = store.persistant.profileFolder;
    if (new_folder !== PRESET_PATH) {
      PRESET_PATH = new_folder;
      moveOld();
    }
  });

  presetListRefresh.subscribe((store) => {
    if (PRESET_PATH !== undefined && PRESET_PATH !== "") {
      loadFromDirectory();
    }
  });

  onMount(() => {
    moveOld();
  });

  async function moveOld() {
    await window.electron.configs.moveOldConfigs(PRESET_PATH, "presets");
    loadFromDirectory();
  }

  async function loadFromDirectory() {
    PRESETS = await window.electron.configs.loadConfigsFromDirectory(
      PRESET_PATH,
      "presets"
    );
  }

  async function saveToDirectory(path, name, preset) {
    await window.electron.configs.saveConfig(path, name, preset, "presets");
    loadFromDirectory();
    logger.set({
      type: "success",
      mode: 0,
      classname: "presetsave",
      message: `Preset saved!`,
    });
    window.electron.analytics.google("preset-library", {
      value: "save success",
    });
    window.electron.analytics.influx(
      "application",
      "presets",
      "preset",
      "save success"
    );
  }

  function prepareSave() {
    window.electron.analytics.google("preset-library", { value: "save start" });
    window.electron.analytics.influx(
      "application",
      "presets",
      "preset",
      "save start"
    );

    let elementnumber = $user_input.event.elementnumber;
    let dx = $user_input.brc.dx;
    let dy = $user_input.brc.dy;
    let pagenumber = $user_input.event.pagenumber;

    let callback = function () {
      logger.set({
        type: "progress",
        mode: 0,
        classname: "presetsave",
        message: `Ready to save preset!`,
      });

      const rt = get(runtime);

      let preset = {
        ...newPreset,
        isGridPreset: true, // differentiator from different JSON files!
        version: {
          major: $appSettings.version.major,
          minor: $appSettings.version.minor,
          patch: $appSettings.version.patch,
        },
      };

      rt.forEach((d) => {
        if (d.dx == dx && d.dy == dy) {
          const page = d.pages.find((x) => x.pageNumber == pagenumber);

          const element = page.control_elements.find(
            (x) => x.controlElementNumber === elementnumber
          );

          preset.configs = {
            events: element.events.map((ev) => {
              return {
                event: ev.event.value,
                config: ev.config,
              };
            }),
          };
        }
      });

      saveToDirectory(PRESET_PATH, newPreset.name, preset);

      engine.set("ENABLED");
    };

    runtime.fetch_page_configuration_from_grid(callback);
  }

  function loadPreset() {
    window.electron.analytics.google("preset-library", { value: "load start" });
    window.electron.analytics.influx(
      "application",
      "presets",
      "preset",
      "load start"
    );

    if (selected !== undefined) {
      const preset = selected;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(
        (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
      );

      if (ui.event.elementtype == preset.type) {
        runtime.element_preset_load(preset);

        window.electron.analytics.google("preset-library", {
          value: "load success",
        });
        window.electron.analytics.influx(
          "application",
          "presets",
          "preset",
          "load success"
        );
      } else {
        window.electron.analytics.google("preset-library", {
          value: "load mismatch",
        });
        window.electron.analytics.influx(
          "application",
          "presets",
          "preset",
          "load mismatch"
        );
        let element =
          currentModule.pages[ui.event.pagenumber].control_elements[
            ui.event.elementnumber
          ].controlElementType;
        logger.set({
          type: "alert",
          mode: 0,
          classname: "presetload",
          message: `Preset is not made for ${element}!`,
        });
      }
    }
  }

  function checkIfOk(preset) {
    let ok = true;

    if (preset.name == "") {
      ok = false;
    }

    if (preset.type == "") {
      ok = false;
    }

    return ok;
  }

  function compare(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
</script>

<presets
  class="w-full h-full p-4 flex flex-col justify-start bg-primary {$engine ==
  'ENABLED'
    ? ''
    : 'pointer-events-none'}"
>
  <div
    in:fade={{ delay: 0 }}
    class="bg-secondary bg-opacity-25 rounded-lg p-4 flex flex-col justify-start
    items-start"
  >
    <div class="text-white pb-2">Save element preset to local folder</div>

    <div class="flex flex-col w-full py-2">
      <div class="text-sm text-gray-500 pb-1">Preset name</div>
      <input
        bind:value={newPreset.name}
        type="text"
        placeholder="Name of this preset..."
        class="w-full bg-secondary text-white py-1 pl-2 rounded-none"
      />
    </div>

    <div class="flex flex-col w-full py-2">
      <div class="text-sm text-gray-500 pb-1">Description</div>
      <textarea
        bind:value={newPreset.description}
        type="text"
        placeholder="What does this preset do?"
        class="w-full bg-secondary text-white py-1 pl-2 rounded-none"
      />
    </div>

    <button
      on:click={prepareSave}
      disabled={!checkIfOk(newPreset)}
      class="{!checkIfOk(newPreset)
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer opacity-100  hover:bg-commit-saturate-10'}
      transition w-full px-2 py-2 my-2 block rounded text-white bg-commit
      relative border-none focus:outline-none"
    >
      <div>Save</div>
      <TooltipSetter key={"preset_save"} />
    </button>
  </div>

  <div class="pt-2 text-white flex items-center relative">
    <div class="">Preset Library</div>
    <TooltipQuestion key={"preset_load_preset"} />
    <button
      on:click={loadFromDirectory}
      class="relative inline-block bg-secondary ml-auto p-1 text-white rounded
      border-commit-saturate-10 hover:border-commit-desaturate-10
      focus:outline-none"
    >
      <div>Refresh List</div>
    </button>
  </div>
  <div id="browse-presets" class="overflow-hidden w-full h-full flex flex-col">
    <div
      id="zero-level"
      class="w-full h-full flex overflow-y-auto text-white mt-2"
    >
      <ul class="w-full">
        {#if PRESETS.length === 0}
          <div in:fade={{ delay: 500 }} class="text-yellow-500">
            <b>Presets not found!</b>
          </div>
          <div in:fade={{ delay: 1000 }} class="text-yellow-500">
            Setup preset folder and download the default preset library in the
            Preferences menu...
          </div>
        {/if}

        {#each PRESETS.sort(compare) as preset, i}
          <li
            on:click={() => {
              selected = preset;
              selectedIndex = i;
            }}
            use:addOnDoubleClick
            on:double-click={() => {
              preset.showMore = !preset.showMore;
            }}
            class="{selectedIndex == i
              ? 'border-pick bg-secondary'
              : 'bg-secondary bg-opacity-40 border-primary hover:bg-opacity-70 hover:border-pick-desaturate-10'}
            border-l-4 preset p-2 my-2 cursor-pointer relative"
          >
            <div class="w-full">{preset.name}</div>

            {#if preset.showMore === true}
              <textarea
                in:slide
                out:slide
                bind:value={preset.description}
                type="text"
                placeholder="No description available"
                class="w-full bg-primary p-1 rounded-none h-36 resize-none "
              />
            {/if}

            <div class="flex text-xs opacity-80 font-semibold">
              <div
                class="m-1 flex justify-center text-center rounded-full px-2
                inline-block {newPreset.type == preset.type
                  ? 'bg-green-500'
                  : 'bg-gray-600'}
                "
              >
                {preset.type === "potentiometer" ? "potmeter" : preset.type}
              </div>
              <div
                class="m-1 flex justify-center text-center rounded-full px-2
                inline-block bg-gray-900"
              >
                v{preset.version.major}.{preset.version.minor}.{preset.version
                  .patch}
              </div>
              <div
                class="m-1 flex justify-center text-center rounded-full px-2
                inline-block"
                style="background-color: {preset.color}"
              >
                by {preset.folder}
              </div>
            </div>

            <div
              in:fade
              class="opacity-10 w-6 h-6 bg-primary absolute hover:opacity-70
              text-center right-0 bottom-0"
              on:click={() => {
                preset.showMore = !preset.showMore;
              }}
            >
              {preset.showMore ? "▲" : "▼"}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <button
    on:click={loadPreset}
    disabled={selectedIndex === undefined}
    class="relative bg-commit block {selectedIndex !== undefined
      ? 'hover:bg-commit-saturate-20'
      : 'opacity-50 cursor-not-allowed'}
    w-full text-white mt-3 mb-1 py-2 px-2 rounded border-commit-saturate-10
    hover:border-commit-desaturate-10 focus:outline-none"
  >
    <div>Load Preset To Element</div>
    <TooltipSetter key={"preset_load_to_module"} />
  </button>
</presets>

<style>
  .preset:first-child {
    margin-top: 0;
  }

  .preset:last-child {
    margin-bottom: 0;
  }
</style>
