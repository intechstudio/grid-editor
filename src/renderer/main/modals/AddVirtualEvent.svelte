<script lang="ts">
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import {
    GridScript,
    EventType,
    EventTypeToNumber,
  } from "@intechstudio/grid-protocol";
  import { onMount, tick } from "svelte";
  import { Modal } from "./modal.store";
  import { GridElement } from "../../runtime/runtime";
  import { addActions } from "../../runtime/operations";
  import { buildVirtualEventBlocks } from "../../runtime/virtual-event";
  import { user_input } from "../../runtime/user-input.store";
  import { functionSuggestions } from "../../lib/function-suggestions";
  import { get } from "svelte/store";

  export let data: Modal.Instance;

  export let element: GridElement;
  export let existingNames: string[];

  // Accepts an optional dotted table-field path (e.g. "self.foo") and an
  // optional Lua-style parameter list (e.g. "midi_rx_cb(self)" or
  // "self.foo(self, bar)") — matching how callbacks are actually declared in
  // Lua. Params are unvalidated beyond "comma-separated identifiers"; name
  // (including any dots) is group 1, the raw params text (or undefined) is
  // group 2.
  const SIGNATURE_REGEX =
    /^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*(?:\(\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)?\s*\))?$/;

  let editValue = "";
  let comboContainer: HTMLDivElement;

  onMount(async () => {
    await tick();
    comboContainer?.querySelector("input")?.focus();
  });

  $: trimmed = editValue.trim();
  $: match = trimmed.match(SIGNATURE_REGEX);
  $: name = match?.[1] ?? "";
  $: params = match?.[2] ?? "";
  $: isValid = match !== null && !existingNames.includes(name);

  const validator = {
    value: true,
    func: (e: string) => {
      const m = e.trim().match(SIGNATURE_REGEX);
      return m !== null && !existingNames.includes(m[1]);
    },
  };

  function handleComboInput(e: any) {
    const { value, validationError } = e.detail;
    editValue = value;
    validator.value = !validationError;
  }

  async function handleCreate() {
    if (!isValid) {
      return;
    }

    const setup = element.events.find(
      (e) => e.type === EventTypeToNumber(EventType.SETUP),
    );
    if (!setup) {
      return;
    }

    const { fst, fen } = buildVirtualEventBlocks(name, params);
    await addActions(setup, setup.config.length, fst, fen);

    const ui = get(user_input);
    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: ui.elementnumber,
      eventtype: EventTypeToNumber(EventType.SETUP),
      virtualEventName: name,
    });

    data.close();
  }

  function handleCancel() {
    data.close();
  }
</script>

<MoltenModal {data} width="400px">
  <div slot="content" class="class flex flex-col gap-2 items-center p-6">
    <span class="text-xl self-start">Add Virtual Event</span>
    <span class="text-sm self-start text-foreground-muted">
      Creates a named function on the Setup event that you can call as a
      callback. Optionally add parameters, e.g. midi_rx_cb(self), or a table
      field path, e.g. self.foo(self, bar).
    </span>
    <div bind:this={comboContainer} class="w-full">
      <MeltCombo
        value={editValue}
        suggestions={functionSuggestions}
        validator={validator.func}
        size="full"
        on:input={handleComboInput}
        preProcessor={GridScript.humanize}
        postProcessor={GridScript.shortify}
      />
    </div>
    {#if trimmed.length > 0 && !isValid}
      <span class="text-sm self-start text-error">
        {match !== null && existingNames.includes(name)
          ? "A virtual event with this name already exists."
          : "Use a valid Lua function name (dotted paths allowed), optionally with parameters, e.g. self.foo(self, bar)."}
      </span>
    {/if}
    <div class="flex flex-row gap-2">
      <MoltenPushButton
        click={handleCreate}
        text={"Add"}
        style={"accept"}
        disabled={!isValid}
      />
      <MoltenPushButton click={handleCancel} text={"Cancel"} />
    </div>
  </div>
</MoltenModal>
