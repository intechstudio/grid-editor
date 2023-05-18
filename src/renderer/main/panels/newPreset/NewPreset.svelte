<script>
  import { get } from "svelte/store";
  import { fade, blur, fly, slide, scale } from "svelte/transition";
  import { selectedPresetStore } from "/runtime/preset-helper.store";
  import { isActionButtonClickedStore } from "/runtime/profile-helper.store";
  import { presetChangeCallbackStore } from "./preset-change.store";
  import { onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { Pane, Splitpanes } from "svelte-splitpanes";
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
  import TooltipSetter from "../../user-interface/tooltip/TooltipSetter.svelte";
  import TooltipConfirm from "../../user-interface/tooltip/TooltipConfirm.svelte";

  let newPreset = {
    name: "",
    description: "",
    type: "",
  };

  let isDeleteButtonClicked = false;

  let selectedPreset = undefined;
  let selectedModule;
  let selectedController;

  let PRESET_PATH = get(appSettings).persistant.presetFolder;
  let PRESETS = [];
  let disableButton = false;
  let isSaveToCloudButtonClicked = false;
  let isSaveToSessionButtonClicked = false;
  let isSearchSortingShows = false;
  let searchbarValue = "";
  let filteredPresetCloud = [];
  let presetCloud = [];
  let sessionPreset = [];

  let isSessionPresetNameUnique = undefined;

  let animateFade;
  let animateFly;

  let searchSuggestions = [
    {
      value: "button",
    },
    {
      value: "fader",
    },
    {
      value: "potentiometer",
    },
    {
      value: "encoder",
    },
  ];

  let sortAsc = true;
  let sortField = "name";
  let selectedPage;

  $: {
    const ui = $user_input;
    let device = get(runtime).find(
      (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
    );

    if (typeof device !== "undefined") {
      newPreset.type = ui.event.elementtype;
      selectedController = ui.event.elementtype;
      selectedModule = device.id.substr(0, 4);
      selectedPage = ui.event.pagenumber;
      /*     presetsOfSelectedDevice = device.pages[selectedPage].control_elements; */
    }
  }

  $: {
    let new_folder = $appSettings.persistant.presetFolder;
    if (new_folder !== PRESET_PATH) {
      PRESET_PATH = new_folder;
    }
  }

  $: {
    const value = $presetListRefresh;
    if (PRESET_PATH && value) {
      loadFromDirectory();
    }
  }

  $: {
    const store = $presetChangeCallbackStore;
    if (store.action == "update" || store.action == "delete") {
      loadFromDirectory();
    }
  }

  async function moveOld() {
    await window.electron.configs.moveOldConfigs(PRESET_PATH, "presets");
    loadFromDirectory();
  }

  async function loadFromDirectory() {
    animateFade = false;

    if (PRESET_PATH == undefined || PRESET_PATH == "") {
      return;
    }

    PRESETS = await window.electron.configs.loadConfigsFromDirectory(
      PRESET_PATH,
      "presets"
    );

    PRESETS.forEach((element) => {
      if (element.id == undefined || element.id == "") {
        element.id = element.name.replace(/\W+/g, "-");
      }
    });

    presetCloud = PRESETS.filter(
      (element) => element.folder != "sessionPreset"
    );

    sessionPreset = PRESETS.filter(
      (element) => element.folder == "sessionPreset"
    );

    filteredPresetCloud = presetCloud;

    sortPresetCloud(sortField, sortAsc);

    updateSearchFilter(searchbarValue);

    sessionPreset.sort(compareDateDescending);

    animateFade = true;
  }

  async function updateSessionPresetTitle(preset, newName) {
    checkIfPresetTitleUnique(newName);
    checkIfTitleFieldEmpty(newName);

    animateFade = false;

    if (isSessionPresetNameUnique && isTitleDirty && preset.name != newName) {
      let oldName = preset.name;
      preset.name = newName;

      await window.electron.configs.updateConfig(
        PRESET_PATH,
        newName,
        preset,
        "presets",
        oldName,
        "sessionPreset"
      );
    } else if (isSessionPresetNameUnique == false && preset.name != newName) {
      sessionPreset = [];

      logger.set({
        type: "fail",
        mode: 0,
        classname: "sessionpreseteditname",
        message: `A preset already exists with name "${newName}" in Session Presets.`,
      });
    }

    await loadFromDirectory();
  }

  async function saveToDirectory(path, name, preset, user) {
    disableButton = true;
    if (isSaveToSessionButtonClicked == true) {
      logger.set({
        type: "success",
        mode: 0,
        classname: "presetesave",
        message: `${name} saved to Session Presets!`,
      });
    }

    if (isSaveToCloudButtonClicked == true) {
      logger.set({
        type: "success",
        mode: 0,
        classname: "presetsave",
        message: `${name} saved to Preset Cloud!`,
      });
    }

    if (
      isSaveToSessionButtonClicked != true &&
      isSaveToCloudButtonClicked != true
    ) {
      logger.set({
        type: "success",
        mode: 0,
        classname: "presetsave",
        message: `${name} saved!`,
      });
    }

    await window.electron.configs.saveConfig(
      path,
      name,
      preset,
      "presets",
      user
    );

    animateFly = true;
    /* 
    newPreset.name = "";
    newPreset.description = ""; */

    await loadFromDirectory();
    animateFly = false;
    disableButton = false;
  }

  function prepareSave(user) {
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

      let name = selectedPreset.name;
      let description = selectedPreset.description;
      let type = selectedPreset.type;
      let id = selectedPreset.id;

      let preset = {
        name: name,
        description: description,
        type: type,
        isGridPreset: true, // differentiator from different JSON files!
        version: {
          major: $appSettings.version.major,
          minor: $appSettings.version.minor,
          patch: $appSettings.version.patch,
        },
        id: id,
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

      if (user == "user") {
        let isPresetCloudNameUnique;

        presetCloud.forEach((preset) => {
          if (
            name.toLowerCase() == preset.name.toLowerCase() &&
            preset.folder == "user"
          ) {
            isPresetCloudNameUnique = false;
          }
        });

        if (isPresetCloudNameUnique == false) {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "presetsavefailed",
            message: `A preset with "${name}" name is already exists in Preset Cloud!`,
          });
        } else {
          saveToDirectory(PRESET_PATH, preset.name, preset, user);
          deleteFromDirectory(selectedPreset);
        }
      }

      if (user == "sessionPreset") {
        if (selectedController != selectedPreset.type) {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "presetsavefailed",
            message: `Cannot overwrite a preset with different module type!`,
          });
        } else {
          saveToDirectory(PRESET_PATH, preset.name, preset, user);
        }
      }

      engine.set("ENABLED");
    };

    runtime.fetch_page_configuration_from_grid(callback);
  }

  let number = 0;
  let sessionPresetNumbers = [];

  async function saveToSessionPreset() {
    let user = "sessionPreset";

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

      let name;
      let description;
      let type;

      if (user == "sessionPreset") {
        loadFromDirectory(); // ?? @tofi, miért töltjük be itt a profilokat?

        let sessionPresetName;
        sessionPresetNumbers = [];

        sessionPreset.forEach((sessionPresetElement) => {
          sessionPresetName = JSON.stringify(sessionPresetElement.name);

          if (sessionPresetName.includes("Session Preset")) {
            sessionPresetNumbers = [
              ...sessionPresetNumbers,
              parseInt(sessionPresetName.split(" ").pop(), 10),
            ];
          }
        });

        let largestNumber = Math.max(...sessionPresetNumbers);

        if (largestNumber > 0) {
          number = largestNumber;
          number++;
        } else {
          number++;
        }

        name = `Session Preset ${number}`;
        description = "";
        type = selectedController;
      }

      let preset = {
        name: name,
        description: description,
        type: type,
        isGridPreset: true, // differentiator from different JSON files!
        version: {
          major: $appSettings.version.major,
          minor: $appSettings.version.minor,
          patch: $appSettings.version.patch,
        },
        id: uuidv4(),
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

      saveToDirectory(PRESET_PATH, preset.name, preset, user);

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

  function openPresetInfo() {
    $appSettings.modal = "presetInfo";
  }

  function filterShowHide() {
    isSearchSortingShows = !isSearchSortingShows;
    animateFade = true;
  }

  function updateSearchFilter(input) {
    animateFade = false;
    filteredPresetCloud = [];

    const arrayOfSearchTerms = input.trim().toLowerCase().split(" ");

    presetCloud.forEach((preset) => {
      const currentPresetSearchable =
        preset.name.toLowerCase() +
        " " +
        preset.type.toLowerCase() +
        " " +
        preset.folder.toLowerCase();
      let filterMatch = true;

      arrayOfSearchTerms.forEach((searchTerm) => {
        if (currentPresetSearchable.indexOf(searchTerm) === -1) {
          filterMatch = false;
        }
      });

      if (filterMatch) {
        filteredPresetCloud = [...filteredPresetCloud, preset];
      }
    });

    sortPresetCloud(sortField, sortAsc);
  }

  function sortPresetCloud(field, asc) {
    if (field == "name") {
      if (asc == true) {
        filteredPresetCloud = filteredPresetCloud.sort(compareNameAscending);
      }
      if (asc == false) {
        filteredPresetCloud = filteredPresetCloud.sort(compareNameDescending);
      }
    }

    if (field == "date") {
      if (asc == true) {
        filteredPresetCloud = filteredPresetCloud.sort(compareDateAscending);
      }
      if (asc == false) {
        filteredPresetCloud = filteredPresetCloud.sort(compareDateDescending);
      }
    }

    if (field == "control_element") {
      if (asc == true) {
        filteredPresetCloud = filteredPresetCloud.sort(
          compareControlElementAscending
        );
      }
      if (asc == false) {
        filteredPresetCloud = filteredPresetCloud.sort(
          compareControlElementDescending
        );
      }
    }
  }

  let compareNameAscending = (a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, {
      numeric: true,
    });
  };

  let compareNameDescending = (a, b) => {
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase(), undefined, {
      numeric: true,
    });
  };

  function compareDateAscending(a, b) {
    return a.fsModifiedAt - b.fsModifiedAt;
  }

  function compareDateDescending(a, b) {
    return b.fsModifiedAt - a.fsModifiedAt;
  }

  function compareControlElementAscending(a, b) {
    return a.type.localeCompare(b.type, undefined, {
      numeric: true,
    });
  }

  function compareControlElementDescending(a, b) {
    return b.type.localeCompare(a.type, undefined, {
      numeric: true,
    });
  }

  function useSearchSuggestion(suggestionText) {
    updateSearchFilter((searchbarValue = suggestionText));
  }

  async function checkIfPresetTitleUnique(input) {
    let notUniqueName = [];

    presetCloud.forEach((element) => {
      if (
        element.name.toLowerCase() == input.toLowerCase() &&
        element.folder == "user"
      ) {
        notUniqueName = [...notUniqueName, element.name];
      }
    });

    if (notUniqueName.length > 0) {
      isSessionPresetNameUnique = false;
    } else {
      isSessionPresetNameUnique = true;
    }
  }

  let isTitleDirty = undefined;

  async function checkIfTitleFieldEmpty(input) {
    if (input.length < 1) {
      isTitleDirty = false;
    } else {
      isTitleDirty = true;
    }
  }

  function fadeAnimation(node, options) {
    if (animateFade) {
      return options.fn(node, options);
    }
  }

  function flyAnimation(node, options) {
    if (animateFly) {
      return options.fn(node, options);
    }
  }

  function selectPreset(preset) {
    selectedPreset = preset;
    selectedPresetStore.set(selectedPreset);
  }

  async function deleteFromDirectory(element) {
    disableButton = true;

    if (isDeleteButtonClicked) {
      logger.set({
        type: "success",
        mode: 0,
        classname: "presetdelete",
        message: `${element.name.trim()} deleted!`,
      });
    }
    isDeleteButtonClicked = false;

    await window.electron.configs.deleteConfig(
      PRESET_PATH,
      element.name.trim(),
      "presets",
      element.folder
    );

    await loadFromDirectory();
    disableButton = false;
    isActionButtonClickedStore.set(false);

    selectedPresetStore.set({});
  }

  function deleteSessionPreset(preset) {
    isActionButtonClickedStore.set(true);
    isDeleteButtonClicked = true;
    deleteFromDirectory(preset);
  }

  function saveFromSessionToCloud(preset) {
    isSaveToCloudButtonClicked = true;
    isActionButtonClickedStore.set(true);

    saveToDirectory(PRESET_PATH, preset.name, preset, "user");
    deleteSessionPreset(preset);

    selectedPreset = undefined;
    isSaveToCloudButtonClicked = false;
  }

  function rewriteSessionPreset(preset) {
    isActionButtonClickedStore.set(true);

    selectPreset(preset);
    prepareSave("sessionPreset");
  }

  onMount(() => {
    animateFade = true;
    animateFly = false;
    moveOld();
  });
