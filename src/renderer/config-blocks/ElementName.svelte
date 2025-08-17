<script lang="ts" module>
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sn",
    name: "ElementName",
    rendering: "standard",
    category: "code",
    displayName: "Element Name",
    defaultLua: `self:gen("Custom Name")`,
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">N</span>
    `,
    blockIcon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">N</span>
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

  const validator = $state({
    value: true,
    func: (e: string) => {
      return new Validator(e).NotEmpty().Result();
    },
  });

  let scriptValue = $state(""); // local script part


  function handleConfigChange(config) {
    const matches = config.script.match(/self:gen\("([^"]*)"\)/);
    scriptValue = matches[1];
  }


  function sendData(e) {
    dispatch("update-action", {
      short: "sn",
      script: `self:gen("${e}")`,
      validationError: validator.value === false,
    });
  }
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
  run(() => {
    sendData(scriptValue);
  });
</script>

<element-name class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Element Name"}
    value={scriptValue}
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
