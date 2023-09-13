<script>
  export let selectedState;
</script>

<div
  class="relative flex items-center justify-center rounded-full border w-6 h-6"
>
  <div
    class="{selectedState
      ? 'block'
      : 'hidden'} absolute rounded-full bg-white h-3 w-3"
  />
</div>
