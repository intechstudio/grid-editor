import { user_input } from '../../../../runtime/runtime.store.js';

export function select(node, [moduleId, selectedDisplay]){

  function handleMousedown(e) {
    if(e.target.ownerSVGElement){
      
      const controlNumber = e.target.ownerSVGElement.dataset.controlNumber;

      if(controlNumber !== undefined){

        
        const dx = moduleId.split(';')[0].split(':').pop();
        const dy = moduleId.split(';')[1].split(':').pop();

        user_input.update_all((store)=>{
          store.id = moduleId,
          store.brc.dx = +dx,
          store.brc.dy = +dy;
          store.event.elementnumber = +controlNumber
          return store;
        })
  
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