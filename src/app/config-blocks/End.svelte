<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'en',
    name: 'End',
    groupType: 'modifier',
    desc: 'End',
    icon: null
  }
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte'; 

  const dispatch = createEventDispatcher();

  function sendData(){
    dispatch('output', {short: 'en', script: 'end'})
  }

  onMount(()=>{
    sendData();
  })
</script>


<endif-block class="w-full flex flex-col text-white ">

  <div class="font-bold pl-2 py-1 bg-yellow-500 rounded-b-lg">END</div>

</endif-block>