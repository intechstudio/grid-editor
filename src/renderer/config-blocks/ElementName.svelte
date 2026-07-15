<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

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
    valueRegex: /self:gen\("([^"]*)"\)/,
    editName: true,
    version: "2.0",
  };

  export function generateScript(name: string) {
    return `self:gen("${name}")`;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import {
    EventType,
    GridScript,
    NumberToEventType,
  } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
  } from "../runtime/runtime.js";

  export let action: GridAction;

  let event = action.parent as GridEvent;
  let element = event.parent as GridElement;

  const dispatch = createEventDispatcher();

  const validator = {
    value: true,
    func: (e: string) => {
      return new Validator(e).NotEmpty().Result();
    },
  };

  let scriptValue = ""; // local script part

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const matches = data.script.match(information.valueRegex);
    scriptValue = matches[1];
  }

  $: {
    // Update the element name if this is the canonical name block in the Setup
    // event — at any position, not only action-0. If several sn blocks exist the
    // FIRST is canonical, so editing a later duplicate must not touch element.name.
    const isSetup = NumberToEventType(event.type) === EventType.SETUP;
    const isPrimaryName =
      event.config.find((e) => e.short === information.short)?.id === action.id;
    if (isSetup && isPrimaryName) {
      element.name = scriptValue;
    }
    sendData(scriptValue);
  }

  function sendData(e) {
    dispatch("update-action", {
      short: information.short,
      script: `self:gen("${e}")`,
      validationError: validator.value === false,
    });
  }
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
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</element-name>
