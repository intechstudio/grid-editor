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
        { VERSIONMAJOR: pParser(grid.properties.VERSION.VERSIONMAJOR) },
        { VERSIONMINOR: pParser(grid.properties.VERSION.VERSIONMINOR) },
        { VERSIONPATCH: pParser(grid.properties.VERSION.VERSIONPATCH) },
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
      { VERSIONMAJOR: pParser(grid.properties.VERSION.VERSIONMINOR) },
      { VERSIONMINOR: pParser(grid.properties.VERSION.VERSIONMINOR) },
      { VERSIONPATCH: pParser(grid.properties.VERSION.VERSIONPATCH) },
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(event.elementnumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`<?lua ${lua.trim()} ?>`.length)},
      { ACTIONSTRING: `<?lua ${lua.trim()} ?>`}
    ]

    console.log('sendConfigToGrid',parameters[3], parameters[4]);

    const cfg = grid.translate.encode(brc, 'CONFIG', 'EXECUTE', parameters)

    console.log(String.fromCharCode.apply(String, cfg));

    serialComm.write(cfg);

    return 1;
  }

}

export default instructions;