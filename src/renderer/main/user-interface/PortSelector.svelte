<script lang="ts">
  import { get } from "svelte/store";
  import { connection_manager, GridPort } from "./../../serialport/serialport";
  import { MeltSelect } from "@intechstudio/grid-uikit";

  export let visible = false;

  let selected: string;

  let options: any[] = [];

  const ports = connection_manager.ports;

  $: handlePortChange($ports);

  async function handlePortChange(ports: GridPort[]) {
    options = [];
    for (const [i, port] of ports.entries()) {
      const info = port.getInfo();
      options.push({
        value: port.id,
        title: `Port ${i + 1}`,
      });
    }
    selected = connection_manager.active?.id;
  }

  $: handleSelectedChange(selected);

  function handleSelectedChange(id: string) {
    const port = get(ports).find((e) => e.id === id);
    if (typeof port === "undefined") {
      return;
    }
    connection_manager.fetchStream(port);
  }
</script>

<div class:hidden={!visible} class="w-24 h-fit text-white">
  <MeltSelect bind:target={selected} {options} />
</div>
