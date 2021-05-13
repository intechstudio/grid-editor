<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'el',
    groupType: 'modifier',
    desc: 'Else'
  }
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function sendData(){
    dispatch('output', {short: 'el', script: 'else'})
  }

  onMount(()=>{
    sendData();
  })

</script>


<else-block class="w-full flex flex-col text-white">

  <div class="font-bold pl-2 py-1 bg-yellow-500">ELSE</div>

</else-block>