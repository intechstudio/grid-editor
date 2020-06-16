import {cells} from './cells.store.js';

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
      e.dataTransfer.setData("text", e.target.id);
      node.dispatchEvent(new CustomEvent('dnd-dragstart', {
        detail: e.target.id
      }));
      node.addEventListener('dragover', handleDragOver)
    } else {

      dragValidity = false;

      cells.subscribe((array)=>{ 
        (array.length <= 5 ) ? centerCanBeRemoved = true : centerCanBeRemoved = false 
      });
    
      if(centerCanBeRemoved){
        e.dataTransfer.setData("text", e.target.id);
        node.dispatchEvent(new CustomEvent('dnd-dragstart', {detail: e.target.id}));
        node.addEventListener('dragover', handleCenterDragOver)
      } else {
        node.dispatchEvent(new CustomEvent('dnd-centerdrag', {
          detail: e.target.id
        }));
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
  }

  node.addEventListener('dragstart', handleDragStart);
  
  return {
    destroy() {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragend', handleDragEnd);
    }
  }
}