import { elementSettings } from '../../settings/elementSettings.store.js'

export function select(node, [moduleId, selectedDisplay]){

  function handleMousedown(e) {
    //e.preventDefault();
    
    if(e.target.ownerSVGElement){
      
      const controlNumber = e.target.ownerSVGElement.dataset.controlNumber;

      console.log(moduleId, controlNumber)

      if(controlNumber !== undefined){

        const dx = moduleId.split(';')[0].split(':').pop();
        const dy = moduleId.split(';')[1].split(':').pop();
        const position = 'dx:'+dx+';dy:'+dy;

        elementSettings.update((settings)=>{
          settings.moduleId = moduleId,
          settings.position = position,
          settings.controlNumber = controlNumber
          return settings;
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