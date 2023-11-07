<script lang="ts">
  export let border: string = "transparent";
</script>

<div
  class="py-4 border {border !== 'transparent' ? 'px-4' : ''} {'border-' +
    border}"
>
  <slot />
</div>
