<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridAction } from "../../runtime/runtime";
  import { ForLoop } from "../For_Loop";
  import { DynamicWrapper } from "../../main/panels/configuration/components/DynamicWrapper";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  const data = new ForLoop.ViewModel(action);

  onDestroy(() => {
    data.destroy();
  });

  $: if (!$action.invalid) {
    handleActionChange(action);
  }

  function handleActionChange(action: GridAction) {
    data.updateData(action);
  }

  function sendData() {
    const [short, script, error] = [
      action.short,
      data.buildScript(),
      data.isValidationError(),
    ];
    const event = new DynamicWrapper.Event.UpdateAction(short, script, error);
    dispatch(event.type, event.data);
  }
</script>

<container
  class="p-2 w-full justify-center flex flex-col pointer-events-none text-sm"
>
  <div class="flex flex-row flex-grow items-center gap-1">
    <div class="pointer-events-auto">
      <MeltCombo
        title={"Repeat"}
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
    <div class="pointer-events-auto">
      <MeltCombo
        MeltCombo
        title={"Times"}
        bind:value={$data.increment.value}
        suggestions={$data.increment.suggestions}
        validator={$data.increment.validator.func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          $data.increment.validator.value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
        valueInfoEnabled={false}
      />
    </div>
  </div>
</container>
