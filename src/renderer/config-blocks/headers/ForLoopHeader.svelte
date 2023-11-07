<script>
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import Toggle from "../../main/user-interface/Toggle.svelte";
  import stringManipulation from "../../main/user-interface/_string-operations";
  import { Validator } from "../_validators";
  import AtomicInput from "../../main/user-interface/AtomicInput.svelte";
  import SendFeedback from "../../main/user-interface/SendFeedback.svelte";

  export let index;
  export let access_tree;
  export let config = undefined;

  let data = [
    {
      value: "i",
      label: "Variable",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Initial value",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "10",
      label: "End value",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Increment",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
  ];

  const dispatch = createEventDispatcher();

  let displayValue = "?";
  let toggleValue = false;

  $: handleConfigChange(config);

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
    dispatch("output", {
      short: config.short,
      script: `for i=1,${script},1 do`,
    });
  }

  function handleInputFieldChange(e, i) {
    const shortData = data.map((e) => stringManipulation.shortify(e.value));
    const segments = [shortData[0] + "=" + shortData[1], ...shortData.slice(2)];
    dispatch("output", {
      short: config.short,
      script: `for ${segments.join(",")} do`,
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<container
  class="{$$props.class} h-full justify-center flex flex-col rounded-tr-xl"
  class:p-2={toggleValue}
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row flex-grow items-center gap-2 text-white">
    <span class="">Repeat for</span>
    <div
      class="bg-secondary p-1 my-auto rounded flex items-center w-10"
      on:click|stopPropagation
    >
      {#key displayValue}
        <LineEditor
          on:change={handleDisplayValueChange}
          {access_tree}
          bind:value={displayValue}
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
            <div class="grid grid-cols-4 gap-x-2 gap-y-1">
              {#each data as obj}
                <div class="text-white text-sm h-full truncate">
                  {obj.label}
                </div>
              {/each}
              {#each data as obj, i}
                <AtomicInput
                  class="flex h-7"
                  bind:inputValue={obj.value}
                  suggestions={obj.suggestions}
                  validator={obj.validator}
                  on:validator={(e) => {
                    const data = e.detail;
                    dispatch("validator", data);
                  }}
                  on:change={(e) => handleInputFieldChange(e, i)}
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
