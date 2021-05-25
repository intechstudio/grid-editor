<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'cb',
    groupType: 'standard',
    desc: 'Code Block',
    icon: null
  }

</script>

<script>

  import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';

  export let config;
  export let index;
  export let advanced;
  export let advancedClickAddon;

  $: console.log(config);

</script>


{#if !advanced}
<code-block class="w-full flex p-4">
  <CodeEditor on:output doc={`${config.script}`} {index} showCharCount={false}/>
</code-block>
{:else}
  <CodeEditor doc={`${config.script}`} showLineNumbers={false} showCharCount={false} {advancedClickAddon} on:output/>
{/if}