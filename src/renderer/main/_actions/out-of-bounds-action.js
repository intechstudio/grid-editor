export function outOfBounds(node, { reference, threshold, eventListeners }) {
  // Function to check if dimensions have changed
  const checkDimensions = () => {
    const rect1 = reference.getBoundingClientRect();
    const rect2 = node.getBoundingClientRect();

    if (
      rect2.right < rect1.right + threshold &&
      rect2.left > rect1.left + threshold &&
      rect2.top > rect1.top + threshold &&
      rect2.bottom < rect1.bottom + threshold
    ) {
      node.dispatchEvent(
        new CustomEvent("position-change", {
          detail:
            { inBounds: true }
        })
      );
    }
    else {
      node.dispatchEvent(
        new CustomEvent("position-change", {
          detail:
            { inBounds: false }
        })
      );
    }
  };

  // Use a MutationObserver to detect changes in the referenced element
  const observer = new MutationObserver(checkDimensions);

  // Set up the observer to watch for specific changes
  observer.observe(reference, {
    attributes: true, // Watch for attribute changes
    attributeFilter: ["style", "class", "width", "height"],
  });

  // Listen for the window resize event
  window.addEventListener("resize", checkDimensions);
  if (Array.isArray(eventListeners)) {
    eventListeners.forEach((listener, i) => {
      listener(() => {
        checkDimensions();
      });
    });
  }

  // Initial check of dimensions
  checkDimensions();
}
