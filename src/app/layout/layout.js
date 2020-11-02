import { GRID_CONTROLLER } from '../core/classes/GridController.js';
import { appSettings } from '../stores/app-settings.store.js';

import { get } from 'svelte/store';

const version = get(appSettings).version;

export var LAYOUT = {

  addToUsedgrid: function(grid, modul, id, virtual){

    if(id != 'bin'){

      const dx = +id.split(';')[0].split(':').pop();
      const dy = +id.split(';')[1].split(':').pop();

      var header = {
        dx: dx,
        dy: dy,
        rot: 0,
      }

      let flag = true;

      const newModul = modul.substr(0,4);

      var cell = GRID_CONTROLLER.create(header, {vmajor: version.major, vminor: version.minor, vpatch: version.patch}, newModul, virtual)

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

  addToRuntime: function(runtime, moduleId, cellId, isVirtual){
    
    if(cellId != 'bin'){

      const dx = +cellId.split(';')[0].split(':').pop();
      const dy = +cellId.split(';')[1].split(':').pop();

      var header = {
        dx: dx,
        dy: dy,
        rot: 0,
      }

      let flag = true;

      const newModul = moduleId.substr(0,4);

      var gridController = GRID_CONTROLLER.create(header, {vmajor: version.major, vminor: version.minor, vpatch: version.patch}, newModul, isVirtual)

      if(runtime.length == 0){
        gridController.isConnectedByUsb = true;
        runtime.push(gridController);
      }

      runtime.map(m => { 
        if(m.id == moduleId){ 
          m.dx = gridController.dx;
          m.dy = gridController.dy;
          m.map = gridController.map;
          flag = false; 
        } 
        return m;
      });

      if(flag){ 
        runtime.push(gridController); 
      }
      
      console.log(runtime);
    }
  },

  createLayoutGrid: function(layout_grid){
    const L = (-1*((layout_grid-1)/2))
    let cellGen = [];
    for (let i = 0; i < layout_grid; i++) {
      for (let j = 0; j < layout_grid; j++) {
        cellGen.push({id: '', canBeUsed: false, fwVersion: version, dx: i+L, dy: j+L})
      }
    }
    return cellGen;
  },

  drawPossiblePlacementOutlines: function(runtime, layout_grid){

    let layoutgrid = this.createLayoutGrid(layout_grid);
    
    let mapCoords = [];

    layoutgrid.forEach(layoutCell => {layoutCell.canBeUsed = false})

    runtime.forEach(gridController => {
      mapCoords.push({dx: gridController.dx, dy: gridController.dy});
      for (const key in gridController.map) {
        mapCoords.push(gridController.map[key])
      }
    });

    runtime.forEach(gridController => {
      layoutgrid.forEach(layoutCell => {
        if(layoutCell.dx == gridController.dx && layoutCell.dy == gridController.dy){
          layoutCell.id = gridController.id;
          layoutCell.isConnectedByUsb = gridController.isConnectedByUsb;
          layoutCell.fwVersion = gridController.fwVersion;
          layoutCell.rot = gridController.rot;
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

  removePossiblePlacementOutlines: function(layout){
    let layoutgrid = layout.map(
      (layoutCell) => {
        layoutCell.canBeUsed = false; 
        return layoutCell;
      })
    return layoutgrid;
  },

  setUsbConnectedModule: function(grid, menuOnModuleWithId){

    // reset all.
    grid.used.forEach(gridController => { gridController.isConnectedByUsb = false });
    grid.layout.forEach(layoutCell => { layoutCell.isConnectedByUsb = false });

    // set the usb connected module in used grid.
    grid.used.forEach(gridController => {
      if(gridController.id == menuOnModuleWithId){
        gridController.isConnectedByUsb = true;
      }
    });

    // update the layout with the new change on usb connected module.
    grid.layout.forEach(layoutCell => {
      grid.used.forEach(gridController => {
        if(layoutCell.id == gridController.id){
          layoutCell.isConnectedByUsb = gridController.isConnectedByUsb;
        }
      });
    });

    return grid;
  },

  setModuleRotation: function(grid, menuOnModuleWithId, rotation){
    // update rotation in both arrays.

    grid.used.map((used)=>{
      if(used.id == menuOnModuleWithId){
        used.rot = rot;
      }
      return used;
    })

    grid.layout.map((layout)=>{
      if(layout.id == menuOnModuleWithId){
        layout.rot = rot;
      }
      return layout;
    })
    console.log(grid.layout)

    return grid;
  }

}