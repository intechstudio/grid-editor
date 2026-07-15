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
      value: "self.midirx_cb(self, header, event)",
      info: "MIDI RX callback handler",
    },
    {
      value: "self.sysexrx_cb(self, header, sysex)",
      info: "SysEx RX callback handler",
    },
    {
      value: "self.rtmrx_cb(self, header, rtm)",
      info: "MIDI Real-Time RX callback handler (clock, start, stop, etc.)",
    },
    {
      value: "midi_auto_ch(self)",
      info: "Calculate default MIDI channel (0-15) from grid position",
    },
    {
      value: "midi_auto_cmd(self)",
      info: "Calculate default MIDI command (144=Note On, 176=Control Change)",
    },
    {
      value: "midi_auto_p1(self)",
      info: "Calculate default MIDI parameter 1 (note/CC number 0-127)",
    },
    {
      value: "midi_auto_p2(self)",
      info: "Calculate default MIDI parameter 2 (value from element state)",
    },
    {
      value: "color_curve(c)",
      info: "Calculate three-point intensity response curve (min, mid, max)",
    },
    {
      value: "color_auto_layer(self)",
      info: "Calculate LED layer (1=button/pot, 2=encoder) from event type",
    },
    {
      value: "color_auto_value(self, i)",
      info: "Calculate LED intensity value (0-255) for segment i",
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

<function-start-block class="px-1 w-full flex pointer-events-none text-sm">
  <div class="flex flex-row items-center w-full gap-1">
    <div class="pointer-events-auto flex-grow pt-3">
      <MeltCombo
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
      />
    </div>
  </div>
</function-start-block>
