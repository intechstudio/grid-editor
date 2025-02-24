<script lang="ts">
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import Toggle from "../../main/user-interface/Toggle.svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "../validators";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import SendFeedback from "../../main/user-interface/SendFeedback.svelte";
  import { GridAction } from "../../runtime/runtime";

  export let config: GridAction;

  let data = [
    {
      value: "i",
      label: "Variable",
      validator: {
        value: true,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Initial value",
      validator: {
        value: true,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      },
      suggestions: [],
    },
    {
      value: "10",
      label: "End value",
      validator: {
        value: true,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Increment",
      validator: {
        value: true,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      },
      suggestions: [],
    },
  ];

  const dispatch = createEventDispatcher();

  let displayValue = "?";
  let toggleValue = false;

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    const script = config.script;
    let segments = Script.toSegments({ script });

    if (segments.length !== 4) {
      throw "For loop has missing parameter";
    }
    for (let i = 0; i < 4; ++i) {
      data[i].value = String(segments[i]);
    }

    const [start, end, inc] = segments.slice(1).map((e) => Number(e));
    const iterationCount = Math.floor(
      (Math.abs(start - end) + 1) / Math.abs(inc)
    );

    displayValue = Number.isInteger(iterationCount)
      ? String(iterationCount)
      : "?";
  }

  function handleDisplayValueChange(e) {
    const { script } = e.detail;
    dispatch("update-action", {
      short: config.short,
      script: `for i=1,${script},1 do`,
      validationError: data.some((e) => e.validator.value === false),
    });
  }

  function handleInputFieldChange(e, i) {
    data[i].value = e.detail;
    const shortData = data.map((e) => e.value);
    const segments = [shortData[0] + "=" + shortData[1], ...shortData.slice(2)];
    dispatch("update-action", {
      short: config.short,
      script: `for ${segments.join(",")} do`,
      validationError: data.some((e) => e.validator.value === false),
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<container
  class="px-2 w-full h-full rounded-tr-xl justify-center flex flex-col"
  class:p-2={toggleValue}
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row flex-grow items-center gap-2 text-white py-1">
    <span class="">Repeat for</span>
    <div
      class="bg-secondary my-auto mr-1 rounded flex items-center flex-grow h-full w-10"
      on:click|stopPropagation
    >
      {#key displayValue}
        <LineEditor
          on:input={handleDisplayValueChange}
          action={config}
          bind:value={displayValue}
          on:change={() => dispatch("sync")}
        />
      {/key}
    </div>
    <span>times</span>
    <div class="ml-auto flex items-center">
      <Toggle bind:toggleValue class="mr-1" />
    </div>
  </div>

  {#if toggleValue}
    <for-loop-block class="pointer-events-auto mt-2">
      <div class="flex flex-row items-center">
        <div class="flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
              {#each data as obj, i}
                <MeltCombo
                  title={obj.label}
                  bind:value={obj.value}
                  suggestions={obj.suggestions}
                  validator={obj.validator.func}
                  on:input={(e) => {
                    const { value, validationError } = e.detail;
                    obj.validator.value = !validationError;
                  }}
                  on:change={(e) => handleInputFieldChange(e, i)}
                  on:change={() => dispatch("sync")}
                  postProcessor={GridScript.shortify}
                  preProcessor={GridScript.humanize}
                />
              {/each}
            </div>
          </div>

          <SendFeedback
            feedback_context="Midi"
            class="mt-2 text-sm text-gray-700"
          />
        </div>
      </div>
    </for-loop-block>
  {/if}
</container>
