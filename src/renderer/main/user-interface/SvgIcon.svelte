<script lang="ts">
  export let iconPath: string = "";
  export let width: number = 15;
  export let height: number = 15;

  let rawSvg: string;

  importAsComponent(iconPath).then((res) => {
    rawSvg = res.default;
  });

  async function importAsComponent(path) {
    return await import(`../../assets/icons/${path}.svg?raw`);
  }
</script>

<svg style="width: {width}px; height: {height}px;">
  <g>
    {@html rawSvg}
  </g>
</svg>
