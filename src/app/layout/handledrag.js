let current;
let movedCell;

const genModulId = (id) => {
  return id + '_' + Math.random().toString(36).substr(2,9);
}

function start(e){
  // Save moved cell data for drag end.
  movedCell = e.detail.movedCell || ''; 
  return movedCell;
}

function over(e){
  e.preventDefault();
  current = e.detail;
  // Current represents the coords of the cell, where modul can be dropped, highlight goes green.
  return current;
}

function invalid(e){
  const centerDrag = e.detail.center;
  if(centerDrag){
    movedCell = e.detail.movedCell;
    let centerDragHighlight = true;
    return {movedCell:movedCell,centerDragHighlight: centerDragHighlight};
  }
}

function drop(e){

  let id = e.detail.target.id;
  let modul = e.detail.module;

  if(e.detail.target.id !== 'bin'){
    if(modul == 'drg-PO16' || modul ==  'drg-BU16' || modul ==  'drg-PBF4' || modul ==  'drg-EN16'){
      var nodeCopy = document.getElementById(modul.substr(4,)).cloneNode(true);
      nodeCopy.id = modul.substr(4,) + '_' + id.substr(10,);
      //console.log(nodeCopy.id);
      modul = nodeCopy.id; // overwrite modul id if its a copy;
      //e.detail.target.appendChild(nodeCopy);
    }else{
      //e.detail.target.appendChild(document.getElementById(modul));
    }
  } else {
    document.getElementById(modul).remove();
  }

  // We are generating ID on dropping for the new module. This has to be returned, so it can be added to usedcells.
  return {modul: modul, id: id}

  //addToUsedCells(modul, id);
  
}

function remove(e){
  let modul = e.detail.modul;
  return {modul: modul}
}

function end(e){
  current = '';
  // Current is set back to default.
  return {current: current};
}

exports.handledrag = {
  genModulId,
  start,
  over,
  invalid,
  end,
  drop,
  remove
}