<script>

import { openInBrowser } from '../../shared/helpers/global-helper';

export let url = 'https://intech.studio';

export let classes = "bg-red-700 hover:bg-red-800 ml-2"

</script>

<button on:click={()=>{openInBrowser(url)}} class="{classes} py-1 px-2 border-none font-medium text-white focus:outline-none rounded">
  <slot name="button-label">
    
  </slot>
</button>