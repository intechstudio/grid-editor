<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "s",
    name: "VarSelf",
    rendering: "standard",
    category: "variables",
    displayName: "Self",
    defaultLua: "self.num = 0",
    color: "#78BC61",
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";
  import { Grid } from "../lib/_utils.js";
  import { parenthesis } from "./_validators.js";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  type ScriptSegment = Grid.VariableBlock.ScriptSegment;

  function handleUpdateAction(e: any) {
    dispatch("update-action", e.detail);
  }

  function scriptToSegments(script: string) {
    if (!parenthesis(script)) {
      return;
    }
    // this had to be moved out of selfs function, as array refresh was killed by $ with scriptSegments..
    const _value_array = script.split("=")[1];

    let slice_pos = [];
    let _part = "";
    let offset = 0;

    Array.from(_value_array).forEach((element, index) => {
      _part += element;
      const closed = parenthesis(_part);
      if (closed && element == ",") {
        slice_pos.push({ off: offset, ind: index });
        offset = index + 1;
      }
      if (index == _value_array.length - 1) {
        slice_pos.push({ off: offset, ind: index + 1 });
      }
    });

    const _variable_array = script
      .split("=")[0]
      .split(",")
      .map((e) => {
        return e.split(".")[1];
      });

    let arr = [];

    slice_pos.forEach((pos, i) => {
      arr.push({
        variable: _variable_array[i].trim(),
        value: _value_array.slice(pos.off, pos.ind).trim(),
      });
    });

    return arr;
  }

  function segmentsToScript(segments: ScriptSegment[]): string {
    const variables = segments
      .map((segment) => `self.${segment.variable}`)
      .join(",");
    const values = segments.map((segment) => segment.value).join(",");
    return `${variables}=${values}`;
  }
</script>

<container>
  <VariableManager
    {config}
    parseScript={scriptToSegments}
    buildScript={segmentsToScript}
    on:update-action={handleUpdateAction}
  />
</container>
