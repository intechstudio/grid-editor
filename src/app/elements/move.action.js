export function changeOrder(node) {

  let starter = undefined;

  function handleDragStart(e) {

    let target = e.target.id;

    e.target.style.opacity = '0.4';
      
    e.dataTransfer.setData("text", e.target.id);
      
    node.dispatchEvent(new CustomEvent('drag-start', {
        detail: {id: target}
    }));

    starter = target;
      
    node.addEventListener('dragover', handleDragOver);
  }

  function handleDragOver(e){
    let id = e.target.id;

    // if preventDefault() is note present, drop is not called
    

    // check if dropzone
    if(id.startsWith('dz-')){
      
      e.preventDefault();
      
      node.dispatchEvent(new CustomEvent('drag-over', {
        detail: {id}
      }));

      // this could be usefule to see if switch is imminent or not based on container heights
      //console.log('Drag-Over:', e.target.id, e.target.clientHeight, e.offsetY);
      node.addEventListener('dragend', handleDragEnd);
      node.addEventListener('drop', handleDrop);
      
    }
    
    
  }

  function handleDrop(e) {
    e.preventDefault();


    node.dispatchEvent(new CustomEvent('drag-drop', {
      detail: {target: e.target, transfer: e.dataTransfer.getData("text")}
    }));

    node.removeEventListener('dragover', handleDragOver);

  }

  function handleDragEnd(e){
    node.dispatchEvent(new CustomEvent('drag-end', {
      detail: {}
    }));
    e.target.style.opacity = 1.0;
    node.removeEventListener('drop', handleDrop);
  }

  node.addEventListener('dragstart', handleDragStart);

  return {

    destroy() {
      node.removeEventListener('drop', handleDrop);
      node.removeEventListener('dragend', handleDragEnd);
    }
  }
}