<script>
  import IconButton from "../../../user-interface/IconButton.svelte";
  import { Modal } from "../../../modals/modal.store";
  import Export from "../../../modals/Export.svelte";
</script>

<IconButton
  id="open-export-modal"
  ariaLabel="Export configurations"
  iconPath="exportIcon"
  tooltipText="Export"
  onClick={() => new Modal.Window(Export).show()}
/>
