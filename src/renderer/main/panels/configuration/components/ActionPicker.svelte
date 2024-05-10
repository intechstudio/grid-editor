<script>
  import SvgIcon from "./../../../user-interface/SvgIcon.svelte";
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
  import { MoltenPushButton, MoltenInput } from "@intechstudio/grid-uikit";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  export let index;
  export let referenceElement = undefined;

  let offset = 0;
  const dispatch = createEventDispatcher();
  let actionPickerTimestamp = 0;
  let options = [];
  let filteredOptions = [];
  let searchValue = "";
  let searchBar;

  onMount(() => {
    referenceElement.addEventListener("click", handleReferenceElementClick);
    actionPickerTimestamp = Date.now();
    const focusSearchBar = searchBar?.focus;
    if (typeof focusSearchBar !== "undefined") {
      focusSearchBar();
    }
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

  $: handleSearchValueChange(searchValue);

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
    offset = -width;
  }

  function handleClickOutside(e) {
    handleClose(e);
  }

  function handleClose(e) {
    console.log("close");
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

  function handleSearchValueChange(value) {
    const searchTerms = value.trim().toLowerCase().split(" ");
    filteredOptions = options.map((option) =>
      Object({
        category: option.category,
        components: option.components.filter((e) => {
          const name = (
            typeof e.information.menuName === "undefined"
              ? e.information.displayName
              : e.information.menuName
          ).toLocaleLowerCase();

          for (const term of searchTerms) {
            if (name.indexOf(term.toLocaleLowerCase()) === -1) {
              return false;
            }
          }
          return true;
        }),
      })
    );
    filteredOptions = filteredOptions.filter((e) => e.components.length > 0);
  }

  function handleKeydown(e) {
    if (e.code !== "Enter") {
      return;
    }
    const component = filteredOptions[0]?.components[0];
    if (typeof component === "undefined") {
      return;
    }
    handleAddAction({ component });
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<container style="z-index: 666;">
  <Popover isOpen={true} {referenceElement} placement={"left"}>
    <pick-action
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
      class="flex w-96"
      style={`max-height: calc(100vh - 27px); width: 20vw;`}
    >
      <menu
        id="action-menu"
        class="shadow-md rounded-md bg-primary border border-gray-700 p-4"
        style="height: 35rem; width: 20vw;"
      >
        <wrapper class="flex flex-col w-full h-full gap-2">
          <div class="flex flex-col flex-grow">
            <div class="flex flex-row justify-between">
              <span class="text-gray-500 text-sm self-end"> Search: </span>
              <button
                on:click={handleClose}
                id="close-btn"
                class="hover:bg-secondary fill-gray-500 p-1 rounded mb-1"
              >
                <SvgIcon width={10} height={10} iconPath={"close"} />
              </button>
            </div>
            <MoltenInput bind:this={searchBar} bind:target={searchValue} />
          </div>

          <div class="flex flex-col w-full h-full overflow-y-auto">
            {#if filteredOptions.length > 0}
              {#each filteredOptions as option}
                <div class="text-gray-500 text-sm">
                  {option.category[0].toUpperCase() + option.category.slice(1)}
                </div>

                <div class="w-full flex justify-start py-1 flex-wrap">
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
            {:else}
              <div class="flex items-center justify-center w-full h-full">
                <span class="text-gray-500">No results</span>
              </div>
            {/if}
          </div>

          <MoltenPushButton
            on:click={handlePaste}
            disabled={$appClipboard?.key !== ClipboardKey.ACTION_BLOCKS}
            style={"accept"}
            text={"Paste"}
            snap={"full"}
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
