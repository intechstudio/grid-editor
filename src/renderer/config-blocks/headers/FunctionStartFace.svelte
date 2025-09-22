<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ElementType, GridScript } from "@intechstudio/grid-protocol";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { ActionData, GridAction, GridEvent } from "../../runtime/runtime";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part
  let event = action.parent as GridEvent;
  let elementType = $event.getInfo().element.type as ElementType;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptSegment = GridScript.humanize(data.script.slice(9));
  }

  function sendData(e) {
    const script = GridScript.shortify(e);

    dispatch("update-action", {
      short: `fst`,
      script: `function ${script}`,
      validationError: false,
    });
  }
</script>

<function-start-block
  class="px-2 w-full rounded-tr-xl flex text-white py-1 pointer-events-none"
  style="background-color:{action.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Function</span>

    <div class="bg-secondary mr-1 rounded flex items-center flex-grow h-full">
      <LineEditor
        on:input={(e) => {
          const { script } = e.detail;
          sendData(script);
        }}
        on:change={() => dispatch("sync")}
        value={scriptSegment}
        availableCharacters={$event.getAvailableChars()}
        restrictScopeTo={elementType}
      />
    </div>
  </div>
</function-start-block>
