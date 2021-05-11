import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';

const instructions = {

  fetchConfigFromGrid: ({device, inputStore}) => {
    const cfg = grid.translate.encode(
      { 
        dx: device.dx, 
        dy: device.dy,
        rot: device.rot
      },
      "CONFIG",
      "FETCH",
      [
        { PAGENUMBER: pParser(0)}, 
        { ELEMENTNUMBER: pParser(inputStore.event.elementnumber)}, 
        { EVENTTYPE: pParser(inputStore.event.eventtype)}, 
        { ACTIONLENGTH: pParser(0)},
      ],
      ""
    );
    
    serialComm.write(cfg);

    return 1;
  },

  sendConfigToGrid: ({lua, li}) => {

    const {event, brc} = li;

    const parameters = [
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(event.elementnumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`<?lua ${lua} ?>`.length)},
      { ACTIONSTRING: `<?lua ${lua} ?>`}
    ]

    console.log('sendConfigToGrid',parameters);

    const cfg = grid.translate.encode(brc, 'CONFIG', 'EXECUTE', parameters)

    console.log(String.fromCharCode.apply(String, cfg));

    serialComm.write(cfg);

    return 1;
  }

}

export default instructions;