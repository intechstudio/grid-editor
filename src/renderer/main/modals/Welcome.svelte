<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "../_actions/click-outside.action";

  import { attachment } from "../user-interface/Monster.store";

  import { get } from "svelte/store";

  const { env } = window.ctxProcess;

  import configuration from "../../../../configuration.json";

  console.log("config", configuration.DOCUMENTATION_REFERENCEMANUAL_URL);

  let video_link = "";

  let modalElement;
  let attachmentElement;

  let video_id;

  onMount(async () => {
    video_link = env()["YOUTUBE_RELEASENOTES_FALLBACK_URL"];

    const { videoLink, videoId } = await window.electron.getLatestVideo();

    if (videoLink && videoId) {
      video_link = videoLink;
      video_id = videoId;
    }

    $attachment = { element: attachmentElement, hpos: "100%", vpos: "50%" };
  });

  onDestroy(() => {
    if ($attachment !== undefined) {
      if ($attachment.element === attachmentElement) {
        $attachment = undefined;
      }
    }
  });

  let version = `${get(appSettings).version.major}.${
    get(appSettings).version.minor
  }.${get(appSettings).version.patch}`;
</script>

<div id="modal-copy-placeholder" />

<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50"
>
  <div
    bind:this={modalElement}
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      $appSettings.modal = "";
    }}
    id="clickbox"
    class="items-center z-50 w-3/5 text-white relative flex flex-col shadow
    bg-primary bg-opacity-100 opacity-100 max-w-4xl"
  >
    <div class="p-6 flex-col w-full flex justify-between items-center">
      <div class="flex w-full text-4xl opacity-90">Grid Editor {version}</div>
      <div class="flex w-full text-2xl opacity-70">Intech Studio</div>

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
    </div>

    <div
      bind:this={attachmentElement}
      class="flex flex-row bg-primary w-full"
      style=""
    >
      <div class="px-2 flex flex-row w-full bg-black bg-opacity-20">
        <div class="p-4 flex-col w-7/12 flex justify-between">
          <div class="flex w-full text-xl opacity-70">Latest Release Video</div>

          <iframe
            crossorigin="anonymous"
            title="release video"
            class="py-1 w-full h-full block"
            src="https://youtube.com/embed/{video_id}"
          />
        </div>

        <div class="p-4 flex-col w-5/12 flex justify-between">
          <div class="flex w-full text-xl opacity-70">Getting started</div>
          <button
            on:click={(e) => window.electron.openInBrowser(video_link)}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Release notes video...
          </button>
          <button
            on:click={(e) => {
              window.electron.openInBrowser(
                configuration.DOCUMENTATION_REFERENCEMANUAL_URL
              );
            }}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Editor reference manual...
          </button>
          <button
            on:click={(e) =>
              window.electron.openInBrowser(
                configuration.DOCUMENTATION_DISCORDSERVER_URL
              )}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Join the Discord community...
          </button>

          <br />

          <div class="flex w-full text-xl opacity-70">Troubleshooting</div>
          <button
            on:click={(e) =>
              window.electron.openInBrowser(
                configuration.DOCUMENTATION_TROUBLESHOOTING_URL
              )}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Grid does not connect...
          </button>
          <button
            on:click={(e) =>
              window.electron.openInBrowser(
                configuration.DOCUMENTATION_FIRMWAREUPDATE_URL
              )}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Updating the firmware...
          </button>
          <button
            on:click={(e) =>
              window.electron.openInBrowser(
                configuration.DOCUMENTATION_MAINTENANCE_URL
              )}
            class="flex w-full text-blue-500 cursor-pointer"
          >
            Taking care of grid modules...
          </button>

          <br />

          <div class="flex w-full text-xl opacity-70">Suggest Features</div>

          <div class="flex w-full">
            <button
              on:click={(e) =>
                window.electron.openInBrowser(configuration.PUBLIC_ROADMAP_URL)}
              class="rounded py-2 px-4 my-2 bg-secondary text-white
              cursor-pointer"
            >
              Public Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex flex-row w-full bottom-0 bg-black bg-opacity-10
      justify-between items-center"
    >
      <div class="flex flex-col h-full p-6">
        <div class="flex w-full opacity-70">
          Grid Editor is Open-Source Software
        </div>
        <button
          on:click={(e) =>
            window.electron.openInBrowser(configuration.EDITOR_REPOSITORY_URL)}
          class="flex w-full opacity-40 hover:opacity-100 transition-opacity
          cursor-pointer"
        >
          <svg
            class="mr-2 w-5 h-5"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66
              6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09
              3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5
              1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15
              5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33
              2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38
              4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86
              8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31
              12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7
              13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01
              12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15
              15.67 10.55 15.59C12.1382 15.054 13.5183 14.0333 14.496
              12.6718C15.4737 11.3102 15.9997 9.67624 16 8C16 3.58 12.42 0 8 0Z"
              fill="white"
            />
          </svg>
          <div>Developed by Intech Studio</div>
        </button>
      </div>

      <div class="flex flex-row items-center h-full p-6">
        <input
          class="mr-1 opacity-70"
          type="checkbox"
          bind:checked={$appSettings.persistant.welcomeOnStartup}
        />
        <div class="mx-1 mr-4 opacity-70">Always show on startup</div>

        <button
          on:click={() => {
            $appSettings.modal = "";
          }}
          id="close-btn"
          class="px-3 py-1 cursor-pointer rounded not-draggable
          hover:bg-blue-700 bg-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</modal>
