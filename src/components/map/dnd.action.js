export function dragndrop(node) {

  function handleDragStart(e) {
    var data = e.target.id
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setData("text", data);
    window.addEventListener('dragover', handleDragOver)
  }

  function handleDragOver(e){
    e.preventDefault();
    var data = e.target.id
    if(data.startsWith('grid-cell-')){
      let cell = data.substr(10,);
      node.dispatchEvent(new CustomEvent('dnd-dragover', {
        detail: cell
      }));
      console.log(cell);
      window.addEventListener('drop', handleDrop);
    }else{
      console.log('else route',data);
    }
  
  }

  function handleDragLeave(e) {
    console.log('left drop area');
  }

  function handleDrop(e) {
    e.preventDefault();
    var data = e.dataTransfer.getData("text");
    e.target.appendChild(document.getElementById(data));
    node.dispatchEvent(new CustomEvent('drop', {
			detail: {data}
    }));
    
    window.removeEventListener('dragstart', handleDragStart);
    window.removeEventListener('dragover', handleDragOver);
  }

  node.addEventListener('dragstart', handleDragStart);
  
  return {
    destroy() {
      window.removeEventListener('drop', handleDrop);
    }
  }
}