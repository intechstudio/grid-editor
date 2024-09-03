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
    const portInfo = await window.electron.listSerialPorts();
    for (const port of ports) {
      const info = port.getInfo();
      const path = portInfo.find(
        (e) =>
          parseInt(e.productId, 16) === info.usbProductId &&
          parseInt(e.vendorId, 16) === info.usbVendorId
      )?.path;
      options.push({
        value: port.id,
        title: path,
      });
    }

    selected = connection_manager.active?.id;
  }

  $: handleSelectedChange(selected);

  function handleSelectedChange(id: string) {
    const port = get(ports).find((e) => e.id === id);
    connection_manager.fetchStream(port);
  }
</script>

<div class:hidden={!visible} class="w-24 h-fit text-white">
  <MeltSelect bind:target={selected} {options} />
</div>
