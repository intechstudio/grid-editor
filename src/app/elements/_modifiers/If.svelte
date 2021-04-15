<script>

  import CodeEditor from '../user-interface/code-editor/CodeEditor.svelte';

</script>


<if-block class="w-full flex flex-col text-white">

  <div class="font-bold pl-2 py-1 bg-black rounded-t-lg">IF</div>

  <div class="flex p-4">
    <CodeEditor showCharCount={false}/>
  </div>

</if-block>