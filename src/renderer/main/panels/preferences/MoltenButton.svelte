<script lang="ts">
  export let click;
  export let border: string = "black";
  export let title: string;
</script>

<button
  on:click={() => {
    if (typeof click === "undefined") {
      return;
    }
    click();
  }}
  class="px-8 py-1 rounded bg-black bg-opacity-20 border border {'border-' +
    border} border-opacity-40 hover:bg-opacity-60"
>
  {title}
</button>
