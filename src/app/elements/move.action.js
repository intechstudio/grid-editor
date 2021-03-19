export function changeOrder(node) {
  
  let drag = 0;
  let pos = {x:0, y: 0};
  const threshold = 3;

  let shiftX;
  let shiftY;

  let cursor = undefined;
  let dragged = undefined;

  function createCursor(target){
    cursor = target.cloneNode(true);
    cursor.id = 'drag-n-drop-cursor';

    cursor.style.position = "absolute";
    cursor.style.userSelect = "none";
    cursor.style.display = "none"
    cursor.style.pointerEvents = "none";
    cursor.style.width = target.clientWidth + 'px';

    document.body.append(cursor);
  }

  function handleMouseDown(e){
    pos.x = e.clientX;
    pos.y = e.clientY;
    
    shiftX = e.clientX - e.target.getBoundingClientRect().left;
    shiftY = e.clientY - e.target.getBoundingClientRect().top;
    
    node.addEventListener('mousemove', handleMouseMove)
  }

  function handleMouseMove(e){
    // smooth out drag start with threshold
    if(Math.abs(e.clientY - pos.y) > threshold || Math.abs(e.clientX - pos.x) > threshold){
      drag += 1;
    }

    // emit dragstart only once
    if(drag == 1){
      node.dispatchEvent(new CustomEvent('drag-start'));
    }

    // emit dragtarget once pointer events are disabled in drag mode
    if(drag == 2){
      dragged = e.target;
      node.dispatchEvent(new CustomEvent('drag-target', {
        detail: {id: e.target.getAttribute('action-id')}
      }));
      dragged.style.opacity = '0.5';
      createCursor(e.target);
    }

    // drag over section
    if(drag >= 2){

      const {id, clientHeight}  = e.target;
      
      cursor.style.display = "block";
      cursor.style.left = shiftX + e.pageX - shiftX + 'px';
      cursor.style.top = shiftY + e.pageY - shiftY + 'px';
      
      if(id){
        let drop_target = '';
        if(id.startsWith('act')){
          if((clientHeight / 2) < e.offsetY){
            drop_target = Number(id.substr(4,));
          } else {
            drop_target = Number(id.substr(4,)) - 1;
          }
        } else if(id.startsWith('dz')){  
          drop_target = Number(id.substr(3,));
        }

        node.dispatchEvent(new CustomEvent('drop-target', {
          detail: {drop_target}
        }));
      }
    }
}

  function handleMouseUp(e){

    node.removeEventListener('mousemove', handleMouseMove);

    if(drag){
      node.dispatchEvent(new CustomEvent('drop', {}));
      node.dispatchEvent(new CustomEvent('anim-start'))
    }

    drag = 0;
    
    pos = {x: 0, y: 0};

    if(document.getElementById("drag-n-drop-cursor")) document.getElementById("drag-n-drop-cursor").remove();

    node.dispatchEvent(new CustomEvent('drag-end', {}));

    setTimeout(()=>{
      dragged.style.opacity = '1.0';
      node.dispatchEvent(new CustomEvent('anim-end'))
    },300)
  }

  node.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);

  return {

    destroy() {

    }
  }
}