export function dragndrop(node) {

  function handleDragStart(e) {
    let modul = e.target.id;
    let cell = e.target.offsetParent.id.substr(10,);
    if(cell !== 'x:0;y:0'){
      if(!(modul == 'po16' || modul ==  'bu16' || modul ==  'pbf4' || modul ==  'en16')){ 
        e.originalTarget.style.opacity = '0.4';
      }
      e.dataTransfer.setData("text", e.target.id);
      node.dispatchEvent(new CustomEvent('dnd-dragstart', {
        detail: e.target.id
      }));
      node.addEventListener('dragover', handleDragOver)
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
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    node.dispatchEvent(new CustomEvent('dnd-drop', {
			detail: {target: e.target, module: e.dataTransfer.getData("text")}
    }));
    window.removeEventListener('dragstart', handleDragStart);
    node.removeEventListener('dragover', handleDragOver);
  }

  node.addEventListener('dragstart', handleDragStart);
  
  return {
    destroy() {
      window.removeEventListener('drop', handleDrop);
    }
  }
}