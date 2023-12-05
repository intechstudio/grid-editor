export function inBounds(reference, node, threshold = 0) {
  if (typeof reference === "undefined" || typeof node === "undefined") {
    return;
  }
  const rect1 = reference.getBoundingClientRect();
  const rect2 = node.getBoundingClientRect();

  return rect2.bottom < rect1.bottom + threshold;
}
