export function menuBoundaries(node, click) {

  let rect = undefined;

  function init(){
    rect = node.getBoundingClientRect();
    if(window.innerHeight - rect.bottom < 20){
      node.style.top = -250 + (window.innerHeight - rect.bottom) - 20 + 'px';
    }
  }

  function getSize(){
    const h = window.innerHeight;
    const topOffset = h - rect.bottom;

    // 20 as a "padding on bottom"
    if(topOffset < 20){
      node.dispatchEvent(new CustomEvent('offset-top', {detail: topOffset - 20}))
    }    
  }

  init();

  getSize();

  window.addEventListener('resize', getSize)

  return {

    update(){
      node.dispatchEvent(new CustomEvent('offset-top', {detail: topOffset - 20}))

    },

    destroy() {
      window.removeEventListener('resize', getSize)
    }
  }
}