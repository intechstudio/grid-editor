<script lang="ts">
  import MoltenModal from "./MoltenModal.svelte";
  import { Modal } from "./modal.store";
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import {
    MeltCheckbox,
    MoltenPushButton,
    Toggle,
  } from "@intechstudio/grid-uikit";
  import welcomeImage from "../../assets/imgs/welcome.jpg";

  export let data: Modal.Instance;

  const configuration = window.ctxProcess.configuration();

  const video_link =
    "https://www.youtube.com/watch?v=lc8iNTaFwT0&list=PLtMbdpAm17zdDZ9jkStSFvdWJdVi3skVu";
  let analyticsEnabled = false;
  let initialized = false;

  onMount(() => {
    const firstLaunch = $appSettings.persistent.firstLaunch;
    analyticsEnabled = firstLaunch || $appSettings.persistent.analyticsEnabled;

    initialized = true;
  });

  $: if (
    initialized &&
    $appSettings.persistent.analyticsEnabled !== analyticsEnabled
  ) {
    $appSettings.persistent.analyticsEnabled = analyticsEnabled;
  }

  onDestroy(() => {
    $appSettings.persistent.firstLaunch = false;
    $appSettings.persistent.analyticsEnabled = analyticsEnabled;
  });

  function openExternal(url: string) {
    window.electron.openInBrowser(url);
  }

  let version = `${configuration.EDITOR_VERSION}`;
</script>

<div id="modal-copy-placeholder"></div>

