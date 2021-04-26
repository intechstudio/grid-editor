<script>
  import { onMount, createEventDispatcher } from 'svelte'; 

  const dispatch = createEventDispatcher();

  function sendData(){
    const script = 'end'; // important to set the function name
    dispatch('output', script)
  }

  onMount(()=>{
    sendData();
  })
</script>


<endif-block class="w-full flex flex-col text-white py-2">

  <div class="font-bold pl-2 py-1 bg-black rounded-b-lg">ENDIF</div>

</endif-block>