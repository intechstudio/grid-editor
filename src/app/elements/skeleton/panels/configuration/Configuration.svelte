<script>

  import { appSettings } from '../../../../stores/app-settings.store.js';

  import ConfigActions from './ConfigActions.svelte';
  import ConfigDebug from './ConfigDebug.svelte';
  import ConfigOptions from './ConfigOptions.svelte';
  import ConfigType from './ConfigType.svelte';

  import { fly, fade } from 'svelte/transition';

  import * as GLUA from '../../../__action.js';

  const grid_raw_actions = 
`--@ms
ms(1,176,(7+4*(el.av7)),av)
--@ms
ms(1,176,(7+4*(1+abs(el.av7-12 + abs(ok+(yes))))),rch/2)
--@lsp
lsp(1,1,av7)
--@cb
if pagenumber == 1 then kms(alt,f4) end`;

  let actions = GLUA.parse(grid_raw_actions);

</script>

<configuration class="w-full flex flex-col">

  <ConfigType/>

  {#key $appSettings.configType == 'uiEvents'}
    <container in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

      <ConfigOptions/>

      <ConfigActions {actions}/>

      <ConfigDebug {actions}/>

    </container>
  {/key}
</configuration>


