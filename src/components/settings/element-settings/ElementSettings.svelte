<script>

</script>

<div class="inline-block primary rounded-lg p-4 m-4">
  <div class="text-xl font-bold text-white mx-2">
    Element Settings
  </div>

  <div class="mx-2 my-4">
    <div class="text-gray-700 py-1">
      Events
    </div>
    <div class="flex secondary rounded-lg px-2 shadow">
      {#each ['up', 'down', 'single', 'double', 'long'] as event}
        <div class="p-2 text-white">
          {event}
        </div>
      {/each}
    </div>
  </div>

</div>