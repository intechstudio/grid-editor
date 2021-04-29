export function changeOrder(node, {actions}) {
  
  let drag = 0;
  let pos = {x:0, y: 0};
  const threshold = 3;

  let shiftX;
  let shiftY;

  let cursor = undefined;
  let dragged = undefined;

  let multiDragFlag = undefined;

  let moveDisabled = false;

  let drag_block = [];

  let _actions  = actions;


  let selectionChange = false;

  function createMultiDragCursor(targets, width){
    cursor = document.createElement('div');
    let copyGroup = document.createElement('div');

    cursor.id = 'drag-n-drop-cursor';
    
    for (const item of targets) {
      const copy = item.cloneNode(true)
      copyGroup.appendChild(copy);
    }

    cursor.appendChild(copyGroup)

    cursor.style.opacity = '0.75';
    cursor.style.position = "absolute";
    cursor.style.userSelect = "none";
    cursor.style.display = "none"
    cursor.style.pointerEvents = "none";
    cursor.style.width = width +'px';

    // put in app, so it wont overflow!
    document.getElementById('app').append(cursor);
  }

  function createCursor(target, width){
    cursor = target.cloneNode(true);
    cursor.id = 'drag-n-drop-cursor';
    cursor.style.opacity = '0.75';
    cursor.style.position = "absolute";
    cursor.style.userSelect = "none";
    cursor.style.display = "none"
    cursor.style.pointerEvents = "none";
    cursor.style.width =  width + 'px';

    // put in app, so it wont overflow!
    document.getElementById('app').append(cursor);
  }

  function handleMouseDown(e){
    pos.x = e.clientX;
    pos.y = e.clientY;
    
    shiftX = e.clientX - e.target.getBoundingClientRect().left;
    shiftY = e.clientY - e.target.getBoundingClientRect().top;
   
    node.addEventListener('mousemove', handleMouseMove)
  }

  function handleSelectionChange(e){
    //selectionChange = true;
    console.log('selection change... ',document.getSelection());
  }

  function handleMouseMove(e){

    // variables
    const { id, clientHeight }  = e.target;

    // smooth out drag start with threshold
    if(Math.abs(e.clientY - pos.y) > threshold || Math.abs(e.clientX - pos.x) > threshold){
      drag += 1;
    }

    // emit dragstart only once, used to disabled pointer events
    if(drag == 1){
      console.log(e.target);

      node.dispatchEvent(new CustomEvent('drag-start'));      
    }

    // see if the target has movable attribute, so it can be moved...
    if(drag == 2){
      if(e.target.getAttribute('movable') == 'false' || e.target.getAttribute('movable') == undefined){
        moveDisabled = true;
        node.dispatchEvent(new CustomEvent('drag-end'));
        return;
      } 
    }

    // emit dragtarget once pointer events are disabled in drag mode
    if(drag == 2 && !moveDisabled){

      dragged = e.target;
      let _actionIds = [];
      // multidrag, added component type on dynamic wrapper
      // if component is enabled for multidrag, create multidragcursor and set multiDragFlag to true
      const component = dragged.getAttribute('action-component');

      if(component == 'IF'){
        let _id = id.substr(4,);
        const nodes = _actions.slice(_id);
        const end_of_if = nodes.findIndex(n => n.component === 'END');
        const drag_actions = nodes.slice(0,end_of_if + 1);
        multiDragFlag = true;
        for (const item of drag_actions) {
          // using actions array, so dom elements need to be discovered by custom id
          const drag_item = document.querySelectorAll(`[action-id="${item.id}"]`)[0];       
          // before starting cursor, set the "left behind" actions to half opacity
          drag_item.style.opacity = '0.2';
          // drag_block is a collection of action-ids, original gen unique key ids.
          drag_block.push(drag_item);
          // attribute "action-id" refers to initial keyed id of action
          _actionIds.push(item.id);
        }
        createMultiDragCursor(drag_block, dragged.clientWidth);
      } else {
        // the id "act" refers to dynamic index position and attribute "action-id" refers to initial keyed id of action
        _actionIds = [dragged.getAttribute('action-id')]; // this is used as an array, as multidrag is supported
        multiDragFlag = false;
        dragged.style.opacity = '0.2';
        createCursor(dragged);
      }

      node.dispatchEvent(new CustomEvent('drag-target', {
        detail: {id: _actionIds}
      }));

    }

    // drag over section
    if(drag >= 2 && !moveDisabled){
      cursor.style.display = "block";
      cursor.style.left = shiftX + e.pageX - shiftX + 'px';
      cursor.style.top = shiftY + e.pageY - shiftY + 'px';

      if(id){
        let drop_target = '';
        // if its a modifier, the below helper shouldn't be used!
        if(id.startsWith('act-') && e.target.getAttribute('action-component') !== 'IF' && e.target.getAttribute('action-component') !== 'THEN'){
          if((clientHeight / 2) < e.offsetY){
            drop_target = Number(id.substr(4,));
          } else {
            drop_target = Number(id.substr(4,)) - 1;
          }
        } else if(id.substr(0,3) == 'dz-'){  
          drop_target = Number(id.substr(3,));
        } else if(id == 'action-bin'){
          drop_target = 'bin';
        }

        if(e.target.getAttribute('action-component') == 'IF'){
          drop_target = Number(id.substr(4,)) - 1;
        };
        
        if(drop_target !== ''){
          node.dispatchEvent(new CustomEvent('drop-target', {
            detail: {drop_target}
          }));
        }
      }
    }
  }

  function handleMouseUp(e){
    if(!moveDisabled){
      if(drag){
        node.dispatchEvent(new CustomEvent('drop', {detail: {multi: multiDragFlag}}));
        node.dispatchEvent(new CustomEvent('anim-start'))
      }

      if(document.getElementById("drag-n-drop-cursor")) document.getElementById("drag-n-drop-cursor").remove();

      node.dispatchEvent(new CustomEvent('drag-end', {}));

      // for fade in animation end sequencing
      setTimeout(()=>{
        if(dragged) dragged.style.opacity = '1.0';
        if(drag_block) {
          for (const item of drag_block) {
            item.style.opacity = '1.0';
          }
        }
        drag_block = [];
        node.dispatchEvent(new CustomEvent('anim-end'))
      },300)
    }

    node.removeEventListener('mousemove', handleMouseMove);
    moveDisabled = false;
    drag = 0;
    pos = {x: 0, y: 0};
  }

  node.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('selectionchange', handleSelectionChange);

  return {

    update({actions}) {
      _actions = actions;
    },

    destroy() {
      document.removeEventListener('selectionchange',handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }
}