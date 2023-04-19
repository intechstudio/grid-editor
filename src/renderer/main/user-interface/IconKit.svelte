<script>
    export let iconPath = "";

    let rawSvg;
    importAsComponent(iconPath).then((res) => {
        rawSvg = res.default.replace(
            /<svg/g,
            `<svg class="w-5 h-5 fill-current"`
        );
    });

    async function importAsComponent(path) {
        return await import(`../../assets/icons/${path}.svg?raw`);
    }
</script>

{@html rawSvg}
