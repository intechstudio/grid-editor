<script lang="ts">
  import {
    UserInputValue,
    runtime,
    user_input,
  } from "./../../../runtime/runtime.store";
  import ActionList from "./ActionList.svelte";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import {
    blur,
    crossfade,
    draw,
    fade,
    fly,
    scale,
    slide,
  } from "svelte/transition";
  import EventPanel from "./EventPanel.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import { GridElement, GridEvent } from "../../../runtime/runtime";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { onDestroy } from "svelte";
  import { runtime_manager } from "../../../runtime/runtime.manager.store";

  let element: GridElement;
  let event: GridEvent;

  $: if ($runtime_manager.active) {
    handleUserInputChange($user_input);
  }

  function handleUserInputChange(ui: UserInputValue) {
    element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    event = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    if (typeof element !== "undefined" && !element.isLoaded()) {
      element.load().catch((err) => {
        console.error("Failed to load event:", err);
      });
    }
  }

  let containerWidth: number;

  $: {
    if (containerWidth) {
      appSettings.update((store) => {
        store.isMultiView =
          document.body.clientWidth * 0.4 < containerWidth &&
          containerWidth > 550 &&
          typeof element !== "undefined";
        return store;
      });
    }
  }

  onDestroy(() => {
    appSettings.update((store) => {
      store.isMultiView = false;
      return store;
    });
  });
</script>

<container class="flex w-full h-full bg-primary">
  <div
    bind:clientWidth={containerWidth}
    class="w-full h-full flex flex-col bg-primary"
    transition:fade={{
      duration: 150,
      delay: 0,
    }}
  >
    <configs
      class="w-full h-full flex flex-col gap-2 px-8 py-4 overflow-hidden"
    >
      <ElementSelectionPanel />
      {#if !$appSettings.isMultiView}
        <EventPanel />
      {/if}
      <Toolbar />
      <div class="flex flex-row h-full w-full max-h-full gap-2 overflow-hidden">
        {#if $appSettings.isMultiView}
          {#each $element?.events ?? [] as event, i}
            <ActionList {event} />
            <div
              class="h-full flex border-r border-black"
              class:hidden={i === $element.events.length - 1}
            />
          {/each}
        {:else}
          <ActionList {event} />
        {/if}
      </div>
    </configs>
  </div>
</container>
