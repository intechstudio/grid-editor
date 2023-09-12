<script lang="ts">
  export let disabled = false;
  export let target;
</script>

<input
  {disabled}
  class="w-full flex px-2 py-2 text-white text-opacity-80 flex-grow bg-black bg-opacity-10 border border-black border-opacity-20 focus:border-green-500 focus:outline-none"
  bind:value={target}
/>
