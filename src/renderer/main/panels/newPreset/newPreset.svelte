<script>
  import { get } from "svelte/store";
  import { fade, blur, fly, slide, scale } from "svelte/transition";
  import { selectedPresetStore } from "/runtime/preset-helper.store";
  import { presetChangeCallbackStore } from "./preset-change.store";
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

  let newPreset = {
    name: "",
    description: "",
    type: "",
  };

  let selected = {
    name: "",
    description: "",
    type: "",
  };

  let selectedPreset;

  selectedPresetStore.subscribe((store) => {
    selectedPreset = store;

    console.log(selectedPreset);
  });

  let selectedModule;
  let selectedController;

  let selectedIndex = undefined;

  let PRESET_PATH = get(appSettings).persistant.profileFolder;

  let PRESETS = [];

  user_input.subscribe((ui) => {
    const rt = get(runtime);
    let device = rt.find(
      (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
    );

    newPreset.type = ui.event.elementtype;
    selectedController = ui.event.elementtype;
    selectedModule = device.id.substr(0, 4);
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

  presetChangeCallbackStore.subscribe(async (store) => {
    if (store.action == "update" || store.action == "delete") {
      await loadFromDirectory();
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

  async function saveToDirectory(path, name, preset,  user) {
    await window.electron.configs.saveConfig(path, name, preset, "presets", user);
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

  function prepareSave(user) {
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

      saveToDirectory(PRESET_PATH, newPreset.name, preset, user);

      engine.set("ENABLED");
    };

    runtime.fetch_page_configuration_from_grid(callback);
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

  function openPresetInfo(preset) {
    ($appSettings.modal = "profileInfo");

    window.electron.analytics.influx("profile-library", {
      value: "newProfile_info",
    });
    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "newProfile_info"
    );
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
      on:click={()=>{prepareSave("user")}}
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

  </div>

  <div id="browse-presets" class="overflow-hidden w-full h-full flex flex-col ">
    <div
      id="zero-level"
      class="w-full h-full flex-col overflow-y-auto text-white mt-2"
    >
      <div class="w-full">
        {#if PRESETS.length === 0}
          <div in:fade={{ delay: 500 }} class="text-yellow-500">
            <b>Presets not found!</b>
          </div>
          <div in:fade={{ delay: 1000 }} class="text-yellow-500">
            Setup preset folder and download the default preset library in the
            Preferences menu...
          </div>
        {/if}
      </div>

      <div class="w-full flex gap-4 flex-col">
        {#each PRESETS.sort(compare) as preset, i}
        <button
        on:click={() => {
          selectedIndex = i;
          selectedPresetStore.set(preset);
        }}
        use:addOnDoubleClick
        on:double-click={() => {
          preset.showMore = !preset.showMore;
        }}
                class="w-full flex gap-1 flex-col justify-between bg-secondary hover:bg-primary-600 p-2
                cursor-pointer {selectedPreset == preset
                  ? 'border border-green-300 bg-primary-600'
                  : 'border border-black border-opacity-0 bg-secondary'}"
              >
                <div
                  class="flex flex-row gap-1 items-center w-full  justify-between"
                >
                  <div class="flex truncate items-center   gap-1">
                    <div
                      class="text-zinc-100 text-xs h-fit px-1 lg:px-2  lg:text-sm xl:text-md  
                      rounded-xl {preset.type == selectedController
                        ? 'bg-violet-600'
                        : 'bg-gray-600 '}"
                    >
                      {preset.type}
                    </div>

                    <div
                      class="text-gray-100 text-left text-sm lg:text-md   truncate "
                    >
                      {preset.name}
                    </div>
                  </div>

                  <div class="flex flex-row gap-1 items-center justify-end">
                    <div class="flex flex-row gap-1">
                      {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                        <button
                          class="p-1 hover:bg-primary-500 rounded"
                          on:click|preventDefault={() => {
                            selectedIndex = i;
              selectedPresetStore.set(preset);
                          }}
                        >
                          <svg
                            class="w-[13px] lg:w-[15px] h-[14px] lg:h-[16px]"
                            width="15"
                            height="16"
                            viewBox="0 0 20 21"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clip-path="url(#clip0_262_1471)">
                              <path
                                d="M3.37381 20.1806C2.526 20.1806 1.71199 19.8298
                              1.06324 19.1804C-0.375193 17.7373 -0.375193
                              15.3901 1.06291 13.9479L12.2792 2.03728C14.0292
                              0.284467 16.7098 0.441967 18.666 2.40072C19.5426
                              3.27884 20.0345 4.54478 20.016 5.87541C19.9976
                              7.19199 19.4832 8.45197 18.6041 9.33259L10.1273
                              18.357C9.89133 18.6098 9.49571 18.6213 9.24385
                              18.3842C8.9926 18.1467 8.98041 17.7504 9.21729
                              17.4985L17.707 8.4604C18.371 7.79509 18.752
                              6.85132 18.766 5.85789C18.7801 4.86384 18.421
                              3.92664 17.7823 3.28632C16.5823 2.08382 14.6285
                              1.45414 13.176 2.91007L1.96006 14.8207C0.995686
                              15.7876 0.995998 17.3404 1.94756 18.2944C2.39379
                              18.741 2.92348 18.9585 3.48754 18.9244C4.04567
                              18.8903 4.61942 18.6041 5.10317 18.1191L14.0275
                              8.62035C14.351 8.29628 15.001 7.50191 14.3394
                              6.83878C13.9647 6.46347 13.7016 6.4866 13.615
                              6.49378C13.3679 6.51566 13.0791 6.6866 12.7794
                              6.98722L6.06223 14.1313C5.82504 14.3835 5.4291
                              14.3957 5.17877 14.1578C4.92721 13.921 4.91565
                              13.5241 5.15221 13.2728L11.8816 6.11535C12.4107
                              5.58378 12.9516 5.29566 13.5022 5.24628C13.9319
                              5.20814 14.571 5.29972 15.2229 5.95347C16.1904
                              6.92283 16.0701 8.34472 14.9244 9.49285L6.00006
                              18.991C5.28756 19.7059 4.42723 20.1213 3.5641
                              20.1744C3.50067 20.1787 3.43723 20.1806 3.37379
                              20.1806L3.37381 20.1806Z"
                                fill="#F1F1F1"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_262_1471">
                                <rect
                                  width="20"
                                  height="20"
                                  fill="white"
                                  transform="translate(0 0.5)"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        </button>
                      {/if}

                      <button
                        class="p-1 hover:bg-primary-500 rounded relative"
                        on:click|preventDefault={() => {
                          selectedPresetStore.set(preset);
                          openPresetInfo(preset);
                        }}
                      >
                        <svg
                          class="fill-white w-[13px] lg:w-[15px] h-[12px] lg:h-[14px]"
                          viewBox="0 0 21 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="url(#clip0_293_1221)">
                            <path
                              d="M10.2723 0.489136C5.02014 0.489136 0.761475
                              4.7478 0.761475 10C0.761475 15.2522 5.02014
                              19.5109 10.2723 19.5109C15.5246 19.5109 19.7832
                              15.2522 19.7832 10C19.7832 4.7478 15.5246 0.489136
                              10.2723 0.489136ZM10.2723 17.8974C5.91178 17.8974
                              2.37493 14.3606 2.37493 10C2.37493 5.63944 5.91178
                              2.10259 10.2723 2.10259C14.6329 2.10259 18.1698
                              5.63944 18.1698 10C18.1698 14.3606 14.6329 17.8974
                              10.2723 17.8974Z"
                            />
                            <path
                              d="M9.25342 6.26359C9.25342 6.53385 9.36078
                              6.79304 9.55188 6.98415C9.74299 7.17525 10.0022
                              7.28261 10.2724 7.28261C10.5427 7.28261 10.8019
                              7.17525 10.993 6.98415C11.1841 6.79304 11.2915
                              6.53385 11.2915 6.26359C11.2915 5.99333 11.1841
                              5.73414 10.993 5.54303C10.8019 5.35193 10.5427
                              5.24457 10.2724 5.24457C10.0022 5.24457 9.74299
                              5.35193 9.55188 5.54303C9.36078 5.73414 9.25342
                              5.99333 9.25342 6.26359ZM10.782
                              8.64131H9.76293C9.66952 8.64131 9.59309 8.71773
                              9.59309 8.81114V14.5856C9.59309 14.679 9.66952
                              14.7554 9.76293 14.7554H10.782C10.8754 14.7554
                              10.9518 14.679 10.9518 14.5856V8.81114C10.9518
                              8.71773 10.8754 8.64131 10.782 8.64131Z"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_293_1221">
                              <rect
                                width="20"
                                height="20"
                                fill="white"
                                transform="translate(0.272461)"
                              />
                            </clipPath>
                          </defs>
                        </svg>

                        <TooltipSetter key={"newProfile_info"} />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="text-gray-100 text-xs self-end lg:text-sm ">
                  @{preset.folder}
                </div>
              </button>
          <!-- <button
            on:click={() => {
              selectedIndex = i;
              selectedPresetStore.set(preset);
            }}
            use:addOnDoubleClick
            on:double-click={() => {
              preset.showMore = !preset.showMore;
            }}
            class="w-full flex gap-1 flex-col  bg-secondary hover:bg-primary-600 p-2
                cursor-pointer {selectedPreset == preset
              ? 'border border-green-300 bg-primary-600'
              : 'border border-black border-opacity-0 bg-secondary'}
                 "
          >
          <div
          class="text-zinc-100 text-xs lg:text-sm h-fit px-2 
                rounded-xl {preset.type == selectedController
            ? 'bg-violet-600'
            : 'bg-gray-600 '}"
        >
          {preset.type === "potentiometer" ? "potmeter" : preset.type}
        </div> <div class="">{preset.name}</div>

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


              <div class="text-gray-100 text-xs  lg:text-sm">
                @{preset.folder}
              </div>
            </div>

            <button
              in:fade
              class="opacity-10 w-6 h-6 bg-primary absolute hover:opacity-70
              text-center right-0 bottom-0"
              on:click={() => {
                preset.showMore = !preset.showMore;
              }}
            >
              {preset.showMore ? "▲" : "▼"}
            </button>
          </button> -->
        {/each}
      </div>
    </div>
  </div>

  <!--   <button
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
  </button> -->
</presets>

<!-- <style>
  .preset:first-child {
    margin-top: 0;
  }

  .preset:last-child {
    margin-bottom: 0;
  }
</style> -->
