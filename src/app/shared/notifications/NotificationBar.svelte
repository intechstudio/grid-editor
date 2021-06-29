<script>
  import { onMount } from "svelte";
  import UrlButton from "../../main/user-interface/UrlButton.svelte";

  let notification = [];

  onMount(async()=>{
    console.log('HELLO')
    try {
       notification = await fetch('https://intech.studio/is-api/notifications/public', {method: 'GET'});
       console.log('notif',notification);
    } catch (err) {
      console.log('asd')
      console.error(err);
    }

  })

</script>

<!--
{#if false}
  <div  class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4">
    <span class="mx-2">{notification[0]}</span>
    <span class="mx-2">Once you updated the firmware hit <span class="font-mono text-sm mx-2 bg-white text-gray-700 px-2 py-1 rounded"></span> to reload app!</span>
    <UrlButton url={"https://github.com/IntechStudioDev/grid-fw/releases/latest"}>
      <div slot="button-label">Update</div>
    </UrlButton>
  </div>
{/if}

-->