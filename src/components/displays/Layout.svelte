<script>

  export let size = 1.25;

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import DragModule from './DragModule.svelte';

  import { dragndrop } from './dnd.action.js';
  import { cells } from './cells.store.js';

  let layout = 7;

  $: cellSize = size * 106.6 + 10;

  let usedCells = []

  let current;
  let centerDrag = false;
  let centerDragHighlight = false;
  let movedCell;


  const genModulId = (id) => {
    return id + '_' + Math.random().toString(36).substr(2,9);
  }

  function handleDragStart(e){
    console.log('dragstart...',e.detail.movedCell)
    movedCell = e.detail.movedCell; // USED FOR handleDragEnd!!!
    drawPossiblePlacementOutlines()
  }

  function handleDragOver(e){
    e.preventDefault();
    current = e.detail;
  }

  function handleCenterDrag(e){
    centerDrag = e.detail.center;
    //console.log('handleCenterDrag',centerDrag)
    if(centerDrag){
      movedCell = e.detail.movedCell;
      console.log('centerdrag', movedCell);
      centerDragHighlight = true;
      setTimeout(()=>{
        centerDragHighlight = false;
      },750)
    }
  }

  function handleDrop(e){

    let id = e.detail.target.id;
    let modul = e.detail.module;

    if(e.detail.target.id !== 'bin'){
      if(modul == 'drg-po16' || modul ==  'bu16' || modul ==  'drg-pbf4' || modul ==  'en16'){
        var nodeCopy = document.getElementById(modul.substr(4,)).cloneNode(true);
        nodeCopy.id = genModulId(modul.substr(4,));
        modul = nodeCopy.id; // overwrite modul id if its a copy;
        e.detail.target.appendChild(nodeCopy);
      }else{
        e.detail.target.appendChild(document.getElementById(modul));
      }
    } else {
      document.getElementById(modul).remove();
    }

    addToUsedCells(modul, id);
    
  }

  function addToUsedCells(modul, id){

    if(id != 'bin'){

      const x = +id.split(';')[0].split(':').pop();
      const y = +id.split(';')[1].split(':').pop()

      var cell = {
        id: modul,
        coords:{ 
          x: x,
          y: y
        },
        map: {
          top: {x: x, y: y+1},
          right: {x: x+1, y: y},
          bot: {x: x, y: y-1},
          left: {x: x-1, y: y},
        }
      }

      if($cells.used.length == 0){ 
        $cells.used.push(cell);
      }

      let flag = true;

      $cells.used.forEach(c => { 
        if(c.id == cell.id){ 
          c.coords = cell.coords;
          c.map = cell.map;
          flag = false; 
        } 
      });

      if(flag){ 
        $cells.used.push(cell); 
      }

      $cells.used = $cells.used;
    }
  }

  function handleDelete(e){
    let modul = e.detail.modul;
    document.getElementById(modul).remove();
  }

  function handleDragEnd(e){
    // PUT BACK THE MODUL IF INVALID DRAG HAPPEND7
    console.log('drag end!',e.detail, movedCell)
    if(!e.detail.dragValidity && movedCell){
      $cells.used.push(movedCell);
      $cells = $cells;
    } 
    drawPossiblePlacementOutlines() 
    current = '';
  }

  function createLayoutGrid(){
    const L = (-1*((layout-1)/2))
    let cellGen = [];
    for (let i = 0; i < layout; i++) {
      for (let j = 0; j < layout; j++) {
        cellGen.push({id: 'none', canBeUsed: false, coords: { x: i+L, y: j+L}})
      }
    }
    $cells.layout = [...cellGen]
  }

  function drawPossiblePlacementOutlines(){
    
    let mapCoords = [];

    $cells.layout.forEach(layoutCell => {layoutCell.canBeUsed = false})

    $cells.used.forEach(usedCell => {
      mapCoords.push(usedCell.coords);
      for (const key in usedCell.map) {
        mapCoords.push(usedCell.map[key])
      }
    });

    const uniqueMapCoords = mapCoords.filter((cell, index) => {
      const _cell = JSON.stringify(cell);
      return index === mapCoords.findIndex(obj => {
        return JSON.stringify(obj) === _cell;
      });
    });

    $cells.layout.forEach(layoutCell => {
      uniqueMapCoords.forEach(map => {
        if(layoutCell.coords.x == map.x && layoutCell.coords.y == map.y){
          layoutCell.canBeUsed = true;
        }
      });
    });

    $cells.layout = $cells.layout;
  }

  createLayoutGrid()

