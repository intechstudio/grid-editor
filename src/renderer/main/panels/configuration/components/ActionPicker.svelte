<script>
  import {
    ClipboardKey,
    appClipboard,
  } from "./../../../../runtime/clipboard.store.ts";
  import Popover from "svelte-easy-popover";
  import { createEventDispatcher } from "svelte";

  import { clickOutside } from "../../../_actions/click-outside.action";

  import { Analytics } from "../../../../runtime/analytics.js";

  import { getAllComponents } from "../../../../lib/_configs";
  import {
    ConfigObject,
    ConfigTarget,
    configManager,
  } from "../Configuration.store";

  import { lastOpenedActionblocksInsert } from "../Configuration.store";
  import { NumberToEventType } from "../../../../protocol/grid-protocol";

  import { onMount, onDestroy } from "svelte";
  import MoltenPushButton, {
    ButtonSnap,
    ButtonStyle,
  } from "../../preferences/MoltenPushButton.svelte";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  export let index;
  export let referenceElement = undefined;

  let offset = 0;
  const dispatch = createEventDispatcher();
  //let promptValue = "";
  let actionPickerTimestamp = 0;
  let options = [];
  let pasteEnabled = false;

  onMount(() => {
    referenceElement.addEventListener("click", handleReferenceElementClick);
    actionPickerTimestamp = Date.now();
  });

  // Clean up the event listener when the component is destroyed
  onDestroy(() => {
    referenceElement.removeEventListener("click", handleReferenceElementClick);
    Analytics.track({
      event: "Config Action",
      payload: {
        click: "Add Action Duration",
        duration: Date.now() - actionPickerTimestamp,
      },
      mandatory: false,
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       REACTIVE STATEMENTS        ///////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  $: {
    try {
      options = getAvailableOptions($configManager);
    } catch (e) {
      handleClose();
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       FUNCTION DEFINITIONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function getAvailableOptions(configs) {
    const target = ConfigTarget.getCurrent();
    if (typeof configs === "undefined" || typeof target === "undefined") {
      throw "Unexpected Error";
    }

    let comp = getAllComponents();

    if (comp === undefined) {
      return;
    }

    //Filter out not pickable components
    comp = comp.filter((e) => e.information.category !== null);

    //Filter out not allowed if conditions
    let parts = [];

    {
      let n = index - 1;
      let indentation = 0;
      while (n >= 0) {
        const short = configs[n].short;
        if (short === "if") {
          ++indentation;
        } else if (short === "en") {
          --indentation;
        }

        if (indentation == 1) {
          parts.push({ short: "if", index: n });
          break;
        }
        --n;
      }
    }

    const filterOut = [];
    if (parts.length == 0) {
      filterOut.push("el", "ei");
    } else {
      let n = parts[0].index + 1;
      let indentation = 1;
      while (n < configs.length) {
        const short = configs[n].short;

        if (indentation == 1) {
          if (["en", "ei", "el"].includes(short)) {
            parts.push({ short: short, index: n });
          }
          if (short == "en") {
            break;
          }
        }

        if (short === "if") {
          ++indentation;
        } else if (short === "en") {
          --indentation;
        }
        ++n;
      }

      const [prev, next] = [
        parts.findLast((e) => e.index < index),
        parts.find((e) => e.index >= index),
      ];

      if (next.short == "ei") {
        filterOut.push("el");
      }
      if (next.short == "el" && prev.short == "ei") {
        filterOut.push("el");
      }
      if (next.short == "en" && prev.short == "el") {
        filterOut.push("el", "ei");
      }
    }

    comp = comp.filter((e) => !filterOut.includes(e.information.short));

    //Filter out element type specific components
    const eventString = NumberToEventType(target.eventType);

    if (eventString !== "encoder") {
      comp = comp.filter(
        (e) =>
          ![
            "elrel",
            "elre",
            "elr",
            "eprel",
            "epre",
            "epr",
            "eprlrel",
            "eprlrei",
            "eprlre",
            "eprlr",
          ].includes(e.information.short)
      );
    }
    if (eventString !== "button") {
      comp = comp.filter(
        (e) => !["bprel", "bpre", "bpr"].includes(e.information.short)
      );
    }

    //Group components by category
    comp = comp.reduce(function (r, a) {
      r[a.information.category] = r[a.information.category] || [];
      r[a.information.category].push(a);
      return r;
    }, Object.create(null));
    comp = Object.entries(comp).map(([category, components]) => ({
      category,
      components,
    }));

    //Sort components by category
    const sorting_array = [
      "variables",
      "led",
      "midi",
      "hid",
      "element settings",
      "condition",
      "loop",
      "special",
      "code",
      "timer",
    ];
    comp.sort(function (a, b) {
      return (
        sorting_array.indexOf(a.category) - sorting_array.indexOf(b.category)
      );
    });
    return comp;
  }

  //////////////////////////////////////////////////////////////////////////////
  /////////////////           EVENT HANDLERS          //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function handlePaste() {
    const event = new CustomEvent("paste", {
      detail: {
        index: index,
      },
    });
    referenceElement.dispatchEvent(event);

    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function handleReferenceElementClick(e) {
    const width = e.target.clientWidth;
    const offsetX = e.offsetX;
    offset = -width;
  }

  function handleClickOutside(e) {
    handleClose(e);
  }

  function handleClose(e) {
    dispatch("close");
  }

  function handleAddAction({ component }) {
    const configs = [
      new ConfigObject({
        short: component.information.short,
        script: component.information.defaultLua,
      }),
    ];

    lastOpenedActionblocksInsert(configs[0].short);

    const compositeLua = configs[0].information.compositeLua;
    if (typeof compositeLua !== "undefined") {
      for (const obj of compositeLua) {
        configs.push(
          new ConfigObject({
            short: obj.short,
            script: obj.script,
          })
        );
      }
    }

    const event = new CustomEvent("new-config", {
      detail: {
        configs: configs,
        index: index,
      },
    });
    referenceElement.dispatchEvent(event);

    Analytics.track({
      event: "Config Action",
      payload: {
        click: "Add Action",
        actionBlock: component.information.name,
      },
      mandatory: false,
    });
    handleClose();
  }
</script>

<container style="z-index: 666;">
  <Popover isOpen={true} id="tooltip" {referenceElement} placement={"left"}>
    <pick-action
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
      class="flex w-96"
      style={`max-height: calc(100vh - 27px); `}
    >
      <menu
        id="action-menu"
        class="shadow-md rounded-md bg-primary border border-gray-700 p-4"
        style="max-height: 35rem;"
      >
        <wrapper class="flex flex-col flex-grow h-full">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:click={handleClose}
            id="close-btn"
            style="top:8px; right:8px;"
            class="absolute right-0 p-1 cursor-pointer not-draggable hover:bg-secondary"
          >
            <svg
              class="w-5 h-5 p-1 fill-current text-gray-500"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
              />
              <path
                d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
              />
            </svg>
          </div>

          <div class="flex flex-col w-full overflow-y-auto mb-2">
            {#each options as option}
              <div class="text-gray-500 text-sm">
                {option.category[0].toUpperCase() + option.category.slice(1)}
              </div>

              <div class="w-full flex justify-start py-1 h-full flex-wrap">
                {#each option.components as component}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <div
                    style="--action-color: {component.information.color};"
                    on:click={() => handleAddAction({ component })}
                    class="action-card border-2 hover:border-pick border-primary cursor-pointer py-0.5 px-1 mx-1 flex items-center rounded-md text-white"
                  >
                    <div class="w-6 h-6 p-0.5 m-0.5">
                      {@html component.information.icon}
                    </div>
                    <div
                      class="py-0.5 ml-1 px-1 bg-secondary rounded bg-opacity-25"
                    >
                      {#if typeof component.information.menuName === "undefined"}
                        {component.information.displayName}
                      {:else}
                        {component.information.menuName}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/each}
          </div>

          <MoltenPushButton
            on:click={handlePaste}
            disabled={$appClipboard?.key !== ClipboardKey.ACTION_BLOCKS}
            style={ButtonStyle.ACCEPT}
            text={"Paste"}
            snap={ButtonSnap.FULL}
          />
        </wrapper>
      </menu>
    </pick-action>
  </Popover>
</container>

<style>
  .action-card {
    background-color: var(--action-color);
  }

  .action-card:hover {
    background-color: rgba(95, 120, 133, 1);
  }

  ::-webkit-scrollbar {
    height: 6px;
    width: 6px;
    background: #1e2628;
  }

  ::-webkit-scrollbar-thumb {
    background: #286787;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    background: #1e2628;
  }
</style>
