<script>
  export let iconPath = "";
  export let activeState = false;
  export let displayMode = "static";
  let rawSvg;

  importAsComponent(iconPath).then((res) => {
    rawSvg = res.default;
  });

  async function importAsComponent(path) {
    return await import(`../../assets/icons/${path}.svg?raw`);
  }
</script>

<svg
  class:text-opacity-100={activeState}
  class="{$$props.class} {displayMode} {displayMode == 'button'
    ? 'group-hover:text-opacity-100 hover:text-opacity-100'
    : ''} h-6 max-w-[1.5rem] p-0.5 fill-current"
>
  <g>
    {@html rawSvg}
  </g>
</svg>

<!-- Values for displayMode -->
<style lang="postcss">
  .static {
  }

  .button {
    @apply text-white text-opacity-60;
  }
</style>
