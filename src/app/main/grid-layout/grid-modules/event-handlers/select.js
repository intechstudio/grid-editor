import { user_input } from '../../../../runtime/runtime.store.js';

export function select(node, [moduleId, selectedDisplay]){

  function handleMousedown(e) {
    if(e.target.ownerSVGElement){
      
      const {controlNumber, controlElementType} = e.target.ownerSVGElement.dataset;

      if(controlNumber !== undefined && controlElementType !== undefined){
        
        const dx = moduleId.split(';')[0].split(':').pop();
        const dy = moduleId.split(';')[1].split(':').pop();

        user_input.update((ui) =>{
          ui.id = moduleId;
          ui.brc.dx = +dx;
          ui.brc.dy = +dy;
          ui.event.elementnumber = +controlNumber;
          ui.event.elementtype = controlElementType;
          return ui;
        });
  
        node.dispatchEvent(new CustomEvent('selected-element', {
          detail: { controlNumber:  [e.target.parentElement.dataset.controlNumber]}
        }));
  
      }
    }
  }

  node.addEventListener('mousedown', handleMousedown);
  
	return {
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
  }
}