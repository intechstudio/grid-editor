<script>
  import { ModuleType } from "./../../protocol/grid-protocol.ts";
  import { Analytics } from "./../../runtime/analytics.js";
  import { runtime } from "../../runtime/runtime.store";
  import MeltSelect from "../panels/preferences/MeltSelect.svelte";
  import MoltenPushButton from "../panels/preferences/MoltenPushButton.svelte";
  import MoltenModal from "./MoltenModal.svelte";

  let modal = undefined;

  let selected = 0;
  let options = Object.keys(ModuleType).map((key, index) =>
    Object({ title: key, value: index })
  );

  function handleAddClicked(e) {
    const moduleType = options.find((e) => e.value == selected).title;
    runtime.addVirtualModule({
      type: moduleType,
    });
    modal.close();
    Analytics.track({
      event: "VirtualModule",
      payload: {
        message: `Add virtual module: ${moduleType}`,
      },
      mandatory: true,
    });
  }

  function handleCancelClicked(e) {
    modal.close();
  }
</script>

<MoltenModal bind:this={modal}>
  <div slot="content">
    <div class="flex w-full text-4xl opacity-90 pb-2">
      Welcome to Virtual Mode!
    </div>
    <div class="flex flex-col gap-2">
      <p>
        In virtual mode you can check out the features of Grid Editor.
        <br />
        Add your chosen module as a preview, and get started!
      </p>
      <p>
        Browse profiles and presets in the Profile Cloud, or download
        <br />
        them to your virtual module!
      </p>
      <div class="flex flex-row w-full gap-2 pt-4">
        <MeltSelect bind:target={selected} {options} size="full" />
        <MoltenPushButton
          text="Get Started!"
          on:click={handleAddClicked}
          style="accept"
        />
        <MoltenPushButton text="Cancel" on:click={handleCancelClicked} />
      </div>
    </div>
  </div>
</MoltenModal>
