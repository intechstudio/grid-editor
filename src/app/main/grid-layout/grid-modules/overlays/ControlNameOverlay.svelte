<script>

  import { runtime } from '../../../../runtime/runtime.store.js';

  export let id;
  export let moduleWidth;
  export let rotation;
  export let bankActive;

  let overlayDesign; 

  $: breakpoint = moduleWidth > 200 ? 'large' : 'small';

  $: id.startsWith('PBF4') ? overlayDesign = '3x4' : overlayDesign = '4x4';

  let controlElementSettings;

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

  runtime.subscribe(runtime => {
    const device = runtime.find(controller => controller.id == id);
    if(device !== undefined) {
      controlElementSettings = device.pages[0].control_elements;
    }
  })

 

</script>

{#if overlayDesign == '4x4'}
  <div class="overlay text-white w-full">
    {#each control_block(4) as block }
      <div class="text-xs flex flex-col justify-around items-center" style="width: {moduleWidth / 4 +'px'}">
        {#each control_block(4) as element }
          <div class="text-xs flex flex-col items-center justify-center" style="height: {moduleWidth / 4 + 'px'}; transform: rotate({-1*rotation+'deg'})">
            {#if breakpoint == 'small' || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
              <div class="block font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(0,4)}</div>
            {:else if breakpoint == 'large' && controlElementSettings[element * 4 + block].controlElementName.length > 4}
              <div class="block p-0 m-0 font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(0,4)}</div>
              <div class="block p-0 m-0 font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(4,4)}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
{:else if overlayDesign == '3x4'}
  <div class="overlay text-white w-full">
    {#each control_block(4) as block }
      <div class="text-xs flex flex-col justify-around items-center" style="width: {moduleWidth / 4 +'px'}">
        {#each control_block(3) as element }
          <div class="text-xs flex flex-col items-center justify-center" style="height: {moduleWidth / 4 + 'px'}; transform: rotate({-1*rotation+'deg'})">
            {#if breakpoint == 'small' || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
              <div class="block font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(0,4)}</div>
            {:else if breakpoint == 'large' && controlElementSettings[element * 4 + block].controlElementName.length > 4}
              <div class="block p-0 m-0 font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(0,4)}</div>
              <div class="block p-0 m-0 font-mono">{controlElementSettings[element * 4 + block].controlElementName.substr(4,4)}</div>
            {/if}          
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/if}


<style>

  .overlay{
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    background-color: rgba(30 ,30,30,0.8);
    border-radius: 0.75rem;
    justify-content: space-around;
    backdrop-filter: blur(1px);
    z-index: 50;
  }

</style>