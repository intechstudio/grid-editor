<script>

  import { appSettings } from '../../../../stores/app-settings.store.js';

  import ConfigActions from './ConfigActions.svelte';
  import ConfigDebug from './ConfigDebug.svelte';
  import ConfigOptions from './ConfigOptions.svelte';
  import ConfigType from './ConfigType.svelte';

  import { fly, fade } from 'svelte/transition';

  import * as GLUA from '../../../__action.js';
import { runtime } from '../../../action-preferences.store.js';

  const grid_raw_actions = 
`--@ms
ms(1,176,(7+4*(el.av7)),av)
--@if
if (true) then
--@lsp
lsp(1,1,av7)
--@end
end
--@cb
if pagenumber == 1 then kms(alt,f4) end`;

  let actions = GLUA.rawParser(grid_raw_actions);

  runtime.set(actions);

</script>

<configuration class="w-full flex flex-col">

  <ConfigType/>

  {#key $appSettings.configType == 'uiEvents'}
    <container in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

      <ConfigOptions/>

      <ConfigActions />

      <ConfigDebug {actions}/>

    </container>
  {/key}
</configuration>


