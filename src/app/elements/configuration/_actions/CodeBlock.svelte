<script>
  import AdvancedInput from "./advanced-input/AdvancedInput.svelte";

  export let action = {parameters: [], name: '', value: ''};;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  $: console.log('inputSet: ',inputSet)

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

<AdvancedInput on:change={()=>{sendData()}} {inputSet} {blockAddedOnClick} {index}/>