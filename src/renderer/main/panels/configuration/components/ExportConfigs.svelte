<script>
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { modal } from "../../../modals/modal.store.ts";
  import Export from "../../../modals/Export.svelte";
</script>

<div class="flex flex-col ml-2 justify-center items-center p-1">
  <button
    id="open-export-modal"
    on:click|preventDefault={() => {
      modal.show(Export);
    }}
    class="p-1 flex cursor-pointer focus:ring-1 focus:outline-none items-center hover:bg-select bg-secondary rounded"
  >
    <svg
      class="w-6 h-6 p-1 pointer-events-none fill-current text-white"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M492.703 5.84126e-06H353.126C342.468 5.84126e-06 333.83 8.63801 333.83 19.297C333.83 29.955 342.468 38.593 353.126 38.593H473.407V158.874C473.407 169.532 482.045 178.17 492.703 178.17C503.361 178.17 512 169.532 512 158.874V19.297C512 8.63801 503.362 5.84126e-06 492.703 5.84126e-06Z"
      />
      <path
        d="M506.346 5.65401C498.808 -1.88499 486.599 -1.88499 479.061 5.65401L203.764 280.95C196.225 288.482 196.225 300.703 203.764 308.235C207.527 312.004 212.467 313.889 217.407 313.889C222.34 313.889 227.28 312.004 231.05 308.235L506.346 32.939C513.885 25.407 513.885 13.186 506.346 5.65401Z"
      />
      <path
        d="M427.096 239.92C416.438 239.92 407.799 248.558 407.799 259.216V473.407H38.593V104.201H252.784C263.442 104.201 272.08 95.563 272.08 84.905C272.08 74.247 263.442 65.608 252.784 65.608H19.297C8.638 65.608 0 74.246 0 84.905V492.704C0 503.362 8.638 512 19.297 512H427.096C437.76 512 446.392 503.362 446.392 492.703V259.216C446.392 248.558 437.754 239.92 427.096 239.92Z"
      />
    </svg>
  </button>
</div>
