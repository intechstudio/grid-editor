<script>
  import { clickOutside } from "../_actions/click-outside.action";
  import { appSettings } from "../../runtime/app-helper.store";

  export function close() {
    $appSettings.modal = "";
  }
</script>

<div id="modal-copy-placeholder" />

<modal
  class="z-40 flex absolute items-center justify-center w-full h-screen
    bg-secondary bg-opacity-50"
>
  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={close}
    id="clickbox"
    class="z-50 w-fit h-fit text-white relative flex shadow py-6 px-12
      bg-primary max-w-4xl"
  >
    <slot name="content" />
  </div>
</modal>
