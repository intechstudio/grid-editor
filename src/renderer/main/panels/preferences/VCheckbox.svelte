<script>
  export let checkedState;
</script>

<div class="relative flex items-center justify-center rounded border w-6 h-6">
  <div
    class="{checkedState
      ? 'block'
      : 'hidden'} absolute rounded-sm bg-white h-3 w-3"
  />
</div>
