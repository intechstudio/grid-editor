<script lang="ts" module>
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "c",
    name: "Comment",
    rendering: "standard",
    category: "code",
    displayName: "Comment Block",
    defaultLua: "--[[This Is A Comment]]",
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">--</span>
    `,
    blockIcon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">--</span>
    `,
    color: "#887880",
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import { GridAction } from "../runtime/runtime.js";

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  const dispatch = createEventDispatcher();

  let scriptValue = $state(""); // local script part

  const validator = $state({
    value: true,
    func: (e: string) => {
      return new Validator(e).NotEmpty().Result();
    },
  });


  function handleConfigChange(config) {
    scriptValue = config.script.split("--[[")[1].split("]]")[0];
  }

  function sendData(e) {
    dispatch("update-action", {
      short: "c",
      script: `--[[${e}]]`,
      validationError: validator.value === false,
    });
  }
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
</script>

<element-name class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Comment"}
    value={scriptValue}
    validator={validator.func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      scriptValue = value;
      validator.value = !validationError;
      dispatch("validation", { value: validationError });
      sendData(value);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</element-name>