</script>

<presets
  class="flex flex-col h-full justify-between p-4 bg-primary {$engine ==
  'ENABLED'
    ? ''
    : 'pointer-events-none'}"
>
  <div class="flex w-full h-full flex-col overflow-hidden">
    <div
      class="flex justify-between items-center p-4 text-white font-medium
  cursor-pointer w-full"
    >
      <div>Session Presets</div>
    </div>
    <Splitpanes
      horizontal="true"
      theme="modern-theme"
      pushOtherPanes={false}
      class="flex w-full h-full flex-col overflow-hidden"
    >
      <Pane size={31}>
        <div class=" flex flex-col bg-primary overflow-hidden h-full w-full">
          <div
            in:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
            out:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
            class=" flex flex-col p-3 overflow-hidden h-full"
          >
            <button
              on:click={() => {
                saveToSessionPreset();
              }}
              class="relative bg-commit block
    w-full text-white mb-4 py-2 px-2 rounded border-commit-saturate-10
    hover:border-commit-desaturate-10 focus:outline-none"
            >
              <div>Save Session Preset</div>
              <TooltipSetter key={"newPreset_add_to_session"} />
            </button>
            <div class="flex flex-col overflow-y-auto gap-4">
              {#if sessionPreset.length == 0}
                <div class="text-gray-300">No preset to show</div>
              {/if}

              {#each sessionPreset as sessionPresetElement (sessionPresetElement.id)}
                <button
                  in:flyAnimation|local={{ fn: fly, x: -50, duration: 200 }}
                  out:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
                  on:click={() => selectPreset(sessionPresetElement)}
                  class="cursor-pointer flex justify-between gap-2 items-center
        text-left p-2 bg-secondary hover:bg-primary-600
        {sessionPresetElement == $selectedPresetStore
                    ? 'border border-green-300'
                    : 'border border-black border-opacity-0'}
        "
                >
                  <div class="flex gap-2 items-center w-full">
                    <div
                      class="text-zinc-100 text-xs lg:text-sm h-fit px-2
                rounded-xl {selectedController == sessionPresetElement.type
                        ? 'bg-violet-600'
                        : 'bg-gray-600 '}"
                    >
                      {sessionPresetElement.type}
                    </div>

                    <div class="flex justify-between flex-row w-full">
                      <!--use:clickOutside={{ useCapture: true }}-->
                      <input
                        type="text"
                        value={sessionPresetElement.name}
                        on:click={() => selectPreset(sessionPresetElement)}
                        on:blur={(e) => {
                          let newName = e.target.value.trim();
                          animateFade = false;
                          updateSessionPresetTitle(
                            sessionPresetElement,
                            newName
                          );
                        }}
                        on:keypress={(e) => {
                          if (e.key === 13) {
                            let newName = e.target.value.trim();
                            updateSessionPresetTitle(
                              sessionPresetElement,
                              newName
                            );
                          }
                        }}
                        class="text-zinc-100 min-w-[15px] px-2 h-fit break-words
              bg-transparent overflow-hidden w-full cursor-text hover:bg-primary-500 truncate text-sm lg:text-md"
                      />
                    </div>
                  </div>

                  <div class="flex gap-1">
                    <button
                      on:click|preventDefault={() => {
                        deleteSessionPreset(sessionPresetElement);
                      }}
                      class="p-1 hover:bg-primary-500 {$selectedPresetStore ==
                        sessionPresetElement && disableButton == true
                        ? 'pointer-events-none'
                        : 0} rounded relative"
                    >
                      <svg
                        class="w-[14px] lg:w-[16px] h-[14px] lg:h-[16px]"
                        viewBox="0 0 39 39"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M24.25 23.9102L14.75 14.4102M24.25 14.4102L14.75
                23.9102"
                          stroke="#FFF"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                        <path
                          d="M19.5001 34.9933C28.2446 34.9933 35.3334 27.9045
                35.3334 19.16C35.3334 10.4155 28.2446 3.32666 19.5001
                3.32666C10.7556 3.32666 3.66675 10.4155 3.66675
                19.16C3.66675 27.9045 10.7556 34.9933 19.5001 34.9933Z"
                          stroke="#FFF"
                          stroke-width="2"
                        />
                      </svg>
                      <TooltipConfirm key={"newPreset_delete"} />
                      <TooltipSetter key={"newPreset_delete"} />
                    </button>

                    <button
                      class="p-1 hover:bg-primary-500 rounded relative {$selectedPresetStore ==
                        sessionPresetElement && disableButton == true
                        ? 'pointer-events-none'
                        : 0}"
                      on:click|preventDefault={() => {
                        saveFromSessionToCloud(sessionPresetElement);
                      }}
                      on:blur={() => {
                        isActionButtonClickedStore.set(false);
                      }}
                    >
                      <svg
                        class="w-[13px] lg:w-[15px] h-[12px] lg:h-[14px]"
                        viewBox="0 0 19 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0.769287 2.57143C0.769287 1.88944 1.0402 1.23539
                1.52244 0.753154C2.00468 0.270917 2.65873 0 3.34072
                0H14.1137C14.7956 0.000145639 15.4496 0.271159 15.9317
                0.753429L18.0159 2.83757C18.4981 3.3197 18.7691 3.97364
                18.7693 4.65557V15.4286C18.7693 16.1106 18.4984 16.7646
                18.0161 17.2468C17.5339 17.7291 16.8798 18 16.1979
                18H3.34072C2.65873 18 2.00468 17.7291 1.52244
                17.2468C1.0402 16.7646 0.769287 16.1106 0.769287
                15.4286V2.57143ZM3.34072 1.28571C2.99972 1.28571 2.6727
                1.42117 2.43158 1.66229C2.19046 1.90341 2.055 2.23044
                2.055 2.57143V15.4286C2.055 15.7696 2.19046 16.0966
                2.43158 16.3377C2.6727 16.5788 2.99972 16.7143 3.34072
                16.7143V10.9286C3.34072 10.4171 3.5439 9.92654 3.90558
                9.56487C4.26726 9.20319 4.7578 9 5.26929 9H14.2693C14.7808
                9 15.2713 9.20319 15.633 9.56487C15.9947 9.92654 16.1979
                10.4171 16.1979 10.9286V16.7143C16.5389 16.7143 16.8659
                16.5788 17.107 16.3377C17.3481 16.0966 17.4836 15.7696
                17.4836 15.4286V4.65557C17.4835 4.31461 17.348 3.98763
                17.1069 3.74657L15.0227 1.66243C14.7817 1.42129 14.4547
                1.28579 14.1137 1.28571H13.6264V4.5C13.6264 5.01149
                13.4232 5.50203 13.0616 5.86371C12.6999 6.22538 12.2093
                6.42857 11.6979 6.42857H6.555C6.04351 6.42857 5.55297
                6.22538 5.1913 5.86371C4.82962 5.50203 4.62643 5.01149
                4.62643 4.5V1.28571H3.34072ZM5.91214 1.28571V4.5C5.91214
                4.6705 5.97987 4.83401 6.10043 4.95457C6.22099 5.07513
                6.3845 5.14286 6.555 5.14286H11.6979C11.8684 5.14286
                12.0319 5.07513 12.1524 4.95457C12.273 4.83401 12.3407
                4.6705 12.3407 4.5V1.28571H5.91214ZM14.9121
                16.7143V10.9286C14.9121 10.7581 14.8444 10.5946 14.7239
                10.474C14.6033 10.3534 14.4398 10.2857 14.2693
                10.2857H5.26929C5.09879 10.2857 4.93528 10.3534 4.81472
                10.474C4.69416 10.5946 4.62643 10.7581 4.62643
                10.9286V16.7143H14.9121Z"
                          fill="#F1F1F1"
                        />
                      </svg>

                      <TooltipSetter key={"newPreset_save"} />
                    </button>

                    <button
                      class="p-1 hover:bg-primary-500 rounded relative"
                      on:click|preventDefault={() => {
                        rewriteSessionPreset(sessionPresetElement);
                      }}
                      on:blur={() => {
                        isActionButtonClickedStore.set(false);
                      }}
                    >
                      <svg
                        class="w-[13px] lg:w-[15px] h-[12px] lg:h-[14px]"
                        viewBox="0 0 19 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clip-path="url(#clip0_262_1198)">
                          <path
                            d="M18.4932 2.51357L17.2847 3.45857C15.6368 1.35214
                  13.074 0 10.1961 0C5.22682 0 1.20468 4.01786 1.19825
                  8.98929C1.19182 13.965 5.22254 18 10.1961 18C14.0811 18
                  17.3918 15.5357 18.6518 12.0836C18.684 11.9936 18.6368
                  11.8929 18.5468 11.8629L17.3318 11.445C17.2895 11.4305
                  17.2431 11.4331 17.2027 11.4523C17.1622 11.4716 17.1309
                  11.5058 17.1154 11.5479C17.0768 11.655 17.034 11.7621
                  16.989 11.8671C16.6183 12.7457 16.0868 13.5343 15.4097
                  14.2114C14.738 14.8844 13.9427 15.4213 13.0675
                  15.7929C12.1611 16.1764 11.1947 16.3714 10.2004
                  16.3714C9.20396 16.3714 8.23968 16.1764 7.33325
                  15.7929C6.4572 15.4229 5.66165 14.8857 4.99111
                  14.2114C4.31761 13.5398 3.78121 12.7436 3.41182
                  11.8671C3.02825 10.9586 2.83325 9.99429 2.83325
                  8.99786C2.83325 8.00143 3.02825 7.03714 3.41182
                  6.12857C3.78254 5.25 4.31396 4.46143 4.99111
                  3.78429C5.66825 3.10714 6.45682 2.57571 7.33325
                  2.20286C8.23968 1.81929 9.20611 1.62429 10.2004
                  1.62429C11.1968 1.62429 12.1611 1.81929 13.0675
                  2.20286C13.9436 2.57281 14.7391 3.10997 15.4097
                  3.78429C15.6218 3.99643 15.8211 4.22143 16.0054
                  4.45714L14.7154 5.46429C14.6899 5.48403 14.6704 5.51058
                  14.6593 5.54088C14.6482 5.57117 14.6459 5.60399 14.6526
                  5.63555C14.6593 5.66712 14.6748 5.69614 14.6973
                  5.7193C14.7198 5.74245 14.7483 5.75879 14.7797
                  5.76643L18.5425 6.68786C18.6497 6.71357 18.7547 6.63214
                  18.7547 6.52286L18.7718 2.64643C18.7697 2.505 18.6047
                  2.42571 18.4932 2.51357V2.51357Z"
                            fill="#F1F1F1"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_262_1198">
                            <rect
                              width="18"
                              height="18"
                              fill="white"
                              transform="translate(0.769287)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                      <TooltipSetter key={"newPreset_rewrite"} />
                    </button>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </Pane>
      <Pane minSize={28}>
        <div class="flex flex-col h-full overflow-hidden bg-primary">
          <div
            class="flex justify-between items-center p-4
    w-full"
          >
            <div class="text-white font-medium">Preset Cloud</div>
            <button
              on:click={() => {
                filterShowHide();
              }}
              class="text-white text-left font-xs"
            >
              {#if isSearchSortingShows}
                Hide Filters
              {:else}
                Show Filters
              {/if}
            </button>
          </div>

          <div
            class="flex flex-col overflow-hidden"
            id="browse-presets"
            in:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
            out:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
          >
            {#if isSearchSortingShows == true}
              <div
                in:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
                out:fadeAnimation|local={{ fn: fade, y: 50, duration: 150 }}
              >
                <div class="flex flex-col gap-1 p-3">
                  <div class="relative">
                    <svg
                      class="absolute left-3 bottom-[28%]"
                      width="14"
                      height="14"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.2095 11.6374C14.2989 10.1509 14.7868 8.30791 14.5756
              6.47715C14.3645 4.64639 13.4699 2.96286 12.0708 1.76338C10.6717
              0.563893 8.87126 -0.0630888 7.02973 0.0078685C5.1882 0.0788258
              3.44137 0.84249 2.13872 2.14608C0.83606 3.44967 0.0736462 5.19704
              0.00400665 7.03862C-0.0656329 8.8802 0.562637 10.6802 1.76312
              12.0784C2.96361 13.4767 4.64778 14.3701 6.47869 14.5799C8.3096
              14.7897 10.1522 14.3005 11.6379 13.2101H11.6368C11.6705 13.2551
              11.7065 13.2979 11.747 13.3395L16.0783 17.6707C16.2892 17.8818
              16.5754 18.0005 16.8738 18.0006C17.1723 18.0007 17.4585 17.8822
              17.6696 17.6713C17.8807 17.4603 17.9994 17.1742 17.9995
              16.8758C17.9996 16.5773 17.8811 16.2911 17.6702 16.08L13.3389
              11.7487C13.2987 11.708 13.2554 11.6704 13.2095
              11.6362V11.6374ZM13.4998 7.31286C13.4998 8.12541 13.3397 8.93001
              13.0288 9.68071C12.7178 10.4314 12.2621 11.1135 11.6875
              11.6881C11.113 12.2626 10.4308 12.7184 9.68014 13.0294C8.92944
              13.3403 8.12484 13.5004 7.31229 13.5004C6.49974 13.5004 5.69514
              13.3403 4.94444 13.0294C4.19373 12.7184 3.51163 12.2626 2.93707
              11.6881C2.3625 11.1135 1.90674 10.4314 1.59578 9.68071C1.28483
              8.93001 1.12479 8.12541 1.12479 7.31286C1.12479 5.67183 1.77669
              4.09802 2.93707 2.93763C4.09745 1.77725 5.67126 1.12536 7.31229
              1.12536C8.95332 1.12536 10.5271 1.77725 11.6875 2.93763C12.8479
              4.09802 13.4998 5.67183 13.4998 7.31286V7.31286Z"
                        fill="#CDCDCD"
                      />
                    </svg>

                    {#if searchbarValue != ""}
                      <button
                        class="absolute right-2 bottom-[25%]"
                        on:click={() =>
                          updateSearchFilter((searchbarValue = ""))}
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 39 39"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M24.25 32.9102L14.75 23.4102M24.25 23.4102L14.75 32.9102"
                            stroke="#FFF"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      </button>
                    {/if}

                    <input
                      type="text"
                      bind:value={searchbarValue}
                      on:keyup={() => updateSearchFilter(searchbarValue)}
                      on:input={() => updateSearchFilter(searchbarValue)}
                      on:change={() => updateSearchFilter(searchbarValue)}
                      class="w-full py-2 px-12 bg-primary-700 text-white
            placeholder-gray-400 text-md focus:outline-none"
                      placeholder="Find Preset..."
                    />
                  </div>

                  <div class="flex flex-row gap-2 py-3 flex-wrap">
                    {#each searchSuggestions as suggestion}
                      <button
                        on:click={() => useSearchSuggestion(suggestion.value)}
                        class="border hover:border-primary-500 text-sm text-primary-100 rounded-md
                  py-1 px-2 h-min {searchbarValue.toLowerCase() ==
                        suggestion.value.toLowerCase()
                          ? 'border-primary-100'
                          : 'border-primary-700'}"
                      >
                        {suggestion.value}
                      </button>
                    {/each}
                  </div>
                </div>

                <div
                  class="flex gap-2 items-center justify-between flex-wrap p-3"
                >
                  <label
                    for="sorting select"
                    class="uppercase text-gray-500 py-1 text-sm"
                  >
                    sort by
                  </label>

                  <select
                    class="bg-secondary border-none flex-grow text-white p-2 focus:outline-none"
                    id="sortingSelectBox"
                    on:change={(e) => {
                      sortField = e.target.value;
                      sortPresetCloud(sortField, sortAsc);
                    }}
                    name="sorting select"
                  >
                    <option
                      selected
                      class="text-white bg-secondary py-1 border-none"
                      value="name"
                    >
                      name
                    </option>

                    <option
                      class="text-white bg-secondary py-1 border-none"
                      value="control_element"
                    >
                      control element
                    </option>
                  </select>

                  <button
                    on:click={() => {
                      sortAsc = !sortAsc;
                      sortPresetCloud(sortField, sortAsc);
                    }}
                  >
                    {#if sortAsc == false}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 11H15M11 15H18M11 19H21M9 7L6 4L3 7M6 6V20"
                          stroke="white"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    {:else}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 5H21M11 9H18M11 13H15M3 17L6 20L9 17M6 18V4"
                          stroke="white"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>
            {/if}

            <div class="w-full">
              {#if PRESETS.length === 0}
                <div in:fade={{ delay: 500 }} class="text-yellow-500">
                  <b>Presets not found!</b>
                </div>
                <div in:fade={{ delay: 1000 }} class="text-yellow-500">
                  Setup preset folder and download the default preset library in
                  the Preferences menu...
                </div>
              {/if}
            </div>
            <div
              in:fadeAnimation={{ fn: fade, y: 50, duration: 150 }}
              out:fadeAnimation={{ fn: fade, y: 50, duration: 150 }}
              class="p-3 gap-6 flex flex-col h-full overflow-auto"
            >
              <div class="flex flex-col overflow-auto">
                <div class="overflow-auto flex flex-col gap-4 mb-2">
                  {#each filteredPresetCloud as preset (preset.id)}
                    <button
                      in:flyAnimation={{ fn: fly, x: -50, duration: 200 }}
                      out:fadeAnimation={{ fn: fade, y: 50, duration: 150 }}
                      on:click={() => {
                        selectedPresetStore.set(preset);
                      }}
                      class="w-full flex gap-1 flex-col justify-between bg-secondary hover:bg-primary-600 p-2
                cursor-pointer {$selectedPresetStore == preset
                        ? 'border border-green-300 bg-primary-600'
                        : 'border border-black border-opacity-0 bg-secondary'}"
                    >
                      <div
                        class="flex flex-row gap-1 items-center w-full justify-between"
                      >
                        <div class="flex truncate items-center gap-1">
                          <div
                            class="text-zinc-100 text-xs h-fit px-1 lg:px-2 lg:text-sm xl:text-md
                      rounded-xl {preset.type == selectedController
                              ? 'bg-violet-600'
                              : 'bg-gray-600 '}"
                          >
                            {preset.type}
                          </div>

                          <div
                            class="text-gray-100 text-left text-sm lg:text-md truncate"
                          >
                            {preset.name}
                          </div>
                        </div>

                        <div
                          class="flex flex-row gap-1 items-center justify-end"
                        >
                          <div class="flex flex-row gap-1">
                            {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                              <button
                                class="p-1 hover:bg-primary-500 rounded"
                                on:click|preventDefault={() => {
                                  selectPreset(preset);
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
                                selectPreset(preset);
                                openPresetInfo();
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

                              <TooltipSetter key={"newPreset_info"} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="text-gray-100 text-xs self-end lg:text-sm">
                        @{preset.folder}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div></Pane
      >
    </Splitpanes>

    <!--     <div class="flex flex-col w-full py-2">
      <div class="text-sm text-gray-500 pb-1">Preset name</div>
      <input
        bind:value={newPreset.name}
        on:input={checkIfPresetTitleUnique(newPreset.name.trim())}
        type="text"
        placeholder="Name of this preset..."
        class="w-full bg-secondary text-white py-1 pl-2 rounded-none"
      />
      {#if isTitleUnique == false}
        <span class="text-red-500 py-2">This name is already in use.</span>
      {/if}
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
      on:click={() => {
        prepareSave("user");
      }}
      disabled={!checkIfOk(newPreset) || !isTitleUnique}
      class="{!checkIfOk(newPreset) || !isTitleUnique
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer opacity-100  hover:bg-commit-saturate-10'}
      transition w-full px-2 py-2 my-2 block rounded text-white bg-commit
      relative border-none focus:outline-none"
    >
      <div>Save</div>
      <TooltipSetter key={"newPreset_save"} />
    </button>
  </div>

  <div>
    <button on:click={()=>{saveToSessionPreset()}}>add to Session Preset</button>
    {#each sessionPreset as sessionPresetElement}
      <div class="text-white">{sessionPresetElement.name}</div>
    {/each}

    {#each presetsOfSelectedDevice as presetsOfDevice}
      <div>
        {presetsOfDevice.controlElementName}, {presetsOfDevice.controlElementType}
      </div>
    {/each}
  </div>

-->
  </div>
</presets>

<!-- <style>
.preset:first-child {
    margin-top: 0;
}

.preset:last-child {
    margin-bottom: 0;
}
</style>

-->
