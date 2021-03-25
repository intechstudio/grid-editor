<script>
  import { actionPrefStore } from '../action-preferences.store';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  import { menuBoundaries } from '../boundaries.action';
  import Midi from './_actions/Midi.svelte';
  import Macro from './_actions/Macro.svelte';
  
  export let index = undefined;
  export let action = undefined;

  let topOffset = 0;

  const components = {
    MIDI: Midi,
  }


  const meta = {
    functions: [{desc:'if()', value: 'if'},{desc: 'abs()', value: 'abs'}, {desc: 'sqrt()', value: 'sqrt'}],
    operators: ['*', '+', '-', '/', '%', '(', ')', '==', '>', '<', '>=', '!='],
    variables: {
      global: [{desc: 'Bank Def Red', value: '255,0,0'},{desc: 'Active Bank', value: 'act-bank'},{desc: 'Next Bank', value: 'next-bank'}],
      element: [{desc: 'Absolute Change', value: 'abs-val'},{desc: 'Default Control Number', value: 'def-ctrl-num'},{desc: 'Relative Value', value: 'rel-chng'},{desc: 'Velocity Curve Param', value: 'vel-cv-p'}]
    }
  }

//$actionPrefStore.advanced.index == index && $actionPrefStore.advanced.visible
//     
// absolute
$: console.log('hi')

</script>


{#if $actionPrefStore.advanced.index == index && $actionPrefStore.advanced.visible}


<advanced-config class="relative w-full flex ">
  <container 
    id="action-menu"
    use:menuBoundaries
    on:offset-top={(e)=>{topOffset = e.detail;}} 
    style="right: calc(100% + 2rem);top:{-150 + topOffset}px;width:400px;height:600px;position:absolute;" 
    class=" shadow-md rounded-md bg-primary p-2 z-50">
    <wrapper 
      use:clickOutside
      on:click-outside={()=>{actionPrefStore.showAdvanced(index, false)}} 
      class="flex flex-col flex-grow h-full">
      <div class="p-2 text-gray-500 text-sm mb-1">Advanced Action Editing</div>

      <config-pool class="flex flex-wrap">
          <functions class="w-1/2 flex flex-col p-2">
            <span class="text-gray-500 text-sm">Functions</span>
            <div class="flex -ml-1 items-start flex-wrap">
              {#each meta.functions as func}
                <div class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{func.desc}</div>
              {/each}
            </div>
          </functions>

          <oparators class="w-1/2 flex flex-col p-2">
            <span class="text-gray-500 text-sm">Operators</span>
            <div class="flex -ml-1 items-start flex-wrap">
              {#each meta.operators as operator}
                <div class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{operator}</div>
              {/each}
            </div>
          </oparators>

          <element-variables class="w-1/2 flex flex-col p-2">
            <span class="text-gray-500 text-sm">Element Variables</span>
            <div class="flex -ml-1 items-start flex-wrap">
              {#each meta.variables.element as variable}
                <div class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{variable.desc}</div>
              {/each}
            </div>
          </element-variables>

          <global-variables class="w-1/2 flex flex-col p-2">
            <span class="text-gray-500 text-sm">Global Variables</span>
            <div class="flex -ml-1 items-start flex-wrap">
              {#each meta.variables.global as variable}
                <div class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{variable.desc}</div>
              {/each}
            </div>
          </global-variables>


      </config-pool>

      <svelte:component this={components[action.component]} advanced={true} on:output></svelte:component>

    </wrapper>

  </container>
    
</advanced-config>


{/if}

<style>


</style>