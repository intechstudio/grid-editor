<script>
  import menuIcons from "$lib/menu.icons";
  import { SvgIcon } from "@intechstudio/grid-uikit";

  export let click;
  export let text = "";
  export let icon = undefined;
</script>

<button
  on:click={click}
  class="bg-emerald-600 px-1 hover:bg-emerald-700 rounded active:border-neutral-800 border-neutral-500 active:outline-none active:ring-blue-300 active:ring-2"
>
  {#if icon}
    <div class="rounded-md my-1">
      <SvgIcon iconPath={icon} fill="white" />
    </div>
  {:else}
    <p class="text-white line-clamp-1">{text}</p>
  {/if}
</button>
