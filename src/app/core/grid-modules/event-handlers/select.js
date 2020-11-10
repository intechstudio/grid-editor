import { localInputStore } from '../../../stores/control-surface-input.store.js';
import { appSettings } from '../../../stores/app-settings.store.js';

export function select(node, [moduleId, selectedDisplay]){

  appSettings.subscribe((store)=> {
    if(store.selectedDisplay == 'settings'){
      node.addEventListener('mousedown', handleMousedown);
    } else {
      node.removeEventListener('mousedown', handleMousedown);
    }
  })

  function handleMousedown(e) {
    //e.preventDefault();
    
    if(e.target.ownerSVGElement){
      
      const controlNumber = e.target.ownerSVGElement.dataset.controlNumber;


      if(controlNumber !== undefined){
        
        const dx = moduleId.split(';')[0].split(':').pop();
        const dy = moduleId.split(';')[1].split(':').pop();

        localInputStore.update((store)=>{
          store.id = moduleId,
          store.dx = +dx,
          store.dy = +dy;
          store.elementNumber = +controlNumber
          return store;
        })
  
        node.dispatchEvent(new CustomEvent('selected-element', {
          detail: { controlNumber:  [e.target.parentElement.dataset.controlNumber]}
        }));
  
      }
    }
    
  }
  
	return {
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
  }
}