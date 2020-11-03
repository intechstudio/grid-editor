// Template Parameter Event Assignment table.
const TPEA = {
  down: {
    desc: 'down',
    value: '4',
    code: 'DP'
  },
  up: {
    desc: 'up',
    value: '5',
    code: 'DR'
  },
  absolute_value_change: {
    desc: 'absolute value change',
    value: '1',
    code: 'AVC7'
  },
  init: {
    desc: 'bank init',
    value: '0',
    code: 'INIT'
  }
}

export var GRID_CONTROLLER = {

  elementEvents: {
    button: [ TPEA.init, TPEA.down, TPEA.up ],
    potentiometer: [ TPEA.init, TPEA.absolute_value_change ],
    fader: [ TPEA.init, TPEA.absolute_value_change ],
    blank: [],
    encoder: [ TPEA.init, TPEA.down, TPEA.up, TPEA.absolute_value_change ]
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

  create: function(header, version, moduleType, virtual){

    let controller = {
      // implement the module id rep / req
      id: "",
      dx: "",
      dy: "",
      fwVersion: {
        major: "",
        minor: "",
        patch: "",
      },
      alive: Date.now(),
      virtual: "",
      map: {
        top: {dx: "", dy: "",},
        right: {dx: "", dy: ""},
        bot: {dx: "", dy: ""},
        left: {dx: "", dy: ""},
      },
      rot: "",
      isConnectedByUsb: "",
      isLanding: "",
      banks: [], // consider naming to "local"
      global: ""
    }

    // generic check, code below if works only if all parameters are provided
    if(moduleType !== undefined && header !== undefined && version !== undefined && moduleType !== undefined && virtual !== undefined){
      
      controller = {
        // implement the module id rep / req
        id: moduleType + '_' + 'dx:' + header.dx + ';dy:' + header.dy,
        dx: header.dx,
        dy: header.dy,
        fwVersion: {
          major: version.vmajor,
          minor: version.vminor,
          patch: version.vpatch
        },
        alive: Date.now(),
        virtual: virtual,
        map: {
          top: {dx: header.dx, dy: header.dy+1},
          right: {dx: header.dx+1, dy: header.dy},
          bot: {dx: header.dx, dy: header.dy-1},
          left: {dx: header.dx-1, dy: header.dy},
        },
        rot: header.rot * -90,
        isConnectedByUsb: (header.dx == 0 && header.dx == 0) ? true : false,
        isLanding: false,
        banks: this.createElementSettings(moduleType), // consider naming to "local"
        global: {}
      }
      
    }
    
    return controller;

  },

  createElementSettings: function(moduleType){

    moduleType = moduleType.substr(0,4);

    let banks = [];

    //banks
    for (let b = 0; b < 4; b++) {  

      let control_elements = [];

      // control elements
      for (let i = 0; i < 16; i++) {
        let events = [];
        let obj = {
          controlElementType: this.moduleElements[moduleType][i],
          controlElementName: '',
        }
        // events
        for (let j=0; j < this.elementEvents[this.moduleElements[moduleType][i]].length; j++) {
          events.push({        
            event: this.elementEvents[this.moduleElements[moduleType][i]][j], 
            // actions // low level config string
            config: []
          })
        }
        control_elements[i] = {events: events, ...obj, };
      }

      banks[b] = control_elements;

    }

    return banks;
    
  },
    
}


