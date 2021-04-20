export function moveWindow(node) {
  
  let offset = [];
  let isDown = false;

  const threshold = 3;

  function handleMouseDown(e){
    isDown = true;
    offset = [
        node.offsetLeft - e.clientX,
        node.offsetTop - e.clientY
    ];
    node.addEventListener('mousemove', handleMouseMove)
  }

  function handleMouseMove(e){
    e.preventDefault();
    // smooth out drag start with threshold
    if(Math.abs(e.clientY - offset[1]) > threshold || Math.abs(e.clientX - offset[0]) > threshold){
      isDown += 1;
    }

    if (isDown > 2) {
        let mousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        node.style.left = (mousePosition.x + offset[0]) + 'px';
        node.style.top  = (mousePosition.y + offset[1]) + 'px';
    }
      
  }

  function handleMouseUp(e){

    isDown = 0;
    
    offset = [];

    node.removeEventListener('mousemove', handleMouseMove);
  }
  console.log(node);
  node.addEventListener('mousedown', handleMouseDown);
  node.addEventListener('mouseup', handleMouseUp);

  return {

    destroy() {

    }
  }
}