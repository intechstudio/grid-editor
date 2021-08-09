<script>
import { onMount } from "svelte";

  import { midi_monitor_store } from "../../../runtime/runtime.store";

  let midiArray = [];

  onMount(()=>{

    midi_monitor_store.subscribe(values => {
      midiArray = values;
    });

  })

</script>



<div class="bg-primary h-full text-white p-4">

  Midi monitor coming here...

  <div class="flex flex-col">

  {#each midiArray as midi}
    <div>[{midi.sx},{midi.sy}] {midi.CHANNEL} {midi.COMMAND} {midi.PARAM1} {midi.PARAM2}</div>
  {/each}

</div>

</div>