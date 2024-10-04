<script lang="ts">
  import { config_panel_blocks } from "./../Configuration";
  import Options from "./Options.svelte";
  import { ActionBlock } from "./../Configuration";
  import {
    GridAction,
    ActionData,
    GridEvent,
    GridElement,
  } from "./../../../../runtime/runtime";
  import { createEventDispatcher, onMount, type SvelteComponent } from "svelte";
  import {
    lastOpenedActionblocks,
    lastOpenedActionblocksInsert,
    lastOpenedActionblocksRemove,
  } from "../Configuration";
  import { configIndexToId } from "../../../_actions/move.action";
  import { getComponentInformation } from "../../../../lib/_configs";
  import {
    updateAction,
    replaceAction,
  } from "./../../../../runtime/operations";

  const dispatch = createEventDispatcher();

  export let index = undefined;
  export let data: ActionBlock;

  let action: GridAction = data.action;
  let header: typeof SvelteComponent;
  let component: typeof SvelteComponent;
  let validationError = false;
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

    const result = getComponentInformation({ short: action.short });
    header = result.header;
    component = result.component;
  });

  function handleReplace(e: any) {
    const { short, script, name } = e.detail;
    const oldAction = action;
    const parent = oldAction.parent as GridEvent;
    const newAction = new GridAction(
      undefined,
      new ActionData(short, GridAction.getInformation(short).defaultLua)
    );
    replaceAction(parent, oldAction, newAction);
    toggled = true;
    lastOpenedActionblocksInsert(newAction.short);
  }

  function handleOutput(e) {
    const { short, script, name } = e.detail;
    updateAction(data.action, new ActionData(short, script, name));
  }

  function handleValidator(e) {
    const data = e.detail;
    validationError = data.isError;
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
      dispatch("select");
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

  function handleSelectionChange() {
    config_panel_blocks.update((s) => {
      const stack: ActionBlock[] = [];
      let n = s.findIndex((e) => e.action.id === data.action.id);
      const value = data.selected;
      do {
        const current = s[n];
        if (current.action.information.type === "composite_open") {
          stack.push(current);
        } else if (current.action.information.type === "composite_close") {
          stack.pop();
        }
        current.selected = value;
        ++n;
      } while (stack.length > 0);
      return s;
    });
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<wrapper class="flex flex-grow outline-none" class:cursor-pointer={ctrlIsDown}>
  {#each Array(action.indentation) as _}
    <div style="width: 15px" class="flex items-center mx-1">
      <div class="w-3 h-3 rounded-full bg-secondary" />
    </div>
  {/each}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    class="group/bg-color flex flex-grow h-auto min-h-[32px] border {!action.checkSyntax()
      ? 'border-error'
      : 'border-transparent'} bri"
    id={configIndexToId(index)}
    class:rounded-tr-xl={action.information.rounding === "top"}
    class:rounded-br-xl={action.information.rounding === "bottom"}
    config-name={action.information.name}
    config-type={action.information.type}
    config-id={index}
    movable={action.information.movable}
    class:brightness-125={data.selected}
    on:click|self={handleCarouselClicked}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <!-- TODO: Make marking when the block has unsaved changes  -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Icon -->
      {#if action.information.hideIcon !== true}
        <div
          style="background-color:{action.information.color}"
          class="flex items-center p-2 w-min text-center"
        >
          <div class="w-6 h-6 whitespace-nowrap">
            {@html action.information.blockIcon}
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
        {#if (toggled && action.information.toggleable) || typeof header === "undefined"}
          <!-- Body of the Action block when toggled -->
          <div class="bg-secondary bg-opacity-30 h-full w-full">
            <svelte:component
              this={component}
              class="h-full w-full px-2"
              {index}
              config={action}
              syntaxError={!action.checkSyntax()}
              on:replace={handleReplace}
              on:validator={handleValidator}
              on:output={handleOutput}
              on:toggle={handleToggle}
            />
          </div>
        {:else}
          <!-- Header of the Action block when untoggled -->

          <svelte:component
            this={header}
            config={action}
            {index}
            on:toggle={handleToggle}
            on:output={handleOutput}
          />
        {/if}
      </div>
    </div>
  </carousel>

  <div class="z-20 flex items-center mx-2">
    <Options
      bind:selected={data.selected}
      disabled={!data.action.information.selectable}
      on:select={handleSelectionChange}
    />
  </div>
</wrapper>

<style global>
  carousel:last-child {
    margin-bottom: 0;
  }
</style>
