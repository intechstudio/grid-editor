<script lang="ts">
  import { modal } from "./modal.store";
  import { clickOutside } from "../_actions/click-outside.action";

  export let width: number = 300;

  function close() {
    modal.close();
  }
</script>

<div
  class="z-40 absolute w-screen h-screen
    bg-secondary bg-opacity-50"
>
  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={close}
    id="clickbox"
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-fit h-fit text-white shadow-md py-6 px-12
      bg-primary max-w-4xl rounded"
    style="width: {width}px"
  >
    <slot name="content" />
  </div>
</div>
