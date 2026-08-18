<script lang="ts">
  import { get } from "svelte/store";
  import { MeltSelect, MoltenInput } from "@intechstudio/grid-uikit";
  import { user_input } from "./../../../runtime/user-input.store";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { GridPage, PageData } from "../../../runtime/runtime";
  import { tick } from "svelte";

  export let page: GridPage;
  export let isEditingName: boolean = false;
  export let elementName: string = "";

  let selectedElementNumber = -1;
  let options = [{ title: "No Device", value: -1 }];
  let nameInput: MoltenInput;

  $: handleSelectedChange(selectedElementNumber);

  function handleSelectedChange(elementNumber) {
    if (elementNumber === -1 || typeof elementNumber === "undefined") {
      return;
    }

    const ui = $user_input;
    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: elementNumber,
      eventtype: ui.eventtype,
    });
  }

  $: handlePageChange($page);

  function handlePageChange(page: PageData) {
    if (typeof page === "undefined") {
      options = [{ title: "No Device", value: -1 }];
      selectedElementNumber = -1;
      return;
    }

    const elements = page.control_elements;

    let newOptions = elements.map((e) => {
      const stringName = e.name;
      if (typeof stringName !== "undefined") {
        return {
          title:
            stringName +
            ` (${e.type[0].toUpperCase() + e.type.slice(1).toLowerCase()})`,
          value: e.elementIndex,
        };
      } else {
        return {
          title: e.getHumanName(),
          value: e.elementIndex,
        };
      }
    });

    if (JSON.stringify(options) !== JSON.stringify(newOptions)) {
      options = newOptions;
    }
    selectedElementNumber = get(user_input).elementnumber;
  }

  $: if (isEditingName) {
    tick().then(() => {
      if (nameInput) nameInput.focus();
    });
  }
</script>

<div class="w-full" data-testid="element-name-input-field">
  {#if isEditingName}
    <MoltenInput
      bind:this={nameInput}
      target={elementName}
      on:input={(e) => (elementName = e.detail.value)}
      on:change
      on:blur
      on:keydown
    />
  {:else}
    {#key options}
      <MeltSelect
        bind:target={selectedElementNumber}
        {options}
        disabled={false}
      />
    {/key}
  {/if}
</div>
