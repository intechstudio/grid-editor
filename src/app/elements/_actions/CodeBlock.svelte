<script>
  import CodeEditor from "../user-interface/code-editor/CodeEditor.svelte";

  export let action = {parameters: [], name: '', value: ''};;
  export let index;

</script>



<code-block class="w-full flex p-4">
  <CodeEditor on:output doc={action.script} {index} showCharCount={false}/>
</code-block>