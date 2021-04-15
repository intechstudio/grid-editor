<script>
  import CodeEditor from "../user-interface/code-editor/CodeEditor.svelte";

  export let action = {parameters: [], name: '', value: ''};;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  function sendData(){

    let valid = true;
    
    if(valid){
      dispatch('output', { 
        action: {
          value: action.value, 
          parameters: action.parameters
        }, 
        index: index 
      });
    }
  }

</script>



<code-block class="w-full flex p-4">
  <CodeEditor on:output doc={action.script} {index} showCharCount={false}/>
</code-block>