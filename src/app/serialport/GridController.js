// Template Parameter Event Assignment table.
const TPEA = {
  down: {
    desc: 'down',
    midi: 'DV7', 
    led: 'DV8'
  },
  up: {
    desc: 'up',
    midi: 'DV7',
    led: 'DV8'
  },
  value_change: {
    desc: 'value change',
    midi: 'AV7',
    led: 'AV8'
  }
}

export var GRID_CONTROLLER = {

  elementEvents: {
    button: [ TPEA.down, TPEA.up ],
    potentiometer: [ TPEA.value_change ],
    fader: [ TPEA.value_change ],
    blank: [],
    encoder: [ TPEA.down, TPEA.up, TPEA.value_change ]
  },

  moduleElements: {
    PO16: [
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer'
    ],
    PBF4: [
      'button', 'button', 'button', 'button', 
      'blank', 'blank', 'blank', 'blank', 
      'fader', 'fader', 'fader', 'fader', 
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer'
    ],
    BU16: [
      'button','button','button','button',
      'button','button','button','button',
      'button','button','button','button',
      'button','button','button','button'
    ],
    EN16: [
      'encoder', 'encoder', 'encoder', 'encoder',
      'encoder', 'encoder', 'encoder', 'encoder',
      'encoder', 'encoder', 'encoder', 'encoder',
      'encoder', 'encoder', 'encoder', 'encoder',
    ]
  },

  create: function(header, moduleType, virtual){

    if(moduleType !== undefined){

      var controller = {
        id: moduleType + '_' + 'dx:' + header.DX + ';dy:' + header.DY,
        dx: header.DX,
        dy: header.DY,
        alive: Date.now(),
        virtual: virtual,
        map: {
          top: {dx: header.DX, dy: header.DY+1},
          right: {dx: header.DX+1, dy: header.DY},
          bot: {dx: header.DX, dy: header.DY-1},
          left: {dx: header.DX-1, dy: header.DY},
        },
        rotation: header.ROT * -90,
        isConnectedByUsb: (header.DX == 0 && header.DX == 0) ? true : false,
        isLanding: false,
        elementSettings: this.createElementSettings(moduleType)
      }

      return controller;

    }

  },

  createElementSettings: function(moduleType){

    moduleType = moduleType.substr(0,4);

    let array = [];
    let events = [];
    for (let i = 0; i < 16; i++) {
      events = [];
      for (let j=0; j < this.elementEvents[this.moduleElements[moduleType][i]].length; j++) {
        events.push({
          controlElementType: this.moduleElements[moduleType][i],
          event: this.elementEvents[this.moduleElements[moduleType][i]][j],
          actions: []    
        })
      }
      array[i] = events;
    }
    return array;
  }
}