<MoltenModal {data} width={"800px"}>
  <div
    slot="content"
    class="flex max-h-[82vh] flex-col gap-5 overflow-y-auto p-6"
  >
    <header class="flex w-full items-start justify-between gap-6">
      <div class="flex flex-col gap-1">
        <div class="text-3xl text-foreground">
          Welcome to Grid Editor {version}
          {#if import.meta.env.VITE_BUILD_ENV == "nightly"}
            {import.meta.env.VITE_BRANCH_NAME}
          {/if}
          {#if import.meta.env.VITE_BUILD_ENV === "development"}
            {import.meta.env.VITE_BUILD_ENV}
          {/if}
        </div>
        <div class="text-base text-foreground-muted">Intech Studio</div>
      </div>

      <button
        aria-label="Close welcome screen"
        title="Close"
        on:click={() => data.close()}
        class="not-draggable flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border hover:bg-background-muted"
        style="border-color: var(--border); border-radius: var(--radius);"
        data-testid="welcome-close-button"
      >
        <svg
          class="h-4 w-4 fill-current text-foreground-muted"
          viewBox="0 0 29 29"
          aria-hidden="true"
        >
          <path
            d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
          />
          <path
            d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
          />
        </svg>
      </button>
    </header>

    <div
      class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.38fr)]"
    >
      <section
        class="flex flex-col gap-4 border p-4"
        style="border-color: var(--border); background-color: var(--background-muted); border-radius: var(--radius);"
      >
        <div class="flex flex-col gap-2">
          <h2 class="m-0 text-lg text-foreground">Start creating</h2>
          <p class="m-0 text-sm text-foreground-muted">
            The Grid Editor is your workspace for programming Intech Studio
            Grid.
          </p>
          <p class="m-0 text-sm text-foreground-muted">
            Design profiles, map every control to the actions you need, and tune
            your setup with live feedback.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <MoltenPushButton
            text="Join the Discord community"
            style="accept"
            click={() =>
              openExternal(configuration.DOCUMENTATION_DISCORDSERVER_URL)}
          />
          <MoltenPushButton
            text="Open the editor reference manual"
            style="outlined"
            click={() =>
              openExternal(configuration.DOCUMENTATION_REFERENCEMANUAL_URL)}
          />
        </div>

        <!-- <div class="border-t pt-4" style="border-color: var(--border);">
          <div class="mb-3 text-sm text-foreground-muted">Explore more</div>
          <div class="grid grid-cols-1 gap-2">
            <MoltenPushButton
              text="Public roadmap"
              style="normal"
              click={() => openExternal(configuration.PUBLIC_ROADMAP_URL)}
            />
            <MoltenPushButton
              text="Release notes"
              style="normal"
              click={() => openExternal(video_link)}
            />
          </div>
        </div> -->

        <div class="border-t pt-4" style="border-color: var(--border);">
          <div class="mb-2 text-sm text-foreground-muted">Editing mode</div>
          <Toggle
            testid="minimalist_toggle_welcome"
            title="Minimalist mode"
            on:change={() => {
              if ($appSettings.persistent.userLevelMinimalist === true) {
                $appSettings.persistent.userLevelMinimalist = false;
              } else {
                $appSettings.persistent.userLevelMinimalist = true;
              }
            }}
            value={$appSettings.persistent.userLevelMinimalist === true}
          />
          <p class="m-0 mt-2 text-xs leading-relaxed text-foreground-muted">
            {#if $appSettings.persistent.userLevelMinimalist}
              Minimalist mode keeps the editor focused on essentials for faster
              profile building.
            {:else}
              Deep editing mode unlocks advanced controls, detailed options, and
              Lua scripting tools.
            {/if}
          </p>
        </div>
      </section>

      <section class="flex min-w-0 flex-col gap-3">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="m-0 text-xl text-foreground">Latest release</h2>
        </div>

        <div
          class="group relative aspect-video w-full overflow-hidden border shadow-sm"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <img
            src={welcomeImage}
            alt="Grid Editor latest release"
            class="h-full w-full object-cover"
          />
          <button
            type="button"
            on:click={() => openExternal(video_link)}
            class="not-draggable absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/30"
          >
            <span
              class="flex items-center gap-2 border bg-background px-4 py-2 text-sm text-foreground shadow-sm transition-transform group-hover:scale-105"
              style="border-color: var(--border); border-radius: var(--radius);"
            >
              ▶ Watch tutorial
            </span>
          </button>
        </div>
      </section>
    </div>

    <section
      class="grid grid-cols-1 gap-5 border p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      style="border-color: var(--border); border-radius: var(--radius);"
    >
      <div class="flex flex-col gap-3">
        <div>
          <h2 class="m-0 text-lg text-foreground">Need a hand?</h2>
          <p class="m-0 mt-1 text-sm text-foreground-muted">
            Find connection help and care guidance for your Grid hardware.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <MoltenPushButton
            text="Connection troubleshooting"
            style="outlined"
            click={() =>
              openExternal(configuration.DOCUMENTATION_TROUBLESHOOTING_URL)}
          />
          <MoltenPushButton
            text="Module care"
            style="outlined"
            click={() =>
              openExternal(configuration.DOCUMENTATION_MAINTENANCE_URL)}
          />
        </div>
      </div>

      <div
        class="flex flex-col justify-between gap-3 border-l pl-0 md:pl-5"
        style="border-color: var(--border);"
      >
        <div class="flex flex-col gap-2">
          <MeltCheckbox
            bind:target={analyticsEnabled}
            title="Help improve Grid Editor with analytics"
            style="transparent"
          />
          <MeltCheckbox
            bind:target={$appSettings.persistent.welcomeOnStartup}
            title="Show this welcome screen on startup"
            style="transparent"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <MoltenPushButton
            text="Analytics policy"
            style="secondary"
            click={() =>
              openExternal(configuration.DOCUMENTATION_ANALYTICS_POLICY_URL)}
          />
        </div>
      </div>
    </section>

    <footer
      class="flex flex-wrap items-center justify-between gap-3 text-foreground-muted"
    >
      <div class="text-sm">
        <MoltenPushButton
          text="Grid Editor is open-source software, developed by Intech Studio"
          style="none"
          click={() => openExternal(configuration.EDITOR_REPOSITORY_URL)}
        />
      </div>
      <MoltenPushButton
        text="Continue"
        style="accept"
        snap="wide"
        click={() => data.close()}
      />
    </footer>
  </div>
</MoltenModal>