</script>

<style>

  .cell{
    width: var(--cell-size);
    height: var(--cell-size);
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
    
  }

  .active{
    border: 2px dashed green !important;
  }

  .restricted-action{
    background-color:rgba(255, 0, 0, 0);
    border-radius: 10px;
    animation: restricedFade .5s ease-out forwards; 
  }

  .availableForPlacement{
    border: 1px solid black;
  }

  @keyframes restricedFade {
    0%,100% { background-color: rgba(255, 0, 0, 0);}
    50% { background-color: rgba(255, 0, 0, 1); }
  }

  @keyframes fadein {
    0%,100% { border-color: rgba(0, 255, 0, 0); }
    50% { border-color:rgba(0, 255, 0, 1); }
  }


</style>

<div class="relative overflow-hidden w-full flex flex-col h-full"
  use:dragndrop 
  on:dnd-dragover={handleDragOver}
  on:dnd-drop={handleDrop}
  on:dnd-delete={handleDelete}
  on:dnd-dragstart={handleDragStart}
  on:dnd-centerdrag={handleCenterDrag}
  on:dnd-dragend={handleDragEnd}
  >

  <div class="w-full flex flex-col absolute justify-start items-start">
    <div class="primary p-4 m-4 rounded-lg">   
      <DragModule/>     
    </div>
  </div>


  <div style="top:40%; left:50%;z-index:9999;" class="w-full h-full flex relative justify-center items-center">
    {#each $cells.layout as cell}
      <div 
      id="grid-cell-{'x:'+cell.coords.x+';y:'+cell.coords.y}" 
      style="--cell-size: {cellSize + 'px'}; top:{-1*(cell.coords.y*106.6*size*1.1) +'px'};left:{(cell.coords.x*106.6*size*1.1) +'px'};"
      class="cell"
      class:active={current == 'x:'+cell.coords.x+';y:'+cell.coords.y}
      class:availableForPlacement={cell.canBeUsed}
      class:restricted-action={centerDragHighlight && 'x:0;y:0' === 'x:'+cell.coords.x+';y:'+cell.coords.y}
      >
      </div>
    {/each}
    
  </div>

  <div class="w-full absolute bottom-0 right-0 flex justify-end items-center">
    <div class="m-4 relative primary text-gray-500 rounded-lg">
    <div id="bin" class="flex absolute h-full w-full"></div>
      <div class="flex flex-col justify-center items-center border border-dashed border-gray-800 p-4 h-40 w-40 m-2">
        <div class="p-2">Remove</div>
        <svg class="w-8 h-8" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 15V20H21V15" stroke="#a0aec0"/>
          <path fill="#a0aec0" d="M10.6464 13.3536C10.8417 13.5488 11.1583 13.5488 11.3536 13.3536L14.5355 10.1716C14.7308 9.97631 14.7308 9.65973 14.5355 9.46447C14.3403 9.2692 14.0237 9.2692 13.8284 9.46447L11 12.2929L8.17157 9.46447C7.97631 9.2692 7.65973 9.2692 7.46447 9.46447C7.2692 9.65973 7.2692 9.97631 7.46447 10.1716L10.6464 13.3536ZM10.5 0V13H11.5V0L10.5 0Z" />
        </svg> 
      </div>
    </div>
  </div>

</div>