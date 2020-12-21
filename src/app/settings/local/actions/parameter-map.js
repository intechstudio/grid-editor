
const build_array = () => {
  let arr = [];
  for (let i = 0; i < 16; i++) {
    arr[i] = {value: Number(i+1), info: `${'Ch. ' + Number(i+1)}`}
  }
  return arr;
}

export const buildOptionList = function(elementInfo, eventInfo, action, filter){
  const eventType = eventInfo.code;
  const actionName = action.value;
  const elementType = elementInfo.substr(0,1).toUpperCase();
  let options = [];

  if(actionName == "MIDIRELATIVE"){

    // BUTTON
    if(elementType == "B" || elementType == "E"){
      if(eventType == "DP" || eventType == "DR" || (eventType == "INIT" && elementType == "B")){
        options =  [
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'B0', info: 'Control Number'}, 
            {value: 'B1', info: 'Reversed Control Number'}
          ],[
            {value: 'B2', info: 'Control Value'},
            {value: 'B3', info: 'Toggle 2-step'},
            {value: 'B4', info: 'Toggle 3-step'}
          ]
        ]
      }
    }

    // ENCODER
    if(elementType == "E"){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'E0', info: 'Default Control Number'}, 
            {value: 'E1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'E2', info: 'Encoder Absolute Value'},
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
      if(eventType == 'ENCPUSHROT'){
        options =  [
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'E0', info: 'Default Control Number'}, 
            {value: 'E1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
    }

    // POTENTIOMETER || FADER
    if(elementType == "P" || elementType == "F"){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'P0', info: 'Default Control Number'}, 
            {value: 'P1', info: 'Reversed Control Number'},
          ],
          [
            {value: 'P2', info: 'Absolute Value'},
          ]
        ]
      }
    }

  }


  if(actionName == "MIDIABSOLUTE"){

    // BUTTON
    if(elementType == "B" || elementType == "E"){
      if(eventType == "DP" || eventType == "DR" || (eventType == "INIT" && elementType == "B")){
        options =  [
          build_array(),
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'B0', info: 'Control Number'}, 
            {value: 'B1', info: 'Reversed Control Number'}
          ],[
            {value: 'B2', info: 'Control Value'},
            {value: 'B3', info: 'Toggle 2-step'},
            {value: 'B4', info: 'Toggle 3-step'}
          ]
        ]
      }
    }

    // ENCODER
    if(elementType == "E" ){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          build_array(),
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'E0', info: 'Default Control Number'}, 
            {value: 'E1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'E2', info: 'Encoder Absolute Value'},
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
      if(eventType == 'ENCPUSHROT'){
        options =  [
          build_array(),
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'E0', info: 'Default Control Number'}, 
            {value: 'E1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
    }

    // POTENTIOMETER || FADER
    if(elementType == "P" || elementType == "F"){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          build_array(),
          [
            {value: '176', info: 'Control Change'}, 
            {value: '144', info: 'Note On'}, 
            {value: '128', info: 'Note Off'}
          ],
          [
            {value: 'P0', info: 'Default Control Number'}, 
            {value: 'P1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'P2', info: 'Absolute Value'},
          ]
        ]
      }
    }

  }

  if(actionName == "LEDCOLOR"){

    // BUTTON
    if(elementType == "B" || elementType == "E"){
      if(eventType == "DP" || eventType == "DR" || (eventType == "INIT" && elementType == "B")){
        options =  [
          [
            {value: 'B0', info: 'This LED'}, 
            {value: 'B1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'}, 
          ],
          [
            {value: 'Z1', info: 'Def Red Color'}, 
          ],
          [
            {value: 'Z2', info: 'Def Green Color'}, 
          ],
          [
            {value: 'Z3', info: 'Def Blue Color'}, 
          ]
        ]
      }
    }

    // ENCODER
    if(elementType == "E"){
      if(eventType == "AVC7" || eventType == 'ENCPUSHROT' || eventType == "INIT"){
        options =  [
          [
            {value: 'E0', info: 'This LED'}, 
            {value: 'E1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'}, 
          ],
          [
            {value: 'Z1', info: 'Def Red Color'}, 
          ],
          [
            {value: 'Z2', info: 'Def Green Color'}, 
          ],
          [
            {value: 'Z3', info: 'Def Blue Color'}, 
          ]
        ]
      }
    }

    // POTENTIOMETER || FADER
    if(elementType == "P" || elementType == "F"){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          [
            {value: 'P0', info: 'This LED'}, 
            {value: 'P1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'}, 
          ],
          [
            {value: 'Z1', info: 'Def Red Color'}, 
          ],
          [
            {value: 'Z2', info: 'Def Green Color'}, 
          ],
          [
            {value: 'Z3', info: 'Def Blue Color'}, 
          ]
        ]
      }
    }

  }

  if(actionName == "LEDPHASE"){

    // BUTTON
    if(elementType == "B" || elementType == "E"){
      if(eventType == "DP" || eventType == "DR" || (eventType == "INIT" && elementType == "B")){
        options =  [
          [
            {value: 'B0', info: 'This LED'}, 
            {value: 'B1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'},  
          ],
          [
            {value: 'B2', info: 'Control Value'},
            {value: 'B3', info: 'Toggle 2-step'},
            {value: 'B4', info: 'Toggle 3-step'}
          ]
        ]
      }
    }

    // ENCODER
    if(elementType == "E"){
      if(eventType == "AVC7" || eventType == "INIT" || eventType == 'ENCPUSHROT'){
        options =  [
          [
            {value: 'E0', info: 'This LED'}, 
            {value: 'E1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'},  
          ],
          [
            {value: 'E2', info: 'Encoder Absolute Value'},
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
      if(eventType == 'ENCPUSHROT'){
        options =  [
          [
            {value: 'E0', info: 'This LED'}, 
            {value: 'E1', info: 'Reversed LED'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'},  
          ],
          [
            {value: 'E5', info: 'Encoder Relative Change'},
          ]
        ]
      }
    }

    // POTENTIOMETER || FADER
    if(elementType == "P" || elementType == "F"){
      if(eventType == "AVC7" || eventType == "INIT"){
        options =  [
          [
            {value: 'P0', info: 'This LED.'}, 
            {value: 'P1', info: 'Reversed LED.'}, 
          ],
          [
            {value: '1', info: 'A Layer'}, 
            {value: '2', info: 'B Layer'},  
          ],
          [
            {value: 'P2', info: 'Absolute Value'},
          ]
        ]
      }
    }
    
  }

  if(actionName == 'HIDKEYMACRO' || actionName == 'HIDKEYBOARD'){
    // BUTTON
    if(elementType == "B" || elementType == "E"){
      if(eventType == "DP" || eventType == "DR" || eventType == 'ENCPUSHROT' || (eventType == "INIT" && elementType == "B")){
        // MODIFIER
        if(filter == 1){
          options = [
            [
              {value: '0x00', info: 'none'},
              {value: '0x01', info: 'left ctrl'},
              {value: '0x02', info: 'left shift'},
              {value: '0x04', info: 'left alt'},
              {value: '0x08', info: 'left ui'},
              {value: '0x10', info: 'right ctrl'},
              {value: '0x20', info: 'right shift'},
              {value: '0x40', info: 'right alt'},
              {value: '0x80', info: 'right ui'}
            ]
          ]
          
        }
        // NOT MODIFIER
        if(filter == 0) {
          options =  [
            [
              {value: 30, info: 1},
              {value: 31, info: 2},
              {value: 32, info: 3},
              {value: 33, info: 4},
              {value: 34, info: 5},
              {value: 35, info: 6},
              {value: 36, info: 7},
              {value: 37, info: 8},
              {value: 38, info: 9},
              {value: 39, info: 0},
              {value: '0x04', info: 'A'},
              {value: '0x05', info: 'B'},
              {value: '0x06', info: 'C'},
              {value: '0x07', info: 'D'},
              {value: '0x08', info: 'E'},
              {value: '0x09', info: 'F'},
              {value: '0x0A', info: 'G'},
              {value: '0x0B', info: 'H'},
              {value: '0x0C', info: 'I'},
              {value: '0x0D', info: 'J'},
              {value: '0x0E', info: 'K'},
              {value: '0x0F', info: 'L'},
              {value: '0x10', info: 'M'},
              {value: '0x11', info: 'N'},
              {value: '0x12', info: 'O'},
              {value: '0x13', info: 'P'},
              {value: '0x14', info: 'Q'},
              {value: '0x15', info: 'R'},
              {value: '0x16', info: 'S'},
              {value: '0x17', info: 'T'},
              {value: '0x18', info: 'U'},
              {value: '0x19', info: 'V'},
              {value: '0x1A', info: 'W'},
              {value: '0x1B', info: 'X'},
              {value: '0x1C', info: 'Y'},
              {value: '0x1D', info: 'Z'},
              {value: 40, info: 'enter'},
              {value: 41, info: 'escape'},
              {value: 42, info: 'backspace'},
              {value: 43, info: 'tab'},
              {value: 44, info: 'spacebar'},
              {value: 45, info: 'underscore or _'},
              {value: 46, info: 'plus or +'},
              {value: 47, info: 'open bracket or {'},
              {value: 48, info: 'close bracket or }'},
              {value: 49, info: 'backslash or \''},
              {value: 50, info: 'hash or #'},
              {value: 51, info: 'colon or :'},
              {value: 52, info: 'quote or "'},
              {value: 53, info: 'tilde or ~'},
              {value: 54, info: 'comma or ,'},
              {value: 55, info: 'dot or .'},
              {value: 56, info: 'slash or /'},
              {value: 57, info: 'caps lock'},
              {value: 58, info: 'F1'},
              {value: 59, info: 'F2'},
              {value: 60, info: 'F3'},
              {value: 61, info: 'F4'},
              {value: 62, info: 'F5'},
              {value: 63, info: 'F6'},
              {value: 64, info: 'F7'},
              {value: 65, info: 'F8'},
              {value: 66, info: 'F9'},
              {value: 67, info: 'F10'},
              {value: 68, info: 'F11'},
              {value: 69, info: 'F12'},
              {value: 70, info: 'printscreen'},
              {value: 71, info: 'scroll lock'},
              {value: 72, info: 'pause'},
              {value: 73, info: 'insert'},
              {value: 74, info: 'home'},
              {value: 75, info: 'pageup'},
              {value: 76, info: 'delete'},
              {value: 77, info: 'end'},
              {value: 78, info: 'pagedown'},
              {value: 79, info: 'right'},
              {value: 80, info: 'left'},
              {value: 81, info: 'down'},
              {value: 82, info: 'up'},
              {value: 83, info: 'keypad num lock'},
              {value: 84, info: 'keypad divide'},
              {value: 85, info: 'keypad multiply'},
              {value: 86, info: 'keypad minus'},
              {value: 87, info: 'keypad plus'},
              {value: 88, info: 'keypad enter'},
              {value: 89, info: 'keypad 1'},
              {value: 90, info: 'keypad 2'},
              {value: 91, info: 'keypad 3'},
              {value: 92, info: 'keypad 4'},
              {value: 93, info: 'keypad 5'},
              {value: 94, info: 'keypad 6'},
              {value: 95, info: 'keypad 7'},
              {value: 96, info: 'keypad 8'},
              {value: 97, info: 'keypad 9'},
              {value: 98, info: 'keypad 0'}
            ]
          ]
        }
      }
    }
  }
  return options;

}