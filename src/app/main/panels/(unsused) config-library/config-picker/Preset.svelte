<script>
  import { presetManagement } from "../../../runtime/app-helper.store";
  import { conditionalConfigPlacement } from '../../../../runtime/runtime.store';

  import { createEventDispatcher } from 'svelte';

  import { addOnDoubleClick } from '../../../_actions/add-on-double-click';

  import {get} from 'svelte/store';

	export let configs;
  export let name;
  export let index;
  export let sub;

  let pick;
  let isSelected;

  const dispatch = createEventDispatcher();

  $: type = ["If", "Else If", "Else"].includes(name) ? 'modifier' : 'standard';

  function checkIfPlacementPossible(name){

    const active = get(conditionalConfigPlacement);

    if(!active) return name;

    // lookbefore
    const lookbefore = active.slice(0,index).reverse();
    // lookafter
    const lookafter = active.slice(index);

    let validPlacement = true;

    if(type == 'modifier'){
      const fmlb = lookbefore.find(a => a.information.rendering == 'modifier'); //firstModifierLookBefore
      const fmla = lookafter.find(a => a.information.rendering == 'modifier'); //firstModifierLookAfter

      if(name == 'Else'){
        try {     
          if((fmlb.information.desc == 'Else If' || fmlb.information.desc == 'If') && fmla.information.desc == 'End'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = false;
        }
      } else if(name == 'Else If'){
        try {     
          if(fmlb.information.desc == 'If' || fmlb.information.desc == 'Else If'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = false;
        }
      } else if(name == 'If'){
        try {     
          if(fmlb.information.desc == 'End' || fmla.information.desc == 'If'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = true; // no match found (no if block), then it's a valid placement
        }
      }

    }

    const returnHtml = `<span class="${validPlacement ? '' : 'text-red-500'}">${name}</span>`

    return returnHtml;
 
  }

  function changeFavourite(preset){
    preset.isFav = ! preset.isFav;
    selectedConfig.presets =  selectedConfig.presets
  }

  function pickAction(){
    presetManagement.selected_preset.update({sub: sub, name: name, configs: configs});
    isEqual();
  }

  function isEqual(){
    if(get(presetManagement.selected_preset).name == name && JSON.stringify(get(presetManagement.selected_preset).configs) == JSON.stringify(configs)){
      return true;
    }
    return false;
  }

</script>

<div on:click={pickAction} use:addOnDoubleClick on:double-click={()=>{pickAction(); dispatch('double-click')}} class="flex items-center my-1 cursor-pointer justify-between rounded-lg w-full {isEqual($presetManagement) ? 'bg-select text-white' : 'hover:bg-select-saturate-10 text-gray-50'}">
    <div class="flex items-center  py-1 px-2 " >
      <svg class="{isEqual($presetManagement) ? null : 'invisible'}" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#C9C8C8"/>
      </svg>
      <div class="pl-2">
        {@html checkIfPlacementPossible(name)}
      </div>
    </div>
    <div on:click|stopPropagation={()=>{}} class="rounded-full hover:bg-select-desaturate-20 mx-1">
      <svg class="fill-current {false ? 'text-yellow-300' : 'text-black'} w-6 h-6 p-1 " viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.892 0.25813C8.82614 0.101837 8.67149 0 8.5 0C8.32851 0 8.17386 0.101837 8.108 0.25813L5.96169 5.3518L0.390642 5.79266C0.219701 5.80619 0.0737906 5.9199 0.0207975 6.08089C-0.0321956 6.24187 0.0181361 6.41852 0.148375 6.52864L4.39292 10.1176L3.09615 15.4837C3.05635 15.6484 3.12083 15.8205 3.25956 15.92C3.3983 16.0195 3.58406 16.0268 3.73041 15.9386L8.5 13.063L13.2696 15.9386C13.4159 16.0268 13.6017 16.0195 13.7404 15.92C13.8792 15.8205 13.9436 15.6484 13.9039 15.4837L12.6071 10.1176L16.8516 6.52864C16.9819 6.41852 17.0322 6.24187 16.9792 6.08089C16.9262 5.9199 16.7803 5.80619 16.6094 5.79266L11.0383 5.3518L8.892 0.25813Z"/>
      </svg>
    </div>
</div>

<style>

</style>