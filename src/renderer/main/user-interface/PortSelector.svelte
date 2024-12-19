<script lang="ts">
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import {
    GridRuntimeManagerData,
    runtime_manager,
  } from "../../runtime/runtime.manager.store";
  import { get } from "svelte/store";

  export let visible = false;
  export let disabled = false;

  let selected: string;

  let options: any[] = [];

  $: handleConnectionChange($runtime_manager);

  function handleConnectionChange(rtm: GridRuntimeManagerData) {
    let [virtual, physical] = [0, 0];
    options = [];
    rtm.data.forEach((e) => {
      let title = "";
      if (e.runtime.virtual) {
        title = `Virtual ${virtual + 1}`;
        ++virtual;
      } else {
        title = `Port ${physical + 1}`;
        ++physical;
      }
      options.push({
        value: e.runtime.id,
        title: title,
      });
    });

    if (options.length === 0) {
      options.push({ value: "", title: "None" });
      selected = "";
    } else {
      selected = rtm.active?.runtime.id;
    }
  }

  $: handleSelectedChange(selected);

  function handleSelectedChange(id: string) {
    const selected = runtime_manager.data.find((e) => e.runtime.id === id);
    runtime_manager.active = selected;
  }
</script>

{#key options}
  <div
    class:hidden={!visible}
    class="w-24 h-fit text-white {disabled ? 'opacity-50' : ''}"
  >
    {#if disabled}
      <MeltSelect bind:target={selected} {options} disabled={true} />
    {:else}
      <MeltSelect bind:target={selected} {options} disabled={false} />
    {/if}
  </div>
{/key}
