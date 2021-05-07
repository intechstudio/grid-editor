<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'cb',
    groupType: 'standard',
    desc: 'Code Block'
  }

</script>

<script>

  import CodeEditor from '../app/user-interface/code-editor/CodeEditor.svelte';


  export let action = {parameters: [], name: '', value: ''};;
  export let index;

</script>

<code-block class="w-full flex p-4">
  <CodeEditor on:output doc={action.script} {index} showCharCount={false}/>
</code-block>