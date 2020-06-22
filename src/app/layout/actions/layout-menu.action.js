export function layoutMenu(node) {

  function handleMenuOpen(e) {

    const id = e.target.id;

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
    destroy() {
      document.removeEventListener('contextmenu', handleMenuOpen);
      document.removeEventListener('click', handleMenuClose);

    }
  }
}