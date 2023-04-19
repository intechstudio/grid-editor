/** Dispatch event on double click of node */
export function addOnDoubleClick(node) {
  const handleDblClick = (event) => {
    node.dispatchEvent(new CustomEvent("double-click"));

    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      //console.log('DBL', node, event.target)
    }
  };

  node.addEventListener("dblclick", handleDblClick, true);

  return {
    destroy() {
      node.removeEventListener("dblclick", handleDblClick, true);
    },
  };
}
