import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';

const instructions = {

  fetchConfigFromGrid: ({device, inputStore}) => {

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    inputStore.event.elementnumber != 16 ? enumber = inputStore.event.elementnumber : enumber = 255;

    const {serial, id} = grid.translate.encode(
      { 
        dx: device.dx, 
        dy: device.dy,
        rot: device.rot
      },
      "LOCAL",
      "CONFIG",
      "FETCH",
      [
        { VERSIONMAJOR: pParser(grid.properties.VERSION.MAJOR) },
        { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
        { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
        { PAGENUMBER: pParser(inputStore.event.pagenumber)}, 
        { ELEMENTNUMBER: pParser(enumber)}, 
        { EVENTTYPE: pParser(inputStore.event.eventtype)}, 
        { ACTIONLENGTH: pParser(0)},
      ],
    );

    serialComm.write(serial);

    return 1;
  },

  sendConfigToGrid: ({lua, li}) => {

    const {event, brc} = li;

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    event.elementnumber != 16 ? enumber = event.elementnumber : enumber = 255;

    const parameters = [
      { VERSIONMAJOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(enumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`<?lua ${lua.trim()} ?>`.length)},
      { ACTIONSTRING: `<?lua ${lua.trim()} ?>`}
    ]

    const {serial, id} = grid.translate.encode(brc, 'LOCAL', 'CONFIG', 'EXECUTE', parameters)

    serialComm.write(serial);

    return 1;
  },

  changeActivePage: ({li}) => {

    const {event, brc} = li;

    const parameters = [
      { PAGENUMBER: pParser(event.pagenumber) },
    ]

    const {serial, id}  = grid.translate.encode(brc, 'GLOBAL', 'PAGEACTIVE', 'EXECUTE', parameters)

    serialComm.write(serial);

    return 1;
  },

  fetchPageCountFromGrid: ({brc}) => {

    const {serial, id} = grid.translate.encode(
      {dx: brc.dx, dy: brc.dy, rot: brc.rot},
      "GLOBAL",
      "PAGECOUNT",
      "FETCH",
      ""
    );
    
    serialComm.write(serial);

    return 1;
  }

}

export default instructions;