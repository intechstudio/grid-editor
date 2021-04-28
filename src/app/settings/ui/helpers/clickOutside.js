/** Dispatch event on click outside of node */
export function clickOutside(node) {
  
  const handleClick = event => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      // here we could make a large array, about all the cases where the click outside shouldn't be triggered
      if(event.target.id !== 'show-advanced'){ 
        node.dispatchEvent(
          new CustomEvent('click-outside', node)
        )
      }
    }
  }

	document.addEventListener('click', handleClick, true);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
	}
}