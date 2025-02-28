<script lang="ts">
  import {
    GridAction,
    ActionData,
    GridEvent,
  } from "./../../../../runtime/runtime";
  import {
    createEventDispatcher,
    onDestroy,
    onMount,
    type SvelteComponent,
  } from "svelte";
  import {
    lastOpenedActionblocks,
    lastOpenedActionblocksInsert,
    lastOpenedActionblocksRemove,
  } from "../Configuration";
  import { draggable } from "../../../_actions/move.action";
  import { getComponentInformation } from "../../../../lib/_configs";
  import {
    updateAction,
    replaceAction,
    syncWithGrid,
  } from "./../../../../runtime/operations";

  const dispatch = createEventDispatcher();

  export let index = undefined;
  export let action: GridAction;
  export let selected = false;

  let header: typeof SvelteComponent;
  let component: typeof SvelteComponent;
  let ctrlIsDown = false;
  let toggled = false;

  onMount(() => {
    if (action.information.toggleable !== false) {
      toggled =
        -1 !==
        $lastOpenedActionblocks.findIndex((e) => {
          return e == action.short;
        });
    } else {
      toggled = true;
    }

    const result = getComponentInformation(action.short);
    header = result.header;
    component = result.component;
  });

  onDestroy(() => {
    updateAction(
      action,
      new ActionData(action.short, action.synced, action.name),
      false
    );
  });

  function handleReplace(e: any) {
    const { short, script, name } = e.detail;
    const oldAction = action;
    const parent = oldAction.parent as GridEvent;
    const newAction = new GridAction(
      undefined,
      new ActionData(short, GridAction.getInformation(short).defaultLua)
    );
    console.log({ short, script, name, oldAction, newAction, parent });
    replaceAction(parent, oldAction, newAction);
    toggled = true;
    lastOpenedActionblocksInsert(newAction.short);
  }

  function handleUpdateAction(e) {
    const { short, script, name, validationError } = e.detail;
    const data = new ActionData(short, script, name);
    //TODO: Propose better solution
    data.invalid = validationError;
    updateAction(action, data, false);
  }

  function handleSendActionToGrid() {
    if (!action.invalid) {
      syncWithGrid(action);
    }
  }

  function handleToggle(e) {
    if (action.information.toggleable == false) {
      return;
    }

    toggled = !toggled;

    if (toggled) {
      lastOpenedActionblocksInsert(action.short);
    } else {
      lastOpenedActionblocksRemove(action.short);
    }
  }

  function handleCarouselClicked(e) {
    if (e.ctrlKey) {
      selected = !selected;
      dispatch("select", { value: selected });
    } else {
      handleToggle(e);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Control") {
      ctrlIsDown = true;
    }
  }

  function handleKeyUp(e) {
    if (e.key === "Control") {
      ctrlIsDown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<wrapper class="flex flex-grow outline-none" class:cursor-pointer={ctrlIsDown}>
  {#each Array($action?.indentation ?? 0) as _}
    <div style="width: 15px" class="flex items-center mx-1">
      <div class="w-3 h-3 rounded-full bg-secondary" />
    </div>
  {/each}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    id="cfg-{index}"
    class="group/bg-color flex flex-grow h-auto min-h-[32px] border {$action.invalid
      ? 'border-error'
      : 'border-transparent'} cursor-pointer"
    class:rounded-tr-xl={$action.information.rounding === "top"}
    class:rounded-br-xl={$action.information.rounding === "bottom"}
    use:draggable={(this,
    { action: action, movable: $action.information.movable })}
    on:click|self={handleCarouselClicked}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <!-- TODO: Make marking when the block has unsaved changes  -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Icon -->
      {#if $action.information.hideIcon !== true}
        <div
          style="background-color:{$action.information.color}"
          class="flex items-center p-2 w-min text-center"
        >
          <div class="w-6 h-6 whitespace-nowrap">
            {@html $action.information.blockIcon}
          </div>
        </div>
      {/if}

      <!-- Body of the config block -->
      <div
        class="w-full flex flex-grow items-center"
        class:cursor-auto={toggled}
        class:bg-opacity-30={toggled}
      >
        <!-- Content of block -->
        {#if (toggled && $action.information.toggleable) || typeof header === "undefined"}
          <!-- Body of the Action block when toggled -->
          <div class="bg-secondary h-full w-full">
            <div class="bg-black/15 h-full w-full">
              <svelte:component
                this={component}
                config={action}
                on:replace={handleReplace}
                on:update-action={handleUpdateAction}
                on:sync={handleSendActionToGrid}
                on:toggle={handleToggle}
              />
            </div>
          </div>
        {:else}
          <!-- Header of the Action block when untoggled -->
          <div class="h-10 w-full">
            <svelte:component
              this={header}
              config={action}
              on:toggle={handleToggle}
              on:update-action={handleUpdateAction}
              on:sync={handleSendActionToGrid}
            />
          </div>
        {/if}
      </div>
    </div>
  </carousel>
</wrapper>

<style global>
  carousel:last-child {
    margin-bottom: 0;
  }
</style>
