export function dragndrop(node) {

  function handleDragStart(e) {
    var data = e.target.id
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.setData("text", data);
		window.addEventListener('drop', handleDrop);
  }

  function handleDrop(e) {
    e.preventDefault();
    //var data = e.dataTransfer.getData("text");
    var data = e.dataTransfer.getData("text");
    e.target.appendChild(document.getElementById(data));

    node.dispatchEvent(new CustomEvent('drop', {
			detail: {data}
    }));
    
    window.removeEventListener('dragstart', handleDragStart);
    
  }

  node.addEventListener('dragstart', handleDragStart);
  
  return {
    destroy() {
      window.removeEventListener('drop', handleDrop);
    }
  }
}