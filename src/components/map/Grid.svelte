<script>

  export let size = 2;

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

  const genModulId = (id) => {
    return id + '_' + Math.random().toString(36).substr(2,9);
  }

  function handleDragOver(e){
    e.preventDefault();
    current = e.detail
  }

  function handleDrop(e){
    const id = e.detail.target.id.substr(10,)
    let modul = e.detail.module;
    if(modul == 'po16' || modul ==  'bu16' || modul ==  'pbf4' || modul ==  'en16'){
      console.log('It\'s a core module.', modul);
      var nodeCopy = document.getElementById(modul).cloneNode(true);
      nodeCopy.id = genModulId(modul);
      modul = nodeCopy.id; // overwrite modul id if its a copy;
      e.detail.target.appendChild(nodeCopy);
    }else{
      console.log('It\'s not a core modul.',modul);
      e.detail.target.appendChild(document.getElementById(e.detail.module));
    }

    e.detail.target.firstChild.style.opacity = '1.0';
    
    addToUsedCells(modul, id);
    
    expandGrid(id);
  }

  function addToUsedCells(modul, id){

    console.log(modul, id);

    var cell = {
      id: modul,
      coords:{
        x: +id.split(';')[0].split(':').pop(),
        y: +id.split(';')[1].split(':').pop()
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
    console.log('registered cell', usedCells)

    console.log(cell.coords.x * 106.6 * size)
  }

  function handleDragStart(e){
    if(usedCells.length > 1){
      usedCells = usedCells.filter(cell => cell.id !== e.detail);
      expandGrid(e.detail);
    }
  }

  function expandGrid(id){

    let cellGen = [];

    if(usedCells.length == 0){
      usedCells.push({
        id: id,
        coords: { 
          x: 0, 
          y: 0
        }
      })
    }

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

  .active{
    border: 2px solid green;
  }

  .controller{
    z-index: 10;
    position: relative;
  }


</style>

<div class="relative w-full flex"
  use:dragndrop 
  on:dnd-dragover={handleDragOver}
  on:dnd-drop={handleDrop}
  on:dnd-dragstart={handleDragStart}>

  <div class="w-1/5 flex flex-col justify-center items-center h-screen">
    <div id="po16" class="controller" draggable="true">
      <PO16 {size} />
    </div>

    <div id="pbf4" class="controller" draggable="true">
      <PBF4 {size} />
    </div>

  </div>

  <div class="w-4/5 h-screen flex justify-center items-center">
    {#each cells as cell}
      <div 
      id="grid-cell-{'x:'+cell.coords.x+';y:'+cell.coords.y}" 
      class="cell" 
      style="--cell-size: {cellSize + 'px'};margin-top:{cell.coords.x*106.6*size*2.085 +'px'};margin-left:{-1*(cell.coords.y*106.6*size*2.085)+'px'};"
      class:active={current === 'x:'+cell.coords.x+';y:'+cell.coords.y}  
      >
      
      </div>
    {/each}
  </div>
</div>