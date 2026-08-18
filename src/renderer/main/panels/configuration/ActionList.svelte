<script lang="ts">
  import BottomPanel from "./BottomPanel.svelte";
  import SeparatorLine from "./components/SeparatorLine.svelte";
  import ActionHelper from "./components/ActionHelper.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import { GridEvent, GridRuntime } from "./../../../runtime/runtime";
  import { fade } from "svelte/transition";
  import * as eases from "svelte/easing";
  import { reduced_motion_store } from "../../../runtime/animations";

  // FLIP-style animation that only translates (unlike svelte/animate's `flip`,
  // which also scales). Scaling squishes the contents of any block whose height
  // changes mid-list — e.g. a code block growing to show a syntax error — so we
  // translate position changes only and let resized blocks grow in place.
  function reflow(
    node: Element,
    { from, to }: { from: DOMRect; to: DOMRect },
    params: {
      delay?: number;
      duration?: number;
      easing?: (t: number) => number;
    } = {},
  ) {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const { delay = 0, duration = 300, easing = eases.cubicOut } = params;
    return {
      delay,
      duration,
      easing,
      css: (_t: number, u: number) =>
        `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`,
    };
  }
  import { addActions, pasteActions } from "../../../runtime/operations";
  import { GridAction } from "./../../../runtime/runtime";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { draggedActions } from "./../../_actions/move.action";
  import Option from "./components/Options.svelte";
  import { user_input } from "../../../runtime/user-input.store";
  import { selected_actions } from "../../../runtime/selected-actions.store";
  import { get } from "svelte/store";
  import Options from "./components/Options.svelte";
  import { Grid } from "../../../lib/_utils";
  import { latestComponentVersionKeys } from "../../../lib/_configs";
  import { profileCloudConfigDrag } from "../profileCloud/ProfileCloud";
  import { autoScroll } from "../../_actions/autoscroll.action";
  import { Focus } from "../../_actions/focus.action";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";

  export let event: GridEvent;
  export let focusTrigger: string;

  let configList: HTMLElement;
  let runtime: GridRuntime;

  $: runtime = $runtime_manager.active.runtime;

  // The Preferences > Animations setting only disables CSS animations/
  // transitions globally (see setDocumentAnimationsEnabled); it has no
  // effect on Svelte's JS-driven transition/animate directives used below,
  // so mirror the same tri-state logic ModuleBorder.svelte uses to gate
  // those directly.
  $: animationsDisabled =
    $appSettings.persistent.disableAnimations === "disabled" ||
    ($appSettings.persistent.disableAnimations !== "enabled" &&
      $reduced_motion_store);

  function handleNewConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(event, index, ...configs);
  }

  function handlePaste(e: any) {
    const { index } = e.detail;
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
    if (!event) {
      return;
    }

    const selected = get(selected_actions);
    if (event.config.every((e) => selected.includes(e))) {
      selected_actions.set([]);
    } else {
      selected_actions.set(event.config);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    //Ignore if origin node is input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof Element &&
        e.target.hasAttribute("contenteditable")) ||
      (e.target instanceof Element && e.target.closest(".monaco-editor"))
    ) {
      return;
    }

    if (e.key === "Escape") {
      const { dx, dy, elementnumber } = get(user_input);
      const runtime = get(runtime_manager).active.runtime;
      const module = runtime.findModule(dx, dy);

      Focus.trigger(`${module.id}-${elementnumber}`);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      handleSelectAll();
      e.preventDefault();
      e.stopPropagation();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      handlePaste(
        new CustomEvent("paste", { detail: { index: event.config.length } }),
      );
      e.preventDefault();
      e.stopPropagation();
    }
  }
</script>

{#key $event?.id}
  <div
    id="test"
    role="tabpanel"
    tabindex="0"
    use:Focus.on={focusTrigger}
    on:keydown={handleKeyDown}
    class=" pb-0 flex flex-col h-full w-full overflow-hidden actionlist activator-button"
  >
    {#if $appSettings.isMultiView}
      <div class="flex flex-row gap-2 px-3 text-sm">
        {($event?.getName() ?? "No Device") + " Event"}
        <div style="color: var(--foreground-disabled);">
          {$event?.toLua().length ?? 0}/{Grid.Protocol.maxScriptLength - 1}
        </div>
      </div>
    {/if}

    <ul
      bind:this={configList}
      use:autoScroll={{
        threshold: 60,
        scrollCondition: () => {
          const dragged = get(draggedActions);
          return dragged && dragged.length > 0;
        },
      }}
      class="overflow-y-scroll overflow-x-hidden justify-start w-full h-full px-1"
    >
      {#if $event?.config.length === 0 && $draggedActions.length === 0 && $profileCloudConfigDrag?.configType !== "snippet"}
        <SeparatorLine target={{ event: event, index: 0 }} />
        <ActionHelper
          target={{ event: event, index: 0 }}
          text={"There are no actions configured on this event."}
        />
        <SeparatorLine target={{ event: event, index: 0 }} />
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
          animate:reflow={{
            duration: animationsDisabled ? 0 : 300,
            easing: eases.cubicOut,
          }}
          in:fade|global={{ delay: 0, duration: animationsDisabled ? 0 : 400 }}
        >
          <div class="flex flex-row gap-1">
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
                testid={`action-checkbox-${index}`}
                selected={typeof $selected_actions.find(
                  (e) => e.id === action.id,
                ) !== "undefined"}
                disabled={!action.information.selectable}
                on:select={(e) => handleSelectionChange(action, e.detail.value)}
              />
            </div>
          </div>

          {#if showHelper && $draggedActions.length === 0 && $profileCloudConfigDrag?.configType !== "snippet"}
            <SeparatorLine target={{ event: event, index: index + 1 }} />
            <ActionHelper
              target={{ event: event, index: index + 1 }}
              text={action.information.helperText}
              indentation={action.indentation + 1}
            />
            <SeparatorLine target={{ event: event, index: index + 1 }} />
          {:else}
            <SeparatorLine target={{ event: event, index: index + 1 }} />
          {/if}
        </div>
      {/each}
    </ul>

    {#if event}
      <div class="flex w-full mt-2">
        <BottomPanel
          target={{ event: event, index: $event?.config.length }}
          on:paste={handlePaste}
          on:new-config={handleNewConfig}
        />
      </div>
    {/if}
  </div>
{/key}
