<script>
  import { get } from "svelte/store";
  import { clickOutside } from "/main/_actions/click-outside.action";
  import { appSettings } from "/runtime/app-helper.store";
  import { selectedProfileStore } from "/runtime/profile-helper.store";
  import { setTooltip } from "/main/user-interface/tooltip/Tooltip.js";
  import { presetChangeCallbackStore } from "../panels/newPreset/preset-change.store";
  import { v4 as uuidv4 } from "uuid";

  import { onMount } from "svelte";
  import {
    engine,
    logger,
    runtime,
    user_input,
  } from "/runtime/runtime.store.js";

  let editor;
  let modalWidth;
  let modalHeight;
  let PRESETS;
  let PROFILE_PATH = [];
  let PRESET_PATH = [];

  PROFILE_PATH = get(appSettings).persistant.profileFolder;
  PRESET_PATH = get(appSettings).persistant.presetFolder;

  let sessionPreset = GetSessionPreset();

  async function GetSessionPreset() {
    if (PRESETS == null) {
      await loadFromDirectory();
    }
    sessionPreset = PRESETS.filter(
      (element) => element.folder == "sessionPreset"
    );
  }

  async function loadFromDirectory() {
    PRESETS = await window.electron.configs.loadConfigsFromDirectory(
      PRESET_PATH,
      "presets"
    );
  }

  let liked = false;

  modalWidth = 500;

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout();
    }
  }

  function isProfileLiked() {
    liked = !liked;
  }

  let selectedProfile = get(selectedProfileStore);

  async function deleteProfileFromDirectory(element) {
    await window.electron.configs.deleteConfig(
      PROFILE_PATH,
      element.name,
      "profiles",
      element.folder
    );

    presetChangeCallbackStore.set({
      action: "delete",
      profile: selectedProfile,
    });

    logger.set({
      type: "success",
      mode: 0,
      classname: "profiledelete",
      message: `Profile deleted!`,
    });

    selectedProfile = undefined;
  }

  function deleteProfile() {
    deleteProfileFromDirectory(selectedProfile);
    $appSettings.modal = "";
  }

  function editProfile() {
    $appSettings.modal = "profileEdit";
  }

  let sessionPresetNumbers = [];
  let numberForSessionPreset = 0;

  async function convertProfileToSessionPreset(profile) {
    // a loggert top level állítsuk, nem kell annyi visszajelzés, hogy betöltse a képernyőt. az error handling jelenleg editorban elég random.
    // a szép megoldás az lenne, hogy itt lentebb lesz egy Promise.all, ha abban valami error-t dob, akkor a logger error-t állít be, és a felhasználó is értesül róla

    logger.set({
      type: "progress",
      mode: 0,
      classname: "presetsave",
      message: `Profile to element presets conversion started...`,
    });

    // analitikiát @tofinak meg kell javítani

    /**
     * Ez egy jó promise pattern.
     * Profile szétbontását csináljuk, külön "control element presetre". Ehhez a profile configján megyünk végig, ahol megkapjuk az összes elemet.
     * Ez bemásolja a "utility button" / 255-es eventű control elementnek a configját is, arra figyelni kell hogy neki más az event típusa.
     * Csinálunk nevet a bontott element preseteknek. A neveknek egy számozásuk van, hogy ne legyenek duplikációk.
     * Figyelni kell, hogy a különböző modul típusok esetetén az elementek más más névvel rendelkeznek.
     *
     * A szétbontott element presetekre hívunk egy saveToSessionPreset függvényt, hogy mappába kerüljenek. Ezek promisok.
     * A promisokat feloldjuk, és .then() után a logger-t állítjuk, hogy sikeres volt a művelet.
     */

    let isSessionPresetNameUnique = undefined;

    function checkIfPresetTitleUnique(input) {
      let notUniqueName = [];

      sessionPreset.forEach((element) => {
        if (element.name.toLowerCase() == input.toLowerCase()) {
          notUniqueName = [...notUniqueName, element.name];
        }
      });

      if (notUniqueName.length > 0) {
        isSessionPresetNameUnique = false;
      } else {
        isSessionPresetNameUnique = true;
      }
    }

    const conversionPromises = profile.configs.map((profileElement) => {
      let user = "sessionPreset";

      let name;
      let description;
      let type;

      numberForSessionPreset++;

      //if (user == "sessionPreset") {
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

      name = `${profile.name} - Element ${profileElement.controlElementNumber}`;
      description = "";

      if (profile.type == "BU16") {
        type = "button";
      }

      if (profile.type == "PO16") {
        type = "potentiometer";
      }

      if (profile.type == "EN16") {
        type = "encoder";
      }

      if (profile.type == "EF44") {
        if ([0, 1, 2, 3].includes(profileElement.controlElementNumber)) {
          type = "encoder";
        }
        if ([4, 5, 6, 7].includes(profileElement.controlElementNumber)) {
          type = "fader";
        }
      }

      if (profile.type == "PBF4") {
        if ([0, 1, 2, 3].includes(profileElement.controlElementNumber)) {
          type = "potentiometer";
        }
        if ([4, 5, 6, 7].includes(profileElement.controlElementNumber)) {
          type = "fader";
        }
        if ([8, 9, 10, 11].includes(profileElement.controlElementNumber)) {
          type = "button";
        }
      }

      if (profileElement.controlElementNumber === 255) {
        type = "system";
      }

      checkIfPresetTitleUnique(name);

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
        configs: {
          ...profileElement,
        },
        id: uuidv4(),
      };

      if (isSessionPresetNameUnique == true) {
        return saveToSessionPreset(PRESET_PATH, preset.name, preset, user);
      }
    });

    await Promise.all(conversionPromises).then((res) => {
      logger.set({
        type: "success",
        mode: 0,
        classname: "presetsave",
        message: `Profile to element presets conversion finished!`,
      });
    });
  }

  async function saveToSessionPreset(path, name, preset, user) {
    return await window.electron.configs.saveConfig(
      path,
      name,
      preset,
      "presets",
      user
    );
  }
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />
<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50"
>
  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      $appSettings.modal = "";
    }}
    class=" z-50 w-3/6 3xl:w-2/6 h-fit min-h-[379px] max-h-[3/4] text-white relative flex flex-col
    shadow bg-primary bg-opacity-100 items-start opacity-100 p-6"
  >
    <div>
      {#if $appSettings.leftPanel == "NewPreset"}
        Profile Preset
      {/if}
    </div>
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
    {#if $appSettings.leftPanel == "NewProfile"}
      <div
        class="p-6 flex flex-row gap-4 overflow-auto w-full flex-wrap justify-between"
      >
        <div class="flex flex-col gap-4 w-full lg:w-3/6">
          <div>
            <div class="flex justify-end items-center">
              {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                <div class="text-green-400 font-semibold mb-2">Tags</div>
              {/if}

              {#if selectedProfile.folder == "user"}
                <div class="flex gap-2 flex-wrap">
                  <button
                    use:setTooltip={{
                      key: "newProfile_desc_delete",
                      placement: "top",
                      class: "w-60 p-4",
                      instant: true,
                      buttons: [
                        {
                          label: "Cancel",
                          handler: undefined,
                        },
                        { label: "Confirm", handler: deleteProfile },
                      ],
                      triggerEvents: ["show-buttons", "hover"],
                    }}
                    class="flex gap-2 items-center focus:outline-none
                  justify-center rounded my-2 border-select bg-select
                  hover:border-select-saturate-10 hover:bg-select-saturate-10
                  border-2 text-white px-2 py-0.5 mx-1 w-24 relative"
                  >
                    <svg
                      width="20"
                      height="20"
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
                    delete
                  </button>

                  <button
                    use:setTooltip={{
                      key: "newProfile_desc_edit",
                      placement: "top",
                      class: "w-60 p-4",
                    }}
                    class="flex gap-2 items-center focus:outline-none
                  justify-center rounded my-2 border-select bg-select
                  hover:border-select-saturate-10 hover:bg-select-saturate-10
                  border-2 text-white px-2 py-0.5 mx-1 w-24 relative"
                    on:click|preventDefault={() => {
                      editProfile();
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.31319 10.6697H2.23243L7.89558 5.00656L6.97635
                      4.08732L1.31319 9.75047V10.6697ZM10.7025 4.05449L7.912
                      1.29678L8.83123 0.377544C9.08293 0.125848 9.39219 0
                      9.75901 0C10.1254 0 10.4344 0.125848 10.6861
                      0.377544L11.6054 1.29678C11.8571 1.54848 11.9884 1.85226
                      11.9993 2.20814C12.0103 2.56358 11.8899 2.86714 11.6382
                      3.11884L10.7025 4.05449ZM0.656597 11.9829C0.470561 11.9829
                      0.314729 11.9199 0.1891 11.7938C0.0630334 11.6682 0
                      11.5123 0 11.3263V9.47142C0 9.38387 0.016415 9.29917
                      0.0492448 9.21731C0.0820747 9.13502 0.131319 9.06104
                      0.196979 8.99538L6.95993 2.23243L9.75047 5.02297L2.98752
                      11.7859C2.92186 11.8516 2.8481 11.9008 2.76624
                      11.9337C2.68395 11.9665 2.59903 11.9829 2.51148
                      11.9829H0.656597ZM7.43596 4.54694L6.97635 4.08732L7.89558
                      5.00656L7.43596 4.54694Z"
                        fill="#FFF"
                      />
                    </svg>
                    edit
                  </button>
                </div>
              {/if}
            </div>

            <div class="text-lg font-medium">{selectedProfile.name}</div>
          </div>
          <div>
            <!--
            this is not working somehow only in dev. will fix next release.
          <img
            class="w-full h-48 object-cover"
            src="{getImageUrl(`/imgs/sm_${selectedProfile.type}.jpg`)}"
            alt="{selectedProfile.type}_img"
          />
          -->
          </div>
          <div>
            <p>{selectedProfile.description}</p>
          </div>
        </div>
        <div class="w-full lg:w-2/6 flex flex-col justify-between gap-y-6">
          <div class="bg-secondary py-8 px-6 rounded-lg flex flex-col gap-6">
            <div>
              <div
                class="flex flex-row justify-between border-primary-700 border-b
              border-t-0 border-x-0 pb-4"
              >
                <div>
                  <div class="font-medium mb-1">@{selectedProfile.folder}</div>

                  {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                    <div class="text-zinc-300">
                      Modified at {selectedProfile.fsModifiedAt
                        .toJSON()
                        .split("T")[0]}
                      <!--  something isn't right with the date in the json here -->
                    </div>
                  {/if}
                </div>
                {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                  <div class="h-min px-2 py-1 bg-primary-700 rounded-xl">
                    <button
                      class="flex flex-row items-center justify-between"
                      on:click={() => {
                        isProfileLiked();
                      }}
                    >
                      <div class="border-r pr-2">
                        {#if !liked}
                          <svg
                            class="fill-white"
                            width="15"
                            height="12"
                            viewBox="0 0 38 35"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              shape-rendering="optimizeQuality"
                              d="M37.0596 6.96976C36.4705 5.60586 35.6212 4.3699
                          34.5591 3.33109C33.4962 2.28917 32.243 1.46117 30.8677
                          0.892121C29.4415 0.299708 27.912 -0.00352347 26.3677
                          3.08886e-05C24.2012 3.08886e-05 22.0874 0.593293
                          20.2505 1.7139C19.811 1.98196 19.3936 2.2764 18.998
                          2.5972C18.6025 2.2764 18.1851 1.98196 17.7456
                          1.7139C15.9087 0.593293 13.7949 3.08886e-05 11.6284
                          3.08886e-05C10.0684 3.08886e-05 8.55664 0.298859
                          7.12842 0.892121C5.74853 1.46341 4.50488 2.28519
                          3.43701 3.33109C2.37352 4.36873 1.52398 5.60498
                          0.936523 6.96976C0.325684 8.38919 0.0136719 9.89651
                          0.0136719 11.4478C0.0136719 12.9112 0.3125 14.4361
                          0.905762 15.9873C1.40234 17.2837 2.11426 18.6284
                          3.02393 19.9864C4.46533 22.1353 6.44727 24.3765 8.9082
                          26.6485C12.9863 30.4146 17.0249 33.0161 17.1963
                          33.1216L18.2378 33.7896C18.6992 34.084 19.2925 34.084
                          19.7539 33.7896L20.7954 33.1216C20.9668 33.0118 25.001
                          30.4146 29.0835 26.6485C31.5444 24.3765 33.5264
                          22.1353 34.9678 19.9864C35.8774 18.6284 36.5938
                          17.2837 37.0859 15.9873C37.6792 14.4361 37.978 12.9112
                          37.978 11.4478C37.9824 9.89651 37.6704 8.38919 37.0596
                          6.96976ZM18.998 30.3135C18.998 30.3135 3.35352 20.2896
                          3.35352 11.4478C3.35352 6.96976 7.0581 3.33987 11.6284
                          3.33987C14.8408 3.33987 17.627 5.13284 18.998
                          7.75198C20.3691 5.13284 23.1553 3.33987 26.3677
                          3.33987C30.938 3.33987 34.6426 6.96976 34.6426
                          11.4478C34.6426 20.2896 18.998 30.3135 18.998 30.3135Z"
                            />
                          </svg>
                        {/if}
                        {#if liked}
                          <svg
                            class="fill-red-600"
                            width="15"
                            height="12"
                            viewBox="0 0 38 35"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              shape-rendering="optimizeQuality"
                              d="M37.0459 6.96979C36.4569 5.60589 35.6075 4.36993
                          34.5454 3.33112C33.4825 2.2892 32.2293 1.4612 30.854
                          0.892151C29.4279 0.299738 27.8983 -0.00349296 26.354
                          6.14062e-05C24.1875 6.14062e-05 22.0737 0.593323
                          20.2368 1.71393C19.7974 1.98199 19.3799 2.27643
                          18.9844 2.59723C18.5889 2.27643 18.1714 1.98199
                          17.7319 1.71393C15.895 0.593323 13.7812 6.14062e-05
                          11.6147 6.14062e-05C10.0547 6.14062e-05 8.54297
                          0.29889 7.11475 0.892151C5.73486 1.46344 4.49121
                          2.28522 3.42334 3.33112C2.35985 4.36876 1.5103 5.60501
                          0.922852 6.96979C0.312012 8.38922 0 9.89655 0
                          11.4478C0 12.9112 0.298828 14.4361 0.89209
                          15.9874C1.38867 17.2838 2.10059 18.6285 3.01025
                          19.9864C4.45166 22.1353 6.43359 24.3765 8.89453
                          26.6485C12.9727 30.4146 17.0112 33.0162 17.1826
                          33.1216L18.2241 33.7896C18.6855 34.084 19.2788 34.084
                          19.7402 33.7896L20.7817 33.1216C20.9531 33.0118
                          24.9873 30.4146 29.0698 26.6485C31.5308 24.3765
                          33.5127 22.1353 34.9541 19.9864C35.8638 18.6285
                          36.5801 17.2838 37.0723 15.9874C37.6655 14.4361
                          37.9644 12.9112 37.9644 11.4478C37.9688 9.89655
                          37.6567 8.38922 37.0459 6.96979Z"
                            />
                          </svg>
                        {/if}
                      </div>

                      <div class="font-medium pl-2">200</div>
                    </button>
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center">
                <div class="text-zinc-300">Made for:</div>
                <div>{selectedProfile.type}</div>
              </div>
              {#if $appSettings.persistant.profileCloudDevFeaturesEnabled === true}
                <div class="flex justify-between items-center">
                  <div class="text-zinc-300">Compatible with:</div>
                  <div class="flex items-center gap-1">
                    <div>Ableton</div>
                  </div>
                </div>
              {/if}
              <div class="flex justify-between items-center">
                <div class="text-zinc-300">Made with:</div>
                <div>
                  Grid Editor v{selectedProfile.version.major}.{selectedProfile
                    .version.minor}.{selectedProfile.version.patch}
                </div>
              </div>
            </div>
          </div>
          <div
            class="bg-secondary py-8 px-6 rounded-lg border-cyan-600 border-2 flex flex-col gap-6"
          >
            <div
              class="flex flex-col justify-between
                pb-4 gap-6"
            >
              <div>
                <div class=" text-lg mb-4">
                  Split to control element presets
                </div>
                <div class="text-gray-300">
                  Convert profile to element presets.
                </div>
              </div>

              <div>
                <button
                  use:setTooltip={{
                    key: "newProfile_desc_split_presets",
                    placement: "top",
                    class: "w-60 p-4",
                    instant: true,
                    buttons: [
                      {
                        label: "Cancel",
                        handler: undefined,
                      },
                      {
                        label: "Confirm",
                        handler: () =>
                          convertProfileToSessionPreset(selectedProfile),
                      },
                    ],
                  }}
                  class="bg-green-500 py-2 px-10 rounded cursor-pointer relative"
                >
                  <div>Split</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</modal>
