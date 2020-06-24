export function select(node, [moduleId, selectedDisplay]){

  function handleMousedown(e) {
    //e.preventDefault();
    console.log('mousedown!', moduleId, e.target.parentElement.dataset)

  }
  
	return {
    update(args){
      if(args[1] == 'settings'){
        node.addEventListener('mousedown', handleMousedown);
      } else if(args[1] == 'layout'){
        node.removeEventListener('mousedown', handleMousedown);
      }
    },
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
  }
}