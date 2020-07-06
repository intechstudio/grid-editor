import { elementSettings } from '../../settings/elementSettings.store.js'

export function select(node, [moduleId, selectedDisplay]){

  function handleMousedown(e) {
    //e.preventDefault();
    
    if(e.target.ownerSVGElement){
      
      const controlNumber = e.target.ownerSVGElement.dataset.controlNumber;
      
      if(controlNumber !== undefined){

        elementSettings.set({
          moduleId: moduleId,
          controlNumber: controlNumber
        })
  
        node.dispatchEvent(new CustomEvent('selected-element', {
          detail: { controlNumber:  e.target.parentElement.dataset.controlNumber}
        }));
  
      }
    }
    
  }
  
	return {
    update(args){
      if(args[1] == 'settings'){
        node.addEventListener('mousedown', handleMousedown);
      } else if(args[1] == 'layout'){
        node.removeEventListener('mousedown', handleMousedown);
      }
    },
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
  }
}