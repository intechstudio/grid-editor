<script>
  import { get } from "svelte/store";
  import { logger } from "../../../../runtime/runtime.store";
  import { runtime_manager } from "../../../../runtime/runtime-manager.store";
  import { user_input } from "../../../../runtime/user-input.store";
  import { MeltRadio } from "@intechstudio/grid-uikit";

  let selected = 0;
  const options = [
    { title: 1, value: 0 },
    { title: 2, value: 1 },
    { title: 3, value: 2 },
    { title: 4, value: 3 },
  ];

  $: handleSelectPage(selected);

  function handleSelectPage(page) {
    const currentPage = $user_input.pagenumber;

    if (currentPage === page) {
      return;
    }

    const active = get(runtime_manager).active.runtime;
    active
      .change_page(page)
      .then(() => {})
      .catch((e) => {
        selected = currentPage;
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
    selected = ui.pagenumber;
  }
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
