<script>
  import { get } from "svelte/store";
  import { clickOutside } from "/main/_actions/click-outside.action";
  import { appSettings } from "/runtime/app-helper.store.js";
  import { selectedProfileStore } from "/runtime/profile-helper.store";
  import { onMount } from "svelte";
  import { logger } from "/runtime/runtime.store.js";
  import Toggle from "/main/user-interface/Toggle.svelte";
  import { profileChangeCallbackStore } from "../panels/newProfile/profile-change.store";

  let editor;
  let modalWidth;
  let modalHeight;

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout();
    }
  }

  let editProfileData = {
    name: $selectedProfileStore.name,
    description: $selectedProfileStore.description,
    type: $selectedProfileStore.type,
    isGridProfile: true, // differentiator from different JSON files!
    version: {
      major: $appSettings.version.major,
      minor: $appSettings.version.minor,
      patch: $appSettings.version.patch,
    },
    config: $selectedProfileStore.configs,
  };

  let allModulesTypes = ["BU16", "EF44", "PBF4", "EN16", "PO16"];

  let PROFILE_PATH = get(appSettings).persistant.profileFolder;
  let PROFILES = [];
  let profileCloud = [];

  async function loadFromDirectory() {
    PROFILES = await window.electron.configs.loadConfigsFromDirectory(
      PROFILE_PATH,
      "profiles"
    );

    profileCloud = PROFILES.filter(
      (element) => element.folder != "sessionProfile"
    );
  }

  async function updateConfig() {
    await checkIfProfileTitleUnique(editProfileData.name);
    checkIfTitleFieldEmpty(editProfileData.name);
    checkIfDescFieldEmpty(editProfileData.description);

    console.log(
      "isTitleUnique",
      isTitleUnique,
      "isDescDirty",
      isDescDirty,
      "isTitleDirty",
      isTitleDirty
    );

    if (isTitleDirty == true && isDescDirty == true && isTitleUnique == true) {
      await window.electron.configs.updateConfig(
        PROFILE_PATH,
        editProfileData.name,
        editProfileData,
        "profiles",
        $selectedProfileStore.name,
        "user"
      );

      $selectedProfileStore.name = editProfileData.name;
      $selectedProfileStore.description = editProfileData.description;

      profileChangeCallbackStore.set({
        action: "update",
        profile: $selectedProfileStore,
      });

      logger.set({
        type: "success",
        mode: 0,
        classname: "profilesave",
        message: `Profile saved!`,
      });
    }
  }

  let isTitleUnique = undefined;

  async function checkIfProfileTitleUnique(input) {
    loadFromDirectory();

    let notUniqueName = [];

    profileCloud.forEach((element) => {
      if (element.name.trim() == input.trim()) {
        notUniqueName.push(element.name.trim());
      }
    });

    if (notUniqueName.length > 0) {
      isTitleUnique = false;
    } else {
      isTitleUnique = true;
    }

    if ($selectedProfileStore.name == input) {
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
    class="z-50 w-4/6 h-fit max-h-[3/4] text-white relative flex flex-col shadow
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

    <div class="p-6 flex flex-col w-full">
      <form action="" class="flex flex-row gap-10 text-gray-500">
        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col ">
            <label class="mb-1 " for="title">Title</label>
            <input
              id="title"
              bind:value={editProfileData.name}
              on:input={() => {
                checkIfProfileTitleUnique(editProfileData.name.trim()),
                  checkIfTitleFieldEmpty(editProfileData.name);
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
              bind:value={editProfileData.description}
              on:input={checkIfDescFieldEmpty(
                editProfileData.description.trim()
              )}
              minlength="2"
              type="text"
              class="w-full py-2 px-3 h-52 bg-secondary text-white
              placeholder-gray-400 text-md resize-none mb-2"
            />
            {#if isDescDirty == false}
              <span class="text-red-500">This field is required</span>
            {/if}
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
      </form>

      <div class="flex justify-between items-center">
        <button
          class="flex items-center focus:outline-none justify-center rounded
          my-2 border-select bg-select hover:border-select-saturate-10
          hover:bg-select-saturate-10 border-2 text-white px-2 py-0.5 mx-1 w-24 "
          on:click|preventDefault={() => {
            $appSettings.modal = "profileInfo";
          }}
        >
          ← back
        </button>
        <button
          on:click={() => updateConfig()}
          class=" flex items-center focus:outline-none justify-center rounded
          my-22 border-commit bg-commit hover:bg-commit-saturate-20
          hover:border-commit-saturate-20 text-white border-2 px-2 py-0.5 mx-1
          w-24 "
        >
          Save
        </button>
      </div>
    </div>
  </div>
</modal>
