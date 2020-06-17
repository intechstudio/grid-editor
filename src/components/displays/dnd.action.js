import { cells } from './cells.store.js';

import { get } from 'svelte/store';

export function dragndrop(node) {

  let centerCanBeRemoved = false;

  let modul = 'none';

  let dragValidity = true;

  function handleDragStart(e) {

    modul = e.target.id;
    let cell = e.target.offsetParent.id.substr(10,);

    if(cell !== 'x:0;y:0'){
      if(!(modul == 'drg-po16' || modul ==  'drg-po16' || modul ==  'drg-po16' || modul ==  'drg-po16')){ 
        e.target.style.opacity = '0.4';
      }

      if(cell) {
        const x = +cell.split(';')[0].split(':').pop(); 
        const y = +cell.split(';')[1].split(':').pop();
      
        let island = {
          mRight: false,
          mLeft: false,
          mTop: false,
          mBot: false
        }
  
        const localArray = get(cells);
  
        //console.log(localArray);
  
        localArray.forEach((cell) => {
          if(cell.coords.x == x-1 && cell.coords.y == y && cell.id !== 'none'){
            island.mLeft = true;
          }
          if(cell.coords.x == x+1 && cell.coords.y == y && cell.id !== 'none'){
            island.mRight = true;
          }
          if(cell.coords.y == y-1 && cell.coords.x == x && cell.id !== 'none'){
            island.mBot = true;
          }
          if(cell.coords.y == y+1 && cell.coords.x == x && cell.id !== 'none'){
            island.mTop = true;
          }
        })
        //console.log(island, modul, cell)
      }

      e.dataTransfer.setData("text", e.target.id);
      node.dispatchEvent(new CustomEvent('dnd-dragstart', {
        detail: e.target.id
      }));
      node.dispatchEvent(new CustomEvent('dnd-centerdrag', {detail: {center: false}}));
      node.addEventListener('dragover', handleDragOver);
    } else {
      dragValidity = false;
      cells.subscribe((array)=>{ 
        (array.length <= 5 ) ? centerCanBeRemoved = true : centerCanBeRemoved = false 
      });
      if(centerCanBeRemoved){
        e.dataTransfer.setData("text", e.target.id);
        node.dispatchEvent(new CustomEvent('dnd-dragstart', {detail: e.target.id}));
        node.addEventListener('dragover', handleCenterDragOver);
      } else {
        node.dispatchEvent(new CustomEvent('dnd-centerdrag', {detail: {center: true}}));
      }
      
    }
  }


  function handleCenterDragOver(e){
    var target = e.target.id;
    if(target == 'bin'){
      e.preventDefault();
      window.addEventListener('drop', handleDrop);
    }
  }

  function handleDragOver(e){
    if(e.target.children.length == 0){
      var data = e.target.id;
      if(data.startsWith('grid-cell-')){
        e.preventDefault();
        let cell = data.substr(10,);
        node.dispatchEvent(new CustomEvent('dnd-dragover', {
          detail: cell
        }));
        window.addEventListener('drop', handleDrop);
      }
      if(e.target.id == 'bin' && !modul.startsWith('drg')){
        e.preventDefault();
        console.log('it\'s the trash area', modul)
      } 
    } else{
      dragValidity = false;
    }
    window.addEventListener('dragend',handleDragEnd);
  }

  function handleDrop(e) {
    dragValidity = true;
    e.preventDefault();
    node.dispatchEvent(new CustomEvent('dnd-drop', {
			detail: {target: e.target, module: e.dataTransfer.getData("text")}
    }));

    window.removeEventListener('dragstart', handleDragStart);
    node.removeEventListener('dragover', handleCenterDragOver)
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