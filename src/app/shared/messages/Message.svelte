<script>

  import { fade } from 'svelte/transition';
  import { messageStore } from '../../stores/message.store';


</script>

<main id="messages" class="bottom-1 absolute right-1">
  {#if $messageStore.message}
    <div transition:fade class="text-white bg-primary p-4 border rounded-lg border-gray-700">
      <div>
        <span>{$messageStore.message}</span> 
        <span class="text-important italic">{$messageStore.value}</span>
      </div>
    </div>
  {/if}
</main>