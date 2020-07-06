import {GRID_CONTROLLER} from '../serialport/GridController.js';

export var LAYOUT = {

  addToUsedgrid: function(grid, modul, id, virtual){

    if(id != 'bin'){

      const dx = +id.split(';')[0].split(':').pop();
      const dy = +id.split(';')[1].split(':').pop();

      var header = {
        DX: dx,
        DY: dy,
        ROT: 0,
      }

      let flag = true;

      const newModul = modul.substr(0,4);

      var cell = GRID_CONTROLLER.create(header, newModul, virtual)

      if(grid.used.length == 0){
        cell.isConnectedByUsb = true;
        grid.used.push(cell);
      }

      grid.used.map(c => { 
        if(c.id == modul){ 
          c.dx = cell.dx;
          c.dy = cell.dy;
          c.map = cell.map;
          flag = false; 
        } 
        return c;
      });

      if(flag){ 
        grid.used.push(cell); 
      }

      //return grid.used;
    }
  },

  createLayoutGrid: function(layout_grid){
    const L = (-1*((layout_grid-1)/2))
    let cellGen = [];
    for (let i = 0; i < layout_grid; i++) {
      for (let j = 0; j < layout_grid; j++) {
        cellGen.push({id: 'none', canBeUsed: false, dx: i+L, dy: j+L})
      }
    }
    return cellGen;
  },

  drawPossiblePlacementOutlines: function(grid, layout_grid){

    let layoutgrid = this.createLayoutGrid(layout_grid);
    
    let mapCoords = [];

    layoutgrid.forEach(layoutCell => {layoutCell.canBeUsed = false})

    grid.used.forEach(usedCell => {
      mapCoords.push({dx: usedCell.dx, dy: usedCell.dy});
      for (const key in usedCell.map) {
        mapCoords.push(usedCell.map[key])
      }
    });

    grid.used.forEach(usedCell => {
      layoutgrid.forEach(layoutCell => {
        if(layoutCell.dx == usedCell.dx && layoutCell.dy == usedCell.dy){
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

    layoutgrid.forEach(layoutCell => {
      uniqueMapCoords.forEach(map => {
        if(layoutCell.dx == map.dx && layoutCell.dy == map.dy){
          layoutCell.canBeUsed = true;
        }
      });
    });

    return layoutgrid;
  },

  removeSurroundingPlacementOutlines: function(grid, movedCell){

    let mapCoords = [];

    for (const key in movedCell.map) {
      mapCoords.push(movedCell.map[key])
    }

    grid.forEach((cell)=>{
      mapCoords.forEach((map)=>{
        if(cell.dx == map.dx && cell.dy == map.dy){
          cell.canBeUsed = false;
        }
      })
    })
    
    return grid;

  },

  removePossiblePlacementOutlines: function(grid){
    let layoutgrid = grid.layout.map(
      (layoutCell) => {
        layoutCell.canBeUsed = false; 
        return layoutCell;
      })
    return layoutgrid;
  },

  setUsbConnectedModule: function(grid, menuOnModuleWithId){

    // reset all.
    grid.used.forEach(usedCell => { usedCell.isConnectedByUsb = false });
    grid.layout.forEach(layoutCell => { layoutCell.isConnectedByUsb = false });

    // set the usb connected module in used grid.
    grid.used.forEach(usedCell => {
      if(usedCell.id == menuOnModuleWithId){
        usedCell.isConnectedByUsb = true;
      }
    });

    // update the layout with the new change on usb connected module.
    grid.layout.forEach(layoutCell => {
      grid.used.forEach(usedCell => {
        if(layoutCell.id == usedCell.id){
          layoutCell.isConnectedByUsb = usedCell.isConnectedByUsb;
        }
      });
    });

    return grid;
  },

  setModuleRotation: function(grid, menuOnModuleWithId, rotation){
    // update rotation in both arrays.

    grid.used.map((used)=>{
      if(used.id == menuOnModuleWithId){
        used.rotation = rotation;
      }
      return used;
    })

    grid.layout.map((layout)=>{
      if(layout.id == menuOnModuleWithId){
        layout.rotation = rotation;
      }
      return layout;
    })
    console.log(grid.layout)

    return grid;
  }

}
/**
exports.layout = {
  addToUsedgrid,
  createLayoutGrid,
  drawPossiblePlacementOutlines,
  removePossiblePlacementOutlines,
  removeSurroundingPlacementOutlines,
  setUsbConnectedModule,
  setModuleRotation
} 
*/