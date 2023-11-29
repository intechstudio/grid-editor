export function outOfBounds(node, { reference }) {
  if (typeof reference === "undefined") {
    return;
  }
  contains(node, reference);
}

function contains(e1, e2) {
  const rect1 = e1.getBoundingClientRect();
  const rect2 = e2.getBoundingClientRect();
  console.log(rect1, rect2);
}
