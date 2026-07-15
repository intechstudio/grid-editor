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
  import { toggledBlocks } from "../Configuration";
  import { draggable, draggedActions } from "../../../_actions/move.action";
  import { getComponentInformation } from "../../../../lib/_configs";
  import {
    updateAction,
    replaceAction,
    syncWithGrid,
    removeActions,
  } from "./../../../../runtime/operations";
  import { ConfigTour, configTour } from "../../profileCloud/ConfigTour";
  import { contextTarget, SvgIcon } from "@intechstudio/grid-uikit";
  import Indentation from "./Indentation.svelte";
  import EditableName from "../../../../config-blocks/components/EditableName.svelte";
  import { selected_actions } from "../../../../runtime/selected-actions.store";
  import { logger } from "../../../../runtime/runtime.store";
  import { Runtime } from "../../../../runtime/string-table";
  import { get } from "svelte/store";
  import { information } from "../../../../config-blocks/CodeBlock.svelte";
  import { Modal } from "../../../modals/modal.store";
  import RenameActionBlock from "../../../modals/RenameActionBlock.svelte";

  const dispatch = createEventDispatcher();

  export let index = undefined;
  export let action: GridAction;
  export let selected = false;

  let header: typeof SvelteComponent;
  let component: typeof SvelteComponent;
  let ctrlIsDown = false;
  let toggled = false;
  let isEdit = false;
  let event = action.parent as GridEvent;
  let componentProps: Record<string, any> = {};

  onMount(() => {
    action.toggled = action.information.toggleable
      ? toggledBlocks.includes(action.short)
      : true;

    const result = getComponentInformation(action.short);
    header = result.header;
    component = result.component;

    // TODO: Refactor this out. Reason: action block UI property config was renamed to action
    // See Grid Editor internal action blocks implementations
    const [major, minor] = result.information.version?.split(".") ?? [
      undefined,
      undefined,
    ];
    componentProps = major && +major >= 2 ? { action } : { config: action };
  });

  onDestroy(() => {
    //Destroyed by removal: nothing to do
    if (typeof action.parent === "undefined") {
      return;
    }

    //Destroyed by getting out of scope: Revert to synced state
    revertToSynced();
    action.toggled = false;
  });

  $: if (!$action.toggled) {
    revertToSynced();
  }

  $: {
    const isActiveTourStep =
      $configTour.current?.action.id === $action.id && $configTour.active;
    if (!toggled && isActiveTourStep) {
      toggled = true;
    }
  }

  function handleEditClicked() {
    isEdit = !isEdit;
  }

  function handleNameChange(e: any) {
    const { value } = e.detail;
    const data = new ActionData(action.short, action.script, value);
    updateAction(action, data, true);
  }

  function revertToSynced() {
    if (action.script === action.synced) {
      return;
    }

    logger.set({
      type: "alert",
      mode: 0,
      classname: "luanotok",
      message: `Blocks containing syntax error reverted to last synced state.`,
    });

    updateAction(
      action,
      new ActionData(action.short, action.synced, action.name),
      true,
    );
  }

  function handleReplace(e: any) {
    const { short, script, name } = e.detail;
    const oldAction = action;
    const parent = oldAction.parent as GridEvent;
    const newAction = new GridAction(
      undefined,
      new ActionData(short, GridAction.getInformation(short).defaultLua),
    );
    replaceAction(parent, oldAction, newAction);
    action.toggled = true;
    toggledBlocks.add(newAction.short);
  }

  function handleUpdateAction(e) {
    const { short, script, validationError } = e.detail;
    const data = new ActionData(short, script, action.name);
    //TODO: Propose better solution
    data.invalid = validationError;
    updateAction(action, data, false, (msg) => {
      if (msg === Runtime.ErrorText.LENGTH_ERROR) {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "luanotok",
          message: msg,
        });
      }
    });
  }

  function handleSendActionToGrid() {
    if (!action.isValid()) {
      return;
    }

    syncWithGrid(action);
  }

  function handleToggle() {
    if (action.information.toggleable == false) {
      return;
    }
    action.toggled = !action.toggled;
    if (action.toggled) {
      toggledBlocks.add(action.short);
    } else {
      toggledBlocks.remove(action.short);
    }
  }

  function handleCarouselClicked(e: KeyboardEvent) {
    if (e.ctrlKey) {
      selected = !selected;
      dispatch("select", { value: selected });
    } else {
      handleToggle();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const { key } = e;

    if (key === "Control") {
      ctrlIsDown = true;
    }

    if (key === "F2" && get(selected_actions).includes(action)) {
      isEdit = true;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === "Control") {
      ctrlIsDown = false;
    }
  }

  function handleDelete() {
    removeActions(action.parent as GridEvent, action);
  }

  function handleResetToDefault() {
    const data = new ActionData(action.short, action.information.defaultLua);
    updateAction(action, data, true);
  }

  function handleRename() {
    const availableCharacters = event.getAvailableChars();
    new Modal.Window(RenameActionBlock).show({ availableCharacters, action });
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<wrapper
  bind:this={$action.element}
  role="tabpanel"
  tabindex="0"
  on:keydown={(e) => {
    //Ignore if origin node is input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof Element && e.target.hasAttribute("contenteditable"))
    ) {
      e.stopPropagation();
      return;
    }
    if (
      e.key === " " &&
      e.target.tagName !== "INPUT" &&
      e.target.tagName !== "TEXTAREA" &&
      !(e.target instanceof Element && e.target.closest(".monaco-editor"))
    ) {
      e.preventDefault();
      const carousel = e.currentTarget.querySelector("carousel");
      if (carousel) {
        carousel.click();
      }
    }
  }}
  class="dynamicWrapper activator-button flex flex-grow min-w-0 outline-none"
  style="background-color: var(--background); color: var(--foreground); "
  class:cursor-pointer={ctrlIsDown}
>
  <Indentation level={$action?.indentation ?? 0} />
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    id="cfg-{index}"
    class="flex flex-grow min-w-0 overflow-x-auto h-auto min-h-[32px] {!$action.isValid()
      ? 'border border-error'
      : 'border border-background-soft'} cursor-pointer"
    class:rounded-tr-xl={$action.information.rounding === "top"}
    class:rounded-br-xl={$action.information.rounding === "bottom"}
    class:opacity-20={$draggedActions.includes(action)}
    use:draggable={(this,
    { action: action, movable: $action.information.movable })}
    use:contextTarget={{
      items: [
        {
          text: [`Delete`],
          handler: () => handleDelete(),
          isDisabled: () =>
            ["single"].includes(action.information.type) === false,
        },
        {
          text: [`Rename`],
          handler: () => handleRename(),
          isDisabled: () => !action.information.editName,
        },
        {
          text: [`Reset to Default`],
          handler: () => handleResetToDefault(),
          isDisabled: () => false,
        },
      ],
    }}
    on:click|self={handleCarouselClicked}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <!-- TODO: Make marking when the block has unsaved changes  -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Icon -->
      {#if $action.information.hideIcon !== true}
        <div class="flex flex-row justify-center items-center">
          <div
            style="background-color:{$action.information.color}"
            class="flex items-center p-1 w-min text-center h-full"
          ></div>
          <div
            class=" pl-1 w-8 h-8 whitespace-nowrap flex items-center justify-center [&_svg]:fill-foreground [&_svg_path]:fill-foreground"
          >
            {@html $action.information.blockIcon}
          </div>
        </div>
      {/if}

      <!-- Body of the config block -->
      <div
        class="w-full flex flex-grow min-w-0 items-center"
        class:cursor-auto={$action.toggled}
        class:bg-opacity-30={$action.toggled}
      >
        <!-- Content of block -->
        {#if ($action.toggled && $action.information.toggleable) || typeof header === "undefined"}
          <!-- Body of the Action block when toggled -->
          <div class="h-full w-full bg-background-mute pointer-events-auto">
            <svelte:component
              this={component}
              {...componentProps}
              on:replace={handleReplace}
              on:update-action={handleUpdateAction}
              on:sync={handleSendActionToGrid}
              on:toggle={handleToggle}
            />
          </div>
        {:else}
          <!-- Header of the Action block when untoggled -->
          <div class="min-h-10 w-full flex">
            <svelte:component
              this={header}
              {...componentProps}
              on:toggle={handleToggle}
              on:update-action={handleUpdateAction}
              on:sync={handleSendActionToGrid}
            >
              <div slot="name" class="flex h-full items-center">
                <EditableName
                  bind:isEdit
                  value={$action.name}
                  availableCharacters={$event.getAvailableChars()}
                  defaultValue={action.information.displayName}
                  on:name-change={handleNameChange}
                />
              </div>

              <button
                slot="edit-name-trigger"
                on:click|stopPropagation={handleEditClicked}
                class="cursor-pointer hover:bg-black/25 flex w-fit h-fit p-1.5 rounded pointer-events-auto"
              >
                <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
              </button>
            </svelte:component>
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
