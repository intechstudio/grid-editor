<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { ActionData, GridAction, GridEvent } from "../../runtime/runtime";
  import { Validator } from "../validators";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part
  let event = action.parent as GridEvent;
  let isUserInput = false; // Flag to prevent reactive loop

  const suggestions = [
    { value: "foo(bar)", info: "Example function with parameter" },
    {
      value: "self.midirx_cb(self, event, header)",
      info: "MIDI RX callback handler",
    },
    {
      value: "self.sysexrx_cb(self, sysex, header)",
      info: "SysEx RX callback handler",
    },
  ];

  const validator = {
    value: true,
    func: (e: string) => {
      return new Validator(e).NotEmpty().Result();
    },
  };

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    // Skip update if user is actively typing to prevent cursor jump
    if (isUserInput) return;

    // Extract "name(params)" from "name = function(params)"
    const match = data.script.match(/^(.+?)\s*=\s*function\((.*?)\)/);
    if (match) {
      const [, name, params] = match;
      scriptSegment = params.trim()
        ? GridScript.humanize(`${name.trim()}(${params.trim()})`)
        : GridScript.humanize(name.trim());
    } else {
      scriptSegment = GridScript.humanize(data.script);
    }
  }

  function sendData(value: string) {
    // Check if user included parameters like "myFunc(a, b)"
    const match = value.match(/^(.+?)\((.*?)\)$/);

    if (match) {
      // Has parameters: "name(params)" → "name = function(params)"
      const [, name, params] = match;
      dispatch("update-action", {
        short: `fst`,
        script: `${name} = function(${params})`,
        validationError: !validator.value,
      });
    } else {
      // No parameters: "name" → "name = function()"
      dispatch("update-action", {
        short: `fst`,
        script: `${value} = function()`,
        validationError: !validator.value,
      });
    }
  }
</script>

<function-start-block
  class="px-2 w-full rounded-tr-xl flex text-white py-1 pointer-events-none"
  style="background-color:{action.information.color}"
>
  <div class="flex flex-row items-center w-full gap-2">
    <div class="pointer-events-auto flex-grow">
      <MeltCombo
        title={"Function"}
        value={scriptSegment}
        {suggestions}
        validator={validator.func}
        on:input={async (e) => {
          const { value, validationError } = e.detail;
          isUserInput = true;
          scriptSegment = value;
          validator.value = !validationError;
          sendData(value);
          await tick();
          // Delay resetting to ensure reactive statements don't interfere
          setTimeout(() => {
            isUserInput = false;
          }, 0);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
        valueInfoEnabled={false}
      />
    </div>
  </div>
</function-start-block>
