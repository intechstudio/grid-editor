<script>
  import { createEventDispatcher } from "svelte";

  import grid from "../../../../protocol/grid-protocol";
  import stringManipulation from "../../../user-interface/_string-operations";

  const dispatch = createEventDispatcher();

  stringManipulation.initialize(grid.properties.LUA);

  export let config;
  export let index;

  //console.log(grid.properties.LUA)

  const decision = (short) => {
    return (short == 'cb' || short == 'l') ? true : false;
  }

  function hijack(event){

    let script = event.detail.script;
    
    const {short} = event.detail;
    
    if(decision(short)){
      const shorted = stringManipulation.shortify(script);
      shorted !== 'INVALID' ? script = shorted : null;
    }


    
    dispatch('output', {short: event.detail.short, script: script})
  }

  function humanify(config){
    // codeblock check, codeblock is wild, local is wild too!!
    if(decision(config.short)) {
      const script = stringManipulation.humanize(config.script);
      script !== 'INVALID' ?  config.script = script : null;
    }


    return config

  }

</script>


<svelte:component 
  this={config.component} 
  {index} 
  {config}
  on:output
/>

