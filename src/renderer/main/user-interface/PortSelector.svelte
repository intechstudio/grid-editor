<script lang="ts">
  import { get, writable } from "svelte/store";
  import { connection_manager, GridPort } from "./../../serialport/serialport";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../runtime/runtime.store";

  export let visible = false;
  export let disabled = false;

  let selected: string;

  let options: any[] = [];

  $: handlePortChange($connection_manager.map((e) => e.port));

  async function handlePortChange(ports: GridPort[]) {
    options = [];
    for (const [i, port] of ports.entries()) {
      const info = port.getInfo();
      options.push({
        value: port.id,
        title: `Port ${i + 1}`,
      });
    }
    //selected = runtime_manager.active?.id;
  }

  $: handleSelectedChange(selected);

  function handleSelectedChange(id: string) {
    /*
    const port = get(ports).find((e) => e.id === id);
    if (typeof port === "undefined") {
      return;
    }
    connection_manager.fetchStream(port);
    */
  }
</script>

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
