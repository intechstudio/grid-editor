<script>

  export let size = 1.25;

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import DragModule from './DragModule.svelte';

  import { dragndrop } from './dnd.action.js';
  import { cells } from './cells.store.js';

  let usedCells = [];

  let layout = 7;

  $: cellSize = size * 106.6 + 10;

  let current;
  let centerDrag = false;
  let centerDragHighlight = false;
  let movedCell;


  const genModulId = (id) => {
    return id + '_' + Math.random().toString(36).substr(2,9);
  }

  function handleDragOver(e){
    e.preventDefault();
    current = e.detail;
  }

  function handleCenterDrag(e){
    centerDrag = e.detail.center;
    if(centerDrag){
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

  function handleDelete(e){
    let modul = e.detail.modul;
    console.log('delete',modul)
    document.getElementById(modul).remove();
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
          rigth: {x: x+1, y: y},
          bot: {x: x, y: y-1},
          left: {x: x-1, y: y},
        }
      }

      if(usedCells.length == 0){ 
        usedCells.push(cell);
      }

      let flag = true;

      usedCells.forEach(c => { 
        if(c.id == cell.id){ 
          c.coords = cell.coords;
          flag = false; 
        } 
      });

      if(flag){ 
        usedCells.push(cell); 
      }

      $cells.used = [...usedCells]
    }
  }

  function handleDragEnd(e){

    if(e.detail.dragValidity && movedCell){ 
      //expandGrid(movedCell.id);
    } else {
      if(!centerDrag && movedCell) {
        usedCells.push(movedCell)
        //expandGrid(movedCell.id)
      };
    }
    current = '';
 }
    

  function handleDragStart(e){
    movedCell = usedCells.find(cell => cell.id == e.detail);
    $cells.used = [...usedCells.filter(cell => cell.id !== e.detail)];
    //expandGrid(e.detail);
  }

  function createLayoutGrid(){
    const L = (-1*((layout-1)/2))
    let cellGen = [];
    for (let i = 0; i < layout; i++) {
      for (let j = 0; j < layout; j++) {
        cellGen.push({id: 'none', coords: { x: i+L, y: j+L}})
      }
    }
    $cells.layout = [...cellGen]
  }

  createLayoutGrid()

/*
  function expandGrid(id){   
    let cellGen = [];

    let array = [];
    if(usedCells.length == 0){ 
      cellGen.push({id: id, coords: { x: 0, y: 0}})
    } else {
      usedCells.forEach((cell,i) => {
        cellGen.push({id: 'none',coords:{x: cell.coords.x, y: cell.coords.y}}); // init values
        cellGen.push({id: 'none',coords:{x: cell.coords.x - 1, y: cell.coords.y}});
        cellGen.push({id: 'none',coords:{x: cell.coords.x, y: cell.coords.y + 1}});
        cellGen.push({id: 'none',coords:{x: cell.coords.x, y: cell.coords.y - 1}});
        cellGen.push({id: 'none',coords:{x: cell.coords.x + 1, y: cell.coords.y}});
      });    

      //console.log('stg-1',cellGen);

      usedCells.forEach((used, i)=>{
        cellGen.forEach(gen => {
          if(gen.coords.x == usedCells[i].coords.x && gen.coords.y == usedCells[i].coords.y){
            gen.id = usedCells[i].id;  
          }
        })
      })
    }
      const uniqueArray = cellGen.filter((cell, index) => {
        const _coords = JSON.stringify(cell.coords);
        return index === cellGen.findIndex(obj => {
          return JSON.stringify(obj.coords) === _coords;
        });
      });

      console.log(uniqueArray);

      $cells = uniqueArray;
  }
*/

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


  <div style="top:40%; left:50%;" class="w-full h-full flex relative justify-center items-center">
    {#each $cells.layout as cell}
      <div 
      id="grid-cell-{'x:'+cell.coords.x+';y:'+cell.coords.y}" 
      style="--cell-size: {cellSize + 'px'}; top:{-1*(cell.coords.y*106.6*size*1.1) +'px'};left:{(cell.coords.x*106.6*size*1.1) +'px'};"
      class="cell"
      class:active={current === 'x:'+cell.coords.x+';y:'+cell.coords.y}
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