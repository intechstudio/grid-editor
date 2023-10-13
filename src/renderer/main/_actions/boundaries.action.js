export function configListScrollSize(node, configs) {
  let rect = undefined;

  function getSize() {
    rect = node.getBoundingClientRect();

    node.dispatchEvent(
      new CustomEvent("height", {
        detail: `${rect.height - (rect.bottom - window.innerHeight) - 40}px`,
      })
    );
  }

  getSize();

  window.addEventListener("resize", getSize);

  return {
    update(configs) {
      getSize();
    },
    destroy() {
      window.removeEventListener("resize", getSize);
    },
  };
}
