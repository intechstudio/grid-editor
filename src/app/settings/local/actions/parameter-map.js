
const build_array = () => {
  let arr = [];
  for (let i = 0; i < 16; i++) {
    arr[i] = {value: Number(i+1), info: `${'Ch. ' + Number(i+1)}`}
  }
  return arr;
}

export const buildOptionList = function(elementInfo, eventInfo, action){
  const eventType = eventInfo.code;
  const actionName = action.name;
  const elementType = elementInfo.substr(0,1).toUpperCase();
  let options = [];

  if(actionName == "MIDI Dynamic"){

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
            {value: 'P1', info: 'Reversed Control Number'}
          ],
          [
            {value: 'P2', info: 'Absolute Value'},
          ]
        ]
      }
    }

  }


  if(actionName == "MIDI Static"){

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

  if(actionName == "LED Color"){

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
      if(eventType == "AVC7" || eventType == "INIT"){
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

  if(actionName == "LED Phase"){

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
      if(eventType == "AVC7" || eventType == "INIT"){
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

  return options;

}