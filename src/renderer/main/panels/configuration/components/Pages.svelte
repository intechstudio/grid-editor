<script lang="ts">
  import { run } from 'svelte/legacy';

  import { get } from "svelte/store";
  import { logger } from "../../../../runtime/runtime.store";
  import { runtime_manager } from "../../../../runtime/runtime-manager.store";
  import { user_input } from "../../../../runtime/user-input.store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  interface Props {
    [key: string]: any
  }

  let { ...props }: Props = $props();

  let selectedPage = undefined;
  function handleSelectPage(page) {
    const active = get(runtime_manager).active.runtime;
    active
      .change_page(page)
      .then(() => {
        selectedPage = page;
      })
      .catch((e) => {
        logger.set({
          type: "alert",
          classname: "pagechange",
          mode: 0,
          message: e,
        });
      });
  }


  function handleUserInputChange(ui) {
    selectedPage = ui.pagenumber;
    selected = ui.pagenumber;
  }


  const defaultOptions = Array.from(Array(4).keys()).map((i) => ({
    title: i + 1,
    value: i,
  }));

  const defaultSelected = 1;
  let selected = $state(defaultSelected);

  let options = defaultOptions;
  run(() => {
    handleUserInputChange($user_input);
  });
  run(() => {
    handleSelectPage(selected);
  });
</script>

<div class="{props.class} flex flex-row gap-2 mt-3 items-center">
  <MeltRadio
    bind:target={selected}
    style="button"
    orientation="horizontal"
    size="full"
    {options}
  />
</div>
