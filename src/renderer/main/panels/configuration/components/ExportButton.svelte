<script>
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { Modal } from "../../../modals/modal.store";
  import Export from "../../../modals/Export.svelte";
</script>

<button
  id="open-export-modal"
  aria-label="Export configurations"
  on:click|preventDefault={() => {
    new Modal.Window(Export).show();
  }}
  class="flex cursor-pointer focus:ring-1 justify-center focus:outline-none items-center hover:bg-background-muted"
  style="border-radius: var(--radius);"
>
  <div class="w-7 h-4 pointer-events-none">
    <SvgIcon iconPath="exportIcon" fill="var(--foreground)" />
  </div>
</button>
