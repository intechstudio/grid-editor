import { cells } from './cells.store.js';

import { islanding } from './islanding.js';

import { get } from 'svelte/store';

export function dragndrop(node) {

  let centerCanBeRemoved = false;

  let modul = 'none';

  let dragValidity = true;
  let dragEvent = 'drop';

  let usedCells = [];
  let layoutCells = [];

  function handleDragStart(e) {

    usedCells = get(cells).used;
    layoutCells = get(cells).layout;

    modul = e.target.id;

    // NEED THIS BAD BOY, TO REBUILD AVAILABLE CELL IS DRAG IS INVALID
    let movedCell; 
    movedCell = usedCells.find(cell => cell.id === modul);

    // ISLANDING CHECK BEFORE GETTING FORWARD...
    let _islanding = false;
    if(movedCell != undefined){ 
      let islandingArray = islanding.testAllIslanding(usedCells);
      if(islandingArray.length > 0){ 
        islandingArray.forEach(c =>{
          if(c.id == movedCell.id){
            if(c.islanding == 1){
              _islanding = true;
            }
          }
        })
      }
    }

    // PART TO TELL IF IT'S "CENTER" OR CONNECTED BY USB
    let movable = true;
    let movedLayoutCell;
    movedLayoutCell = layoutCells.find((cell) => cell.id === modul);   
    if(movedLayoutCell != undefined){
      if(movedLayoutCell.isConnectedByUsb){
        movable = false;
      }
    }

    // ON DRAG START, REMOVE THE ELEMENT FROM THE USED CELLS.
    if(usedCells.length > 0){ 
      usedCells = usedCells.filter(cell => cell.id !== modul)
      let _usedCells = usedCells.filter(cell => cell !== undefined);
      cells.update(cell => {
        cell.used = _usedCells;
        cell.layout = layoutCells;
        return cell;
      })
    } 

    console.log('dnd', get(cells).used)

    if(movable && !_islanding){
      if(!(modul == 'drg-po16' || modul ==  'drg-po16' || modul ==  'drg-po16' || modul ==  'drg-po16')){ 
        e.target.style.opacity = '0.4';
      }   
      e.dataTransfer.setData("text", e.target.id);
      node.dispatchEvent(new CustomEvent('dnd-dragstart', {
        detail: {id: e.target.id, movedCell: movedCell}
      }));
      
      node.dispatchEvent(new CustomEvent('dnd-invalid', {detail: {center: false}}));
      node.addEventListener('dragover', handleDragOver);
      
    } else {

      dragValidity = false;

      cells.subscribe((cells)=>{ 
        (cells.used.length == 0 ) ? centerCanBeRemoved = true : centerCanBeRemoved = false 
      });


      if(centerCanBeRemoved){
        e.dataTransfer.setData("text", e.target.id);
        node.dispatchEvent(new CustomEvent('dnd-dragstart', {detail: {id: e.target.id, movedCell: movedCell}}));
        node.addEventListener('dragover', handleDragOver);
      } else {
        node.dispatchEvent(new CustomEvent('dnd-invalid', {detail: {center: true, id: e.target.id, movedCell: movedCell}}));
        node.removeEventListener('dragover', handleDragOver);
      }
      
      console.log('YADA not good + ', 'dragvalidity: ', dragValidity,'movable: ', movable)
    }
  }


  function handleDragOver(e){
        
    // DON'T ENABLE TO DROP ON AN OTHER MODULE
    if(e.target.children.length == 0){
     console.log("here is the shit")
      var data = e.target.id;
      if(data.startsWith('grid-cell-')){

        const id = e.target.id.substr(10,);

        const x = +id.split(';')[0].split(':').pop();
        const y = +id.split(';')[1].split(':').pop()

        // THERE ARE MODULES ON THE GRID, LET MODULE ONLY IF IT IS OK
        if(usedCells.length > 0){
          usedCells.forEach((cell)=>{
          for (const key in cell.map) {
            const coords = cell.map[key];
            if(coords.x == x && coords.y == y){
              //REFACTOR
              e.preventDefault();
              let cell = data.substr(10,);
              node.dispatchEvent(new CustomEvent('dnd-dragover', {
                detail: cell
              }));
              window.addEventListener('drop', handleDrop);
            }
          }
        })} else {
          // NO USEDCELL YET, SO THERE IS NO MODUL IN THE LAYOUT! ADD ONE!

          if(x == 0 && y == 0){
            
             //REFACTOR
            e.preventDefault();
            let cell = data.substr(10,);
            node.dispatchEvent(new CustomEvent('dnd-dragover', {
              detail: cell
            }));
            window.addEventListener('drop', handleDrop);

          }
        }  
        dragEvent = 'drop';
      }
      if(e.target.id == 'bin' && !modul.startsWith('drg')){
        e.preventDefault();
        console.log('it\'s the trash area', modul);
        dragEvent = 'remove';
        window.addEventListener('drop', handleDrop);
      } 
    } else{
      dragValidity = false;
    }
    window.addEventListener('dragend',handleDragEnd);
  }

  function handleDrop(e) {
    dragValidity = true;
    e.preventDefault();
    if(dragEvent == 'drop'){
      node.dispatchEvent(new CustomEvent('dnd-drop', {
        detail: {target: e.target, module: e.dataTransfer.getData("text")}
      }));
    }
    if(dragEvent == 'remove'){
      node.dispatchEvent(new CustomEvent('dnd-remove', {
        detail: {modul: modul}
      }));
    }
    window.removeEventListener('dragstart', handleDragStart);
    node.removeEventListener('dragover', handleDragOver);
    
  }

  function handleDragEnd(e){
    node.dispatchEvent(new CustomEvent('dnd-dragend', {
      detail: {id: e.target.id, dragValidity: dragValidity}
    }));
    e.target.style.opacity = 1.0;
    window.removeEventListener('drop', handleDrop);
  }

  node.addEventListener('dragstart', handleDragStart);
  
  return {
    destroy() {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragend', handleDragEnd);
    }
  }
}