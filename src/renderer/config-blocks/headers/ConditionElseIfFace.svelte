<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ElementType, GridScript } from "@intechstudio/grid-protocol";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { ActionData, GridAction, GridEvent } from "../../runtime/runtime";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  let event = action.parent as GridEvent;
  let scriptSegment = ""; // local script part
  let elementType = $event.getInfo().element.type as ElementType;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptSegment = GridScript.humanize(data.script.slice(7, -5));
  }

  function sendData(e) {
    const script = GridScript.shortify(e);

    dispatch("update-action", {
      short: "ei",
      script: `elseif ${script} then`,
      validationError: false,
    });
  }
</script>

<div class="px-2 w-full flex text-white py-1 pointer-events-none">
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Else if</span>

    <div
      class="bg-secondary my-auto mr-1 rounded flex items-center flex-grow h-full"
    >
      <LineEditor
        on:input={(e) => {
          const { script } = e.detail;
          sendData(script);
        }}
        on:change={() => dispatch("sync")}
        value={scriptSegment}
        availableCharacters={$event.getAvailableChars()}
        restrictScopeTo={elementType}
        luals
        lualsExpressionOnly
      />
    </div>
  </div>
</div>
