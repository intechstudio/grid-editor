<script lang="ts" context="module">
  import { type ActionBlockInformation } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "cb",
    name: "CodeBlock",
    rendering: "standard",
    category: "code",
    displayName: "Code Block",
    description: "Write Lua code by hand",
    documentationUrl: "https://docs.intech.studio/wiki/actions/code/code-block",
    color: categoryColors["code"],
    defaultLua: 'print("hello")',
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m9 8.2-3.8 3.8L9 15.8M15 8.2l3.8 3.8L15 15.8"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    hiddenInMinimalist: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { GridAction } from "./../runtime/runtime";
  import CodeEditorPanel from "./components/CodeEditorPanel.svelte";

  export let action: GridAction;
</script>

<code-block class="w-full flex flex-col">
  <CodeEditorPanel {action} on:update-action />
</code-block>
