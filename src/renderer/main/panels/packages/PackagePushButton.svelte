<script>
  export let click;
  export let text = "";
</script>

<button
  on:click={click}
  class="bg-emerald-600 px-1 hover:bg-emerald-700 rounded active:border-neutral-800 border-neutral-500 active:outline-none active:ring-blue-300 active:ring-2"
>
  <p class="text-white line-clamp-1">{text}</p>
</button>
