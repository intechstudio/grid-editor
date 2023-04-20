<script>
  export let iconPath = "";

  let rawSvg;
  importAsComponent(iconPath).then((res) => {
    rawSvg = res.default.replace(
      /<svg/g,
      `<svg class="w-5 h-5 text-white fill-current hover:text-yellow-500"`
    );
  });

  async function importAsComponent(path) {
    return await import(`../../assets/icons/${path}.svg?raw`);
  }
</script>

<div class="text-op" />
{@html rawSvg}
