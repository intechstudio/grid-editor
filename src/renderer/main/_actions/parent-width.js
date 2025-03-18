/** Dispatch event on double click of node */
export function parentWidth(node) {
  let rect = undefined;

  function init() {
    rect = node.getBoundingClientRect();
    node.dispatchEvent(
      new CustomEvent("width-change", { detail: { width: rect.width } })
    );
  }

  const handleResize = (event) => {
    rect = node.getBoundingClientRect();

    node.dispatchEvent(
      new CustomEvent("width-change", { detail: { width: rect.width } })
    );
  };

  init();

  window.addEventListener("resize", handleResize, true);

  return {
    destroy() {
      window.removeEventListener("resize", handleResize, true);
    },
  };
}
