<script>
  export let iconPath = "";
  export let activeState = false;
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
  class="{$$props.class} h-6 max-w-[1.5rem] p-0.5 text-white fill-current text-opacity-60 group-hover:text-opacity-100 hover:text-opacity-100"
>
  <g>
    {@html rawSvg}
  </g>
</svg>
