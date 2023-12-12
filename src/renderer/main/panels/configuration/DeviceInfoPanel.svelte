<script>
  import { user_input, runtime } from "./../../../runtime/runtime.store.js";

  $: handleUserInputChange($user_input);

  let deviceInfo = { type: "N/A", x: undefined, y: undefined };

  function handleUserInputChange(ui) {
    const { dx, dy } = ui.brc;
    const device = $runtime.find(
      (device) => device.dx === dx && device.dy == dy
    );
    if (typeof device === "undefined") {
      deviceInfo = { type: "N/A", x: undefined, y: undefined };
      return;
    }

    deviceInfo = { type: device.id.substr(0, 4), x: dx, y: dy };
  }
</script>

<div class="flex flex-col {$$props.class}">
  <span class="text-sm text-gray-500">Selected Module</span>
  <span class="text-white">{deviceInfo.type}</span>
</div>
