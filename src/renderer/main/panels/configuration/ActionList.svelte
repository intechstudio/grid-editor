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
  import { selected_actions } from "../../../runtime/user-input.store";
  import { get } from "svelte/store";
  import { grid } from "@intechstudio/grid-protocol";
  import {
    shortcut,
    ShortcutParameter,
  } from "./../../_actions/shortcut.action";
  import Options from "./components/Options.svelte";
  import { Grid } from "../../../lib/_utils";
  import { onMount } from "svelte";

  export let event: GridEvent;
  export let targetPanel: HTMLElement;

  let autoScroll;
  let configList: HTMLElement;

  function handleNewConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(event, index, ...configs);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(event, index);
  }

  function handleMouseMove(e: MouseEvent) {
    const dragged = get(draggedActions);
    if (typeof dragged !== "undefined") {
      const mouseY = e.clientY - configList.getBoundingClientRect().top;
      const configListHeight = configList.offsetHeight;
      const treshold = 60;
      const lowerThreshold = configListHeight - mouseY <= treshold;
      const upperThreshold =
        configListHeight - mouseY > configListHeight - treshold;
      clearInterval(autoScroll);
      if (lowerThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop += 5;
        }, 10);
      } else if (upperThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop -= 5;
        }, 10);
      }
    }
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

<container class="flex flex-col h-full w-full overflow-hidden gap-2">
  <div class="flex flex-row gap-2 justify-between items-center flex-none">
    <div class="flex flex-col">
      <span class="text-white">{$event?.getName() ?? "No Device"}</span>
      <div class="flex flex-row gap-2">
        <span class="text-gray-500 text-sm">Script length:</span>
        <span data-testid="charCount" class="text-white text-sm">
          {$event?.toLua().length ?? 0}/{Grid.Protocol.maxScriptLength - 1}
        </span>
      </div>
    </div>
    <button
      class="w-fit h-fit mr-[16px]"
      use:shortcut={{
        control: true,
        code: "KeyA",
        callback: handleSelectAll,
        targetPanel: targetPanel,
      }}
    >
      <Options
        selected={$event?.config.every((e) => $selected_actions.includes(e))}
        halfSelected={$event?.config.some((e) => $selected_actions.includes(e))}
        disabled={$event?.config.length === 0}
        on:select={handleSelectAll}
      />
    </button>
  </div>

  <ul
    bind:this={configList}
    on:mousemove={handleMouseMove}
    on:mouseleave={() => clearInterval(autoScroll)}
    class="flex-1 overflow-y-scroll justify-start px-3"
  >
    {#if $event?.config.length === 0 && $draggedActions.length === 0}
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
          action.information.type
        ) &&
        $event.config[index + 1]?.indentation === action.indentation &&
        $appSettings.persistent.actionHelperText}

      <anim-block
        animate:flip={{ duration: 300, easing: eases.backOut }}
        in:fade|global={{ delay: 0 }}
      >
        <div class="flex flex-row gap-2">
          <DynamicWrapper
            {index}
            {action}
            selected={typeof $selected_actions.find(
              (e) => e.id === action.id
            ) !== "undefined"}
            on:select={(e) => handleSelectionChange(action, e.detail.value)}
          />
          <div class="flex items-center">
            <Option
              selected={typeof $selected_actions.find(
                (e) => e.id === action.id
              ) !== "undefined"}
              disabled={!action.information.selectable}
              on:select={(e) => handleSelectionChange(action, e.detail.value)}
            />
          </div>
        </div>

        {#if showHelper && $draggedActions.length === 0}
          <ActionHelper
            target={{ event: event, index: index + 1 }}
            text={action.information.helperText}
          />
        {:else}
          <SeparatorLine target={{ event: event, index: index + 1 }} />
        {/if}
      </anim-block>
    {/each}
  </ul>

  {#if event}
    <BottomPanel
      target={{ event: event, index: $event?.config.length }}
      on:paste={handlePaste}
      on:new-config={handleNewConfig}
    />
  {/if}
</container>

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
