function addToUsedCells(cells, modul, id){

  if(id != 'bin'){

    const x = +id.split(';')[0].split(':').pop();
    const y = +id.split(';')[1].split(':').pop()

    var cell = {
      id: modul,
      coords:{ 
        x: x,
        y: y
      },
      map: {
        top: {x: x, y: y+1},
        right: {x: x+1, y: y},
        bot: {x: x, y: y-1},
        left: {x: x-1, y: y},
      },
      islanding: -1,
      islandSearchStatus: -1,
      isConnectedByUsb: false
    }

    if(cells.used.length == 0){
      cell.isConnectedByUsb = true;
      cells.used.push(cell);
    }

    let flag = true;

    cells.used.map(c => { 
      if(c.id == cell.id){ 
        c.coords = cell.coords;
        c.map = cell.map;
        flag = false; 
      } 
      return c;
    });

    if(flag){ 
      cells.used.push(cell); 
    }

    return cells.used;
  }
}

function createLayoutGrid(grid){
  const L = (-1*((grid-1)/2))
  let cellGen = [];
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      cellGen.push({id: 'none', canBeUsed: false, coords: { x: i+L, y: j+L}})
    }
  }
  return cellGen;
}

function drawPossiblePlacementOutlines(cells, grid){

  let layoutCells = createLayoutGrid(grid);
  
  let mapCoords = [];

  layoutCells.forEach(layoutCell => {layoutCell.canBeUsed = false})

  cells.used.forEach(usedCell => {
    mapCoords.push(usedCell.coords);
    for (const key in usedCell.map) {
      mapCoords.push(usedCell.map[key])
    }
  });

  cells.used.forEach(usedCell => {
    layoutCells.forEach(layoutCell => {
      if(layoutCell.coords.x == usedCell.coords.x && layoutCell.coords.y == usedCell.coords.y){
        layoutCell.id = usedCell.id;
        layoutCell.isConnectedByUsb = usedCell.isConnectedByUsb;
        layoutCell.rotation = usedCell.rotation;
      }
    });
  });

  const uniqueMapCoords = mapCoords.filter((cell, index) => {
    const _cell = JSON.stringify(cell);
    return index === mapCoords.findIndex(obj => {
      return JSON.stringify(obj) === _cell;
    });
  });

  layoutCells.forEach(layoutCell => {
    uniqueMapCoords.forEach(map => {
      if(layoutCell.coords.x == map.x && layoutCell.coords.y == map.y){
        layoutCell.canBeUsed = true;
      }
    });
  });

  return layoutCells;
}

function removeSurroundingPlacementOutlines(cells, movedCell){

  let mapCoords = [];

  for (const key in movedCell.map) {
    mapCoords.push(movedCell.map[key])
  }

  cells.forEach((cell)=>{
    mapCoords.forEach((map)=>{
      if(cell.coords.x == map.x && cell.coords.y == map.y){
        cell.canBeUsed = false;
      }
    })
  })
  
  return cells;

}

function removePossiblePlacementOutlines(cells){
  let layoutCells = cells.layout.map(
    (layoutCell) => {
      layoutCell.canBeUsed = false; 
      return layoutCell;
    })
  return layoutCells;
}

function setUsbConnectedModule(cells, menuOnModuleWithId){

  // reset all.
  cells.used.forEach(usedCell => { usedCell.isConnectedByUsb = false });
  cells.layout.forEach(layoutCell => { layoutCell.isConnectedByUsb = false });

  // set the usb connected module in used cells.
  cells.used.forEach(usedCell => {
    if(usedCell.id == menuOnModuleWithId){
      usedCell.isConnectedByUsb = true;
    }
  });

  // update the layout with the new change on usb connected module.
  cells.layout.forEach(layoutCell => {
    cells.used.forEach(usedCell => {
      if(layoutCell.id == usedCell.id){
        layoutCell.isConnectedByUsb = usedCell.isConnectedByUsb;
      }
    });
  });

  return cells;
}

function setModuleRotation(cells, menuOnModuleWithId, rotation){

  // update rotation in both arrays.

  cells.used.map((used)=>{
    if(used.id == menuOnModuleWithId){
      used.rotation = rotation;
    }
    return used;
  })

  cells.layout.map((layout)=>{
    if(layout.id == menuOnModuleWithId){
      layout.rotation = rotation;
    }
    return layout;
  })
  console.log(cells.layout)

  return cells;
}


exports.layout = {
  addToUsedCells,
  createLayoutGrid,
  drawPossiblePlacementOutlines,
  removePossiblePlacementOutlines,
  removeSurroundingPlacementOutlines,
  setUsbConnectedModule,
  setModuleRotation
}