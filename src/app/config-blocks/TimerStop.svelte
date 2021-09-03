<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gtp',
    name: 'TimerStop',
    groupType: 'standard',
    desc: 'Timer Stop',
    color: '',
    defaultLua: 'gtp()',
    icon: `
    t
    `
  }
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte'; 

  const dispatch = createEventDispatcher();

  function sendData(){
    dispatch('output', {short: 'gtp', script: 'gtp()'})
  }

  onMount(()=>{
    sendData();
  })
</script>


<timer-stop class="w-full flex flex-col text-white ">

  <div class="font-bold pl-2 py-1 rounded-b-lg">Timer Stop</div>

</timer-stop>