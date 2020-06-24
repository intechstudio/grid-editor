export function layoutMenu(node, selectedDisplay) {

  
  function handleMenuOpen(e) {
    const id = e.target.id;

    console.log('context menu', e.target)
    
    // pbf4 + 10 chars long ids.
    if(id.length == 14){
      node.dispatchEvent(new CustomEvent('menu-open', {
        detail: {target: e.target.id}
      }));
      e.preventDefault();
      var contextElement = document.getElementById('context-menu');
      contextElement.style.top = e.clientY + "px";
      contextElement.style.left = e.clientX + "px";
    }
   
  }

  function handleMenuClose(e){
    node.dispatchEvent(new CustomEvent('menu-close', {
      detail: {target: e.target.id}
    }));
  }

  document.addEventListener('contextmenu', handleMenuOpen);
  document.addEventListener('click', handleMenuClose);
  
  return {
    update(selectedDisplay){
      if(selectedDisplay == 'settings'){
        document.removeEventListener('contextmenu', handleMenuOpen);
      document.removeEventListener('click', handleMenuClose);
      } else if(selectedDisplay == 'layout'){
        document.addEventListener('contextmenu', handleMenuOpen);
        document.addEventListener('click', handleMenuClose);
      }
    },
    destroy() {
      document.removeEventListener('contextmenu', handleMenuOpen);
      document.removeEventListener('click', handleMenuClose);
    }
  }
}