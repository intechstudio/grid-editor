<script>
  import { fade } from "svelte/transition";
  import { current_tooltip_store } from "../../../runtime/app-helper.store";

  export function cursorLog(node, { tooltip }) {
    const div = document.getElementById("cursor-tooltip");

    const width = window.innerWidth;
    const height = window.innerHeight;

    let mouseX, mouseY;

    function moveCursor() {
      let [TOP, LEFT] = [0, 0];

      const rect = node.getBoundingClientRect();

      let [placeleft_X, placeleft_Y] = [width - mouseX, height - mouseY]; // the place left before going out of frame

      if (placeleft_X - rect.width < 0) {
        LEFT = mouseX + (placeleft_X - rect.width);
      } else {
        LEFT = mouseX;
      }

      if (placeleft_Y - rect.height < 0) {
        TOP = mouseY + (placeleft_Y - rect.height - 30);
      } else {
        TOP = mouseY;
      }

      div.style.left = LEFT + "px";
      div.style.top = TOP + "px";
    }

    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      moveCursor();
    }

    document.addEventListener("mousemove", handleMouseMove);

    return {
      update(tooltip) {
        if (tooltip) moveCursor();
      },
      destroy() {
        document.removeEventListener("mousemove", handleMouseMove);
      },
    };
  }
</script>

{#if $current_tooltip_store.bool}
  <div
    id="cursor-tooltip"
    style="z-index:20;"
    use:cursorLog={$current_tooltip_store.bool}
    class="absolute"
  >
    <div
      in:fade={{ duration: 100, delay: 500 }}
      class="border-primary flex flex-col w-72 rounded-lg bg-thirdery shadow border-2 px-4 py-1 text-white"
    >
      {$current_tooltip_store.key}
    </div>
  </div>
{/if}
