<script context="module">
  // config descriptor parameters
  export const information = {
    short: '',
    groupType: '',
    desc: ''
  }
</script>

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


<endif-block class="w-full flex flex-col text-white ">

  <div class="font-bold pl-2 py-1 bg-yellow-500 rounded-b-lg">END</div>

</endif-block>