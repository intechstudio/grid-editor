<script>
  import { get } from "svelte/store";
  import { clickOutside } from "/main/_actions/click-outside.action";
  import { appSettings } from "/runtime/app-helper.store.js";
  import { selectedPresetStore } from "/runtime/preset-helper.store";
  import { presetChangeCallbackStore } from "../panels/newPreset/preset-change.store";
  import { onMount } from "svelte";
  import { logger } from "/runtime/runtime.store.js";
  import Toggle from "/main/user-interface/Toggle.svelte";

  let editor;
  let modalWidth;
  let modalHeight;

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout();
    }
  }

  let editPresetData = {
    name: $selectedPresetStore.name,
    description: $selectedPresetStore.description,
    type: $selectedPresetStore.type,
    isGridPreset: true, // differentiator from different JSON files!
    version: {
      major: $appSettings.version.major,
      minor: $appSettings.version.minor,
      patch: $appSettings.version.patch,
    },
    configs: $selectedPresetStore.configs,
  };

  let allModulesTypes = ["BU16", "EF44", "PBF4", "EN16", "PO16"];

  let PRESET_PATH = get(appSettings).persistant.presetFolder;
  let PRESETS = [];
  let presetCloud = [];

  async function loadFromDirectory() {
    PRESETS = await window.electron.configs.loadConfigsFromDirectory(
      PRESET_PATH,
      "presets"
    );

    presetCloud = PRESETS;
  }

  async function updateConfigAndCloseModal() {
    await checkIfPresetTitleUnique(editPresetData.name);
    checkIfTitleFieldEmpty(editPresetData.name);
    /* checkIfDescFieldEmpty(editPresetData.description); */

    if (isTitleDirty == true && isTitleUnique == true) {
      await window.electron.configs.updateConfig(
        PRESET_PATH,
        editPresetData.name,
        editPresetData,
        "presets",
        $selectedPresetStore.name,
        "user"
      );

      $selectedPresetStore.name = editPresetData.name;
      $selectedPresetStore.description = editPresetData.description;

      presetChangeCallbackStore.set({
        action: "update",
        profile: $selectedPresetStore,
      });

      logger.set({
        type: "success",
        mode: 0,
        classname: "presetsave",
        message: `Preset saved!`,
      });

      $appSettings.modal = "";
    }
  }

  let isTitleUnique = undefined;

  async function checkIfPresetTitleUnique(input) {
    await loadFromDirectory();

    let notUniqueName = [];

    presetCloud.forEach((element) => {
      if (element.name.toLowerCase().trim() == input.toLowerCase().trim()) {
        notUniqueName.push(element.name.trim());
      }
    });

    if (notUniqueName.length > 0) {
      isTitleUnique = false;
    } else {
      isTitleUnique = true;
    }

    if ($selectedPresetStore.name == input) {
      isTitleUnique = true;
    }
  }

  let isTitleDirty = undefined;
  let isDescDirty = undefined;

  async function checkIfTitleFieldEmpty(input) {
    if (input.length < 1) {
      isTitleDirty = false;
    } else {
      isTitleDirty = true;
    }

    presetCloud = PRESETS.filter((element) => element.folder != "user");
  }

  async function checkIfDescFieldEmpty(input) {
    if (input.length < 1) {
      isDescDirty = false;
    } else {
      isDescDirty = true;
    }
  }
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />
<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50 "
>
  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      $appSettings.modal = "";
    }}
    class="z-50  w-3/6 3xl:w-2/6 h-fit min-h-[379px] max-h-[3/4] text-white relative flex flex-col shadow
    bg-primary bg-opacity-100 items-start opacity-100 p-6 overflow-auto"
  >
    <div>Profile Info - Edit</div>
    <button
      on:click={() => {
        $appSettings.modal = "";
      }}
      id="close-btn"
      class="p-1 absolute top-6 right-6 cursor-pointer rounded not-draggable
      hover:bg-secondary"
    >
      <svg
        class="w-5 h-5 p-1 fill-current text-gray-300"
        viewBox="0 0 29 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091
          2.37512L2.37506 0.142151Z"
        />
        <path
          d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934
          0.142151L28.4264 2.37512Z"
        />
      </svg>
    </button>

    {#if $appSettings.leftPanel == "NewPreset"}
      <div class="p-6 flex flex-col w-full">
        <div class="flex flex-row gap-10  text-gray-500">
          <div class="w-full flex flex-col gap-4">
            <div class="flex flex-col ">
              <label class="mb-1 " for="title">Title</label>
              <input
                id="title"
                placeholder="Enter profile name..."
                bind:value={editPresetData.name}
                on:input={() => {
                  checkIfPresetTitleUnique(editPresetData.name.trim()),
                    checkIfTitleFieldEmpty(editPresetData.name);
                }}
                minlength="2"
                maxlength="60"
                type="text"
                class="w-full py-2 px-3 bg-secondary text-white
              placeholder-gray-400 text-md mb-2 "
              />
              {#if isTitleDirty == false}
                <span class="text-red-500">This field is required</span>
              {/if}
              {#if isTitleUnique == false}
                <span class="text-red-500">This title is already in use.</span>
              {/if}
            </div>

            <div class="flex flex-col">
              <label class="mb-1" for="desc">Description</label>
              <textarea
                id="desc"
                placeholder="Write a short description about this profile..."
                bind:value={editPresetData.description}
                on:input={checkIfDescFieldEmpty(
                  editPresetData.description.trim()
                )}
                minlength="2"
                type="text"
                class="w-full py-2 px-3 h-52 bg-secondary text-white
              placeholder-gray-400 text-md resize-none mb-2"
              />
              <!--          {#if isDescDirty == false}
                <span class="text-red-500">This field is required</span>
              {/if} -->
            </div>

            {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
              <div>Upload Cover Photo</div>
              <div>Upload Attachments</div>
            {/if}
          </div>

          <!-- <div class="w-full flex flex-col gap-4">

                    <div class="flex flex-col">
            <label class="mb-1" for="category">Tags</label>

            <select
              id="category"
              class="bg-secondary border-none flex-grow text-white p-2 shadow">
              <option class="text-white bg-secondary py-1 border-none">
                Element
              </option>
            </select>
          </div> -->

          <!--<div class="flex flex-col">
            <label class="mb-1" for="compContr">Compatible Controller</label>
            <select
              id="compContr"
              class="bg-secondary border-none flex-grow text-white p-2 shadow ">
              <option value="" selected disabled hidden>- Select -</option>

              {#each allModulesTypes as module}
                <option
                  value={module}
                  selected={module == editProfileData.type}>
                  {module}
                </option>
                
              {/each}

            </select>
          </div> -->

          <!--   <div class="flex">
            <Toggle />
            <span class="ml-3 text-md font-medium">Private Profile</span>
          </div>
        </div> -->
        </div>

        <div class="flex justify-between items-center">
          <button
            class="flex items-center focus:outline-none justify-center rounded
          my-2 border-select bg-select hover:border-select-saturate-10
          hover:bg-select-saturate-10 border-2 text-white px-2 py-0.5 mx-1 w-24 "
            on:click|preventDefault={() => {
              $appSettings.modal = "presetInfo";
            }}
          >
            ← back
          </button>
          <button
            on:click={() => updateConfigAndCloseModal()}
            class=" flex items-center focus:outline-none justify-center rounded
          my-22 border-commit bg-commit hover:bg-commit-saturate-20
          hover:border-commit-saturate-20 text-white border-2 px-2 py-0.5 mx-1
          w-24 "
          >
            Save
          </button>
        </div>
      </div>
    {/if}
  </div>
</modal>
