<script>

  export let size = 1;

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import {dragndrop} from './dnd.action.js';

  $: cells = [{
    //init cell
    id: 'none',
    coords: { 
      x: 0, 
      y:0
    } 
  }];

  let usedCells = [];

  $: rows = [0];
  $: columns = [0];

  $: cellSize = (size * 106.6) + 10;

  let current;
  let centerDrag = false;
  let movedCell;

  const genModulId = (id) => {
    return id + '_' + Math.random().toString(36).substr(2,9);
  }

  function handleDragOver(e){
    e.preventDefault();
    current = e.detail
  }

  function handleCenterDrag(e){
    centerDrag = true;
    setTimeout(()=>{
      centerDrag = false;
    },750)
  }

  function handleDrop(e){
    const id = e.detail.target.id.substr(10,)
    let modul = e.detail.module;
    if(modul == 'drg-po16' || modul ==  'bu16' || modul ==  'drg-pbf4' || modul ==  'en16'){
      var nodeCopy = document.getElementById(modul.substr(4,)).cloneNode(true);
      nodeCopy.id = genModulId(modul.substr(4,));
      modul = nodeCopy.id; // overwrite modul id if its a copy;
      e.detail.target.appendChild(nodeCopy);
    }else{
      e.detail.target.appendChild(document.getElementById(modul));
    }
    
    addToUsedCells(modul.substr(4,), id);
    expandGrid(id);
  }

  function addToUsedCells(modul, id){
    var cell = {id: modul,coords:{x: +id.split(';')[0].split(':').pop(),y: +id.split(';')[1].split(':').pop()}}
    if(usedCells.length == 0){ usedCells.push(cell);}
    let flag = true;
    usedCells.forEach(c => { if(c.id == cell.id){ c.coords = cell.coords;flag = false; } });
    if(flag){ usedCells.push(cell); }
  }

  function handleDragEnd(e){
    if(!e.detail.dragValidity){ 
      if(movedCell){
        usedCells.push(movedCell); 
        expandGrid(e.detail.id);
      } 
    }
    current = '';
  }

  function handleDragStart(e){
    if(usedCells.length > 1){
      movedCell = usedCells.find(cell => cell.id == e.detail);
      usedCells = usedCells.filter(cell => cell.id !== e.detail);
      expandGrid(e.detail);
    }
  }

  function expandGrid(id){

    let cellGen = [];

    if(usedCells.length == 0){ usedCells.push({id: id, coords: { x: 0, y: 0}})}

    usedCells.forEach((cell,i) => {
      cellGen.push({id: cell.id,coords:{x: cell.coords.x, y: cell.coords.y}}); // init values
      cellGen.push({id: cell.id,coords:{x: cell.coords.x - 1, y: cell.coords.y}});
      cellGen.push({id: cell.id,coords:{x: cell.coords.x, y: cell.coords.y + 1}});
      cellGen.push({id: cell.id,coords:{x: cell.coords.x, y: cell.coords.y - 1}});
      cellGen.push({id: cell.id,coords:{x: cell.coords.x + 1, y: cell.coords.y}});
    });    

    let cellGenCoords = [];

    const uniqueArray = cellGen.filter((cell, index) => {
      const _coords = JSON.stringify(cell.coords);
      return index === cellGen.findIndex(obj => {
        return JSON.stringify(obj.coords) === _coords;
      });
    });

    cells = [...uniqueArray];
  }

</script>

<style>

  .cell{
    width: var(--cell-size);
    height: var(--cell-size);
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
    border: 1px dashed black;
  }

  .controller{
    z-index: 10;
    position: relative;
    color:white;
  }

  .active{
    border: 2px dashed green;
    /*animation: fadein .5s ease-in-out forwards; */
  }

  .restricted-action{
    border:10px solid rgba(255, 0, 0, 0);
    border-radius: 10px;
    animation: restricedFade .5s ease-out forwards; 
  }

  @keyframes restricedFade {
    0%,100% { border-color: rgba(255, 0, 0, 0); }
    50% { border-color: rgba(255, 0, 0, 1); }
  }

  @keyframes fadein {
    0%,100% { border-color: rgba(0, 255, 0, 0); }
    50% { border-color:rgba(0, 255, 0, 1); }
  }


</style>

<div class="relative w-full flex flex-col h-full"
  use:dragndrop 
  on:dnd-dragover={handleDragOver}
  on:dnd-drop={handleDrop}
  on:dnd-dragstart={handleDragStart}
  on:dnd-centerdrag={handleCenterDrag}
  on:dnd-dragend={handleDragEnd}>

  <div class="w-full flex flex-col absolute justify-start items-start">
    <div class="primary p-4 m-4 rounded-lg">

      <div class="hidden">
        <div id="po16" class="controller cursor-pointer" draggable="true">
          <PO16 {size}/> 
        </div>
        <div id="pbf4" class="controller cursor-pointer" draggable="true">
          <PBF4 {size}/> 
        </div>
      </div>

      <div class="text-white pb-4">Drag Module</div>
      <div class="secondary flex rounded-lg">
        <div id="drg-po16" class="cursor-pointer text-white p-2" draggable="true">
          PO16
        </div>
        <div id="drg-pbf4" class="cursor-pointer text-white p-2" draggable="true">
          PBF4
        </div>
        <div id="po16" class="cursor-pointer text-white p-2" draggable="true">
          EN16
        </div>
        <div id="pbf4" class="cursor-pointer text-white p-2" draggable="true">
          BU16
        </div>
      </div>
    </div>
  </div>

  <div class="w-full h-full flex justify-center items-center">
    {#each cells as cell}
      <div 
      id="grid-cell-{'x:'+cell.coords.x+';y:'+cell.coords.y}" 
      style="--cell-size: {cellSize + 'px'};margin-top:{cell.coords.x*106.6*1.37 +'px'};margin-left:{-1*(cell.coords.y*106.6*1.37)+'px'};"
      class="cell"
      class:active={current === 'x:'+cell.coords.x+';y:'+cell.coords.y}
      class:restricted-action={centerDrag && 'x:0;y:0' === 'x:'+cell.coords.x+';y:'+cell.coords.y}
      >
      </div>
    {/each}
  </div>

  <div class="w-full flex justify-end items-center">
    <div class="text-black">Remove Module</div>
  </div>
</div>