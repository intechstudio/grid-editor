<script lang="ts">
  import menuIcons from "$lib/menu.icons";
  import { SvgIcon } from "@intechstudio/grid-uikit";

  interface Props {
    click: any;
    text?: string;
    icon?: any;
  }

  let { click, text = "", icon = undefined }: Props = $props();
</script>

<button
  onclick={click}
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
