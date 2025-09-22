<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { MeltCombo, MoltenInput } from "@intechstudio/grid-uikit";
  import { GridAction, GridEvent } from "../../runtime/runtime";
  import { ForLoop } from "../For_Loop";
  import { DynamicWrapper } from "../../main/panels/configuration/components/DynamicWrapper";

  const dispatch = createEventDispatcher();

  export let config: GridAction;
  let event = config.parent as GridEvent;

  const data = new ForLoop.ViewModel(config);

  onDestroy(() => {
    data.destroy();
  });

  $: if (!$config.invalid) {
    handleConfigChange(config);
  }

  function handleConfigChange(action: GridAction) {
    data.updateData(action);
  }

  function sendData() {
    const [short, script, error] = [
      config.short,
      data.buildScript(),
      data.isValidationError(),
    ];
    const event = new DynamicWrapper.Event.UpdateAction(short, script, error);
    dispatch(event.type, event.data);
  }
</script>

<container
  class="px-2 w-full rounded-tr-xl justify-center flex flex-col pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row flex-grow items-center gap-2 py-2 text-white">
    <span>Repeat</span>
    <div class="pointer-events-auto">
      <MeltCombo
        bind:value={$data.variable.value}
        suggestions={$data.variable.suggestions}
        validator={$data.variable.validator.func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          $data.variable.validator.value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
        valueInfoEnabled={false}
      />
    </div>
    <span>for</span>
    <div class="pointer-events-auto">
      <MoltenInput
        bind:target={$data.increment}
        on:input={sendData}
        on:change={() => dispatch("sync")}
        availableCharacters={$event.getAvailableChars()}
      />
    </div>
    <span class="mr-10">times</span>
  </div>
</container>
