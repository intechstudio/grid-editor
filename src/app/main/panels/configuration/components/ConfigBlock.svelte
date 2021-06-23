<script>
  import { createEventDispatcher } from "svelte";

  import grid from "../../../../protocol/grid-protocol";
  import stringManipulation from "../../../user-interface/_string-operations";

  const dispatch = createEventDispatcher();

  stringManipulation.initialize(grid.properties.LUA);


  export let config;
  export let index;

  console.log(grid.properties.LUA)

  function hijack(event){
    const script = stringManipulation.shortify(event.detail.script);
    console.log(event.detail.short, script);
    dispatch('output', {short: event.detail.short, script: script})
  }

  function humanify(script){

    const res = stringManipulation.humanize(script);

    // codeblock check, codeblock is wild!

    return res;
  }

</script>


<svelte:component 
  this={config.component} 
  {config} 
  humanScript={humanify(config.script, config.short)} 
  {index} 
  on:output={(e) => { hijack(e) }} 
  />

