<script>

  import {localConfigReportStore} from '../stores/control-surface-input.store';
  import {runtime} from '../stores/runtime.store';

  // here we had a config report flag to allow rendering of local settings... refactoring is fun, keep an eye on dynamic content load in localsettings.svelte
  localConfigReportStore.subscribe(store => {
    runtime.update(runtime => {
      runtime.forEach(controller =>{
        if(controller.dx == store.brc.DX && controller.dy == store.brc.DY){
          let events = controller.banks[store.frame.BANKNUMBER][store.frame.ELEMENTNUMBER].events.find(cntrl => cntrl.event.value == store.frame.EVENTTYPE);
          // Upon connecting modules, messages on config are sent back to editor at instant.
          // To avoid unnecessary message flow, filter configs sent back with the cfgstatus flag.
          if(events){
          // here this should be figured out... what to do on profile load or other...
            if(events.cfgStatus == "fetched"){
              if(store.cfgs.length > 0){
                events.config = store.cfgs;
              } else if(store.cfgs.length == 0){
                events.config = [];
              }
              events.cfgStatus = "received"
            }
          }
        }
      })
      return runtime;
    });
  });

</script>