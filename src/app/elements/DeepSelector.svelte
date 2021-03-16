<script>

  let things = ["MIDI", "MACRO", "LED"]

</script>


<input type="text" class="bg-secondary flex-grow text-white p-2 focus:outline-none">

<div class="p-2">
  <div class="flex justify-around">
    <button class="bg-highlight text-white py-1 px-2 mr-1 rounded border border-highlight hover:bg-highlight-400 focus:outline-none">Modifiers</button>
    <button class="bg-highlight text-white py-1 px-2 mr-1 rounded border border-highlight hover:bg-highlight-400 focus:outline-none">Actions</button>
  </div>

  <ul>
    {#each things as thing}
    <li></li>
    {/each}
  </ul>

</div>