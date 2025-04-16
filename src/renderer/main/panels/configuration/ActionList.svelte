<script lang="ts">
  import BottomPanel from "./BottomPanel.svelte";
  import SeparatorLine from "./components/SeparatorLine.svelte";
  import ActionHelper from "./components/ActionHelper.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import { GridEvent } from "./../../../runtime/runtime";
  import { fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import * as eases from "svelte/easing";
  import { addActions, pasteActions } from "../../../runtime/operations";
  import { GridAction } from "./../../../runtime/runtime";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { draggedActions } from "./../../_actions/move.action";
  import Option from "./components/Options.svelte";
  import {
    selected_actions,
    user_input,
  } from "../../../runtime/user-input.store";
  import { get } from "svelte/store";
  import Options from "./components/Options.svelte";
  import { Grid } from "../../../lib/_utils";
  import { latestComponentVersionKeys } from "../../../lib/_configs";
  import { profileCloudConfigDrag } from "../profileCloud/ProfileCloud";
  import { autoScroll } from "../../_actions/autoscroll.action";
  import { Focus } from "../../_actions/focus.action";

  export let event: GridEvent;
  export let targetPanel: HTMLElement;
  export let focusTrigger: string;

  let configList: HTMLElement;

  function handleNewConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(event, index, ...configs);
  }

  function handlePaste(index: number | undefined) {
    pasteActions(event, index);
  }

  function handleSelectionChange(action: GridAction, value: boolean) {
    const parent = action.parent as GridEvent;
    const stack: GridAction[] = [];

    selected_actions.update((s) => {
      if (s.every((e) => e.parent === action.parent)) {
        let n = parent.config.findIndex((e) => e.id === action.id);
        do {
          const current = parent.config[n];
          if (current.information.type === "composite_open") {
            stack.push(current);
          } else if (current.information.type === "composite_close") {
            stack.pop();
          }

          if (value) {
            s.push(current);
          } else {
            s = s.filter((item) => item !== current);
          }
          ++n;
        } while (stack.length > 0);
        return s;
      } else {
        return [action];
      }
    });
  }

  function handleSelectAll() {
    const selected = get(selected_actions);
    if (event.config.every((e) => selected.includes(e))) {
      selected_actions.set([]);
    } else {
      selected_actions.set(event.config);
    }
  }
</script>

{#key $event?.id}
  <div
    id="test"
    role="tabpanel"
    tabindex="0"
    use:Focus.on={focusTrigger}
    on:keydown={(e) => {
      //Ignore if origin node is input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof Element &&
          e.target.hasAttribute("contenteditable"))
      ) {
        return;
      }

      if (e.key === "Escape") {
        const { dx, dy, elementnumber } = get(user_input);
        Focus.trigger(`element-${dx}-${dy}-${elementnumber}`);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        console.log("Ctrl + A = Select all actions");
        handleSelectAll();
        e.preventDefault();
        e.stopPropagation();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        console.log("Ctrl + V = Paste actions");
        handlePaste();
        e.preventDefault();
        e.stopPropagation();
      }
    }}
    class="p-4 flex flex-col h-full w-full overflow-hidden gap-2 actionlist activator-button"
  >
    <div
      class="flex flex-row gap-2 justify-between items-center flex-none w-full"
    >
      <div class="flex flex-col">
        <span class="text-white">{$event?.getName() ?? "No Device"}</span>
        <div class="flex flex-row gap-2">
          <span class="text-gray-500 text-sm">Script length:</span>
          <span data-testid="charCount" class="text-white text-sm">
            {$event?.toLua().length ?? 0}/{Grid.Protocol.maxScriptLength - 1}
          </span>
        </div>
      </div>
      <Options
        testid="select_all"
        selected={$event?.config.every((e) => $selected_actions.includes(e))}
        halfSelected={$event?.config.some((e) => $selected_actions.includes(e))}
        disabled={$event?.config.length === 0}
        on:select={handleSelectAll}
      />
    </div>

    <ul
      bind:this={configList}
      use:autoScroll={{
        threshold: 60,
        scrollCondition: () => {
          const dragged = get(draggedActions);
          return dragged && dragged.length > 0;
        },
      }}
      class="overflow-y-scroll justify-start w-full h-full"
    >
      {#if $event?.config.length === 0 && $draggedActions.length === 0 && $profileCloudConfigDrag?.configType !== "snippet"}
        <ActionHelper
          target={{ event: event, index: 0 }}
          text={"There are no actions configured on this event."}
        />
      {:else}
        <SeparatorLine target={{ event: event, index: 0 }} />
      {/if}

      {#each $event?.config ?? [] as action, index (action.id)}
        {@const showHelper =
          typeof action.information.helperText !== "undefined" &&
          ["composite_part", "composite_open"].includes(
            action.information.type,
          ) &&
          $event.config[index + 1]?.indentation === action.indentation &&
          $appSettings.persistent.actionHelperText}

        <div
          data-testid="action-block"
          animate:flip={{ duration: 300, easing: eases.backOut }}
          in:fade|global={{ delay: 0 }}
        >
          <div class="flex flex-row gap-2">
            {#key $latestComponentVersionKeys.get(action.short)}
              <DynamicWrapper
                {index}
                {action}
                selected={typeof $selected_actions.find(
                  (e) => e.id === action.id,
                ) !== "undefined"}
                on:select={(e) => handleSelectionChange(action, e.detail.value)}
              />
            {/key}
            <div class="flex items-center">
              <Option
                selected={typeof $selected_actions.find(
                  (e) => e.id === action.id,
                ) !== "undefined"}
                disabled={!action.information.selectable}
                on:select={(e) => handleSelectionChange(action, e.detail.value)}
              />
            </div>
          </div>

          {#if showHelper && $draggedActions.length === 0 && $profileCloudConfigDrag?.configType !== "snippet"}
            <ActionHelper
              target={{ event: event, index: index + 1 }}
              text={action.information.helperText}
            />
          {:else}
            <SeparatorLine target={{ event: event, index: index + 1 }} />
          {/if}
        </div>
      {/each}
    </ul>

    {#if event}
      <BottomPanel
        target={{ event: event, index: $event?.config.length }}
        on:paste={handlePaste}
        on:new-config={handleNewConfig}
      />
    {/if}
  </div>
{/key}

<style global>
  ::-webkit-scrollbar {
    height: 6px;
    width: 6px;
    background: #1e2628;
  }

  ::-webkit-scrollbar-thumb {
    background: #286787;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    background: #1e2628;
  }
</style>
