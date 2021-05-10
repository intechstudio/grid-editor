<script>

  import { commIndicator } from '../stores/runtime.store';
  import { messageStore } from '../stores/message.store';

  let tx, rx;

  commIndicator.subscribe(values => {
    tx = values.tx;
    rx = values.rx;
  });

</script>

<div class="flex">
  <div class="flex mx-2 items-center text-xs">
    <div class:bg-green-500={tx} class:bg-secondary={!tx} class="mr-2 rounded-full p-2 w-4 h-4"></div>
    <div class="">TX</div>
  </div>

  <div class="flex mx-2 items-center text-xs">
    <div class:bg-green-500={rx} class:bg-secondary={!rx}  class="mr-2 rounded-full p-2 w-4 h-4"></div>
    <div>RX</div>
  </div>

  <div class="flex mx-2 items-center text-xs">
    changed: {$messageStore.changed}
  </div>

  <div class="flex mx-2 items-center text-xs">
    fetched: {$messageStore.fetched}
  </div>

  <div class="flex mx-2 items-center text-xs">
    received: {$messageStore.received}
  </div>

  <div class="flex mx-2 items-center text-xs">
    sent_to_grid: {$messageStore.sent_to_grid}
  </div>
</div>