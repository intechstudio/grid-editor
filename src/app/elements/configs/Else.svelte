<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function sendData(){
    const script = 'else'; // important to set the function name
    dispatch('output', script)
  }

  onMount(()=>{
    sendData();
  })

</script>


<else-block class="w-full flex flex-col text-white">

  <div class="font-bold pl-2 py-1 bg-yellow-500">ELSE</div>

</else-block>