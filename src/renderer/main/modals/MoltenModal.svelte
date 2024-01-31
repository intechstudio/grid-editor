<script>
  import { appSettings } from "../../runtime/app-helper.store";

  export function close() {
    $appSettings.modal = "";
  }
</script>

<div id="modal-copy-placeholder" />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<modal
  class="z-40 flex absolute items-center justify-center w-full h-screen
    bg-secondary bg-opacity-50"
  on:click|self={close}
>
  <div
    id="clickbox"
    class="z-50 w-fit h-fit text-white relative flex shadow py-6 px-12
      bg-primary max-w-4xl"
  >
    <slot name="content" />
  </div>
</modal>
