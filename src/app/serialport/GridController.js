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
  },
  bank_init: {
    desc: 'bank init',
    midi: '',
    led: ''
  }
}

export var GRID_CONTROLLER = {

  elementEvents: {
    button: [ TPEA.bank_init, TPEA.down, TPEA.up ],
    potentiometer: [ TPEA.bank_init, TPEA.value_change ],
    fader: [ TPEA.bank_init, TPEA.value_change ],
    blank: [],
    encoder: [ TPEA.bank_init, TPEA.down, TPEA.up, TPEA.value_change ]
  },

  moduleElements: {
    PO16: [
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer'
    ],
    PBF4: [
      'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
      'fader', 'fader', 'fader', 'fader', 
      'button', 'button', 'button', 'button', 
      'blank', 'blank', 'blank', 'blank'
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

  create: function(header, heartbeat, moduleType, virtual){

    if(moduleType !== undefined){

      var controller = {
        id: moduleType + '_' + 'dx:' + header.DX + ';dy:' + header.DY,
        dx: header.DX,
        dy: header.DY,
        fwVersion: {
          major: heartbeat.VMAJOR,
          minor: heartbeat.VMINOR,
          patch: heartbeat.VPATCH
        },
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
        // this is a fkin big questionmark, as due to dynamic for loop moduleSettings buildup (4 banks) svelte said no.
        moduleSettings: {
          bank_0: this.createElementSettings(moduleType),
          bank_1: this.createElementSettings(moduleType),
          bank_2: this.createElementSettings(moduleType),
          bank_3: this.createElementSettings(moduleType),
        }
      }

      return controller;

    }

  },

  createElementSettings: function(moduleType){

    moduleType = moduleType.substr(0,4);

    let banks = {};
    let control_elements = [];
    let events = [];

    //banks
    //for (let b = 0; b < 4; b++) {   
    
      // control elements
      for (let i = 0; i < 16; i++) {
        events = [];
        let obj = {
          controlElementType: this.moduleElements[moduleType][i],
          controlElementName: '',
        }
        // events
        for (let j=0; j < this.elementEvents[this.moduleElements[moduleType][i]].length; j++) {
          events.push({        
            event: this.elementEvents[this.moduleElements[moduleType][i]][j], 
            // actions
            actions: []    
          })
        }
        control_elements[i] = {events: events, ...obj};
      }

      //banks['bank_'+b] = control_elements;

    //}
    
    return control_elements;
  }
    
}


