<script>

  import { layout } from '../layout.js';

  export let isMenuOpen = false;

  export let menuOnModuleWithId = '';

  export let cells = [];

</script>

<style>

#context-menu{
    position:fixed;
    z-index:9999;
    width:200px;
    transform:scale(0);
    transform-origin:top left;
  }
  
  #context-menu .item {
    padding: 8px 10px;
    font-size:15px;
    cursor: pointer;
    color:#eee;
  }

  #context-menu .item:hover{
    background-color: black;
  }

  #context-menu .item:first-child:hover {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }

  #context-menu .item:last-child:hover {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }

  #context-menu.active{
    transform:scale(1);
  }

</style>

<div 
  id="context-menu"
  class:active={isMenuOpen}
  class="rounded-lg primary border border-gray-700 shadow-lg"
  >
  <div class="item" on:click={()=> cells = layout.setUsbConnectedModule(cells,menuOnModuleWithId)}>USB Connected Module</div>
  <div class="item">Module Information</div>
</div>