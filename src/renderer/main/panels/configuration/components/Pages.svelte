<script>
  import { get } from "svelte/store";
  import { logger } from "../../../../runtime/runtime.store";
  import { runtime_manager } from "../../../../runtime/runtime-manager.store";
  import { user_input } from "../../../../runtime/user-input.store";
  import { MeltRadio } from "@intechstudio/grid-uikit";

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

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    selectedPage = ui.pagenumber;
    selected = ui.pagenumber;
  }

  $: handleSelectPage(selected);

  const defaultOptions = Array.from(Array(4).keys()).map((i) => ({
    title: i + 1,
    value: i,
  }));

  const defaultSelected = 1;
  let selected = defaultSelected;

  let options = defaultOptions;
</script>

<div class="{$$props.class} flex flex-row gap-2 mt-3 items-center">
  <MeltRadio
    bind:target={selected}
    style="button"
    orientation="horizontal"
    size="full"
    {options}
  />
</div>
