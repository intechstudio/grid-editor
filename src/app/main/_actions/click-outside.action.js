/** Dispatch event on click outside of node */
export function clickOutside(node, {useCapture = false}) {
  
  const handleClick = event => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(
        new CustomEvent('click-outside', node)
      )
    }
  }

	document.addEventListener('click', handleClick, useCapture);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, useCapture);
    }
	}
}