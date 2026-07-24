<script lang="ts">
  import {
    GridAction,
    ActionData,
    GridEvent,
    EventData,
  } from "./../../../../runtime/runtime";
  import { LocalDefinitions } from "./../../../../runtime/runtime.store";
  import {
    ClipboardKey,
    appClipboard,
  } from "./../../../../runtime/clipboard.store";
  import Popover from "svelte-easy-popover";
  import { createEventDispatcher } from "svelte";
  import { clickOutside } from "../../../_actions/click-outside.action";
  import { Analytics } from "../../../../runtime/analytics.js";
  import { getAllComponents } from "../../../../lib/_configs";
  import { toggledBlocks } from "../Configuration";
  import { NumberToEventType } from "@intechstudio/grid-protocol";
  import { onMount, onDestroy } from "svelte";
  import {
    MoltenPushButton,
    MoltenInput,
    SvgIcon,
  } from "@intechstudio/grid-uikit";
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  export let index: number;
  export let referenceElement = undefined;
  export let event: GridEvent;

  let offset = 0;
  const dispatch = createEventDispatcher();
  let actionPickerTimestamp = 0;
  let options = [];
  let filteredOptions = [];
  let searchValue = "";
  let searchBar;

  function handleEscapePress(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  }

  onMount(() => {
    referenceElement.addEventListener("click", handleReferenceElementClick);
    actionPickerTimestamp = Date.now();
    const focusSearchBar = searchBar?.focus;
    if (typeof focusSearchBar !== "undefined") {
      focusSearchBar();
    }

    document.addEventListener("keydown", handleEscapePress);
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

    document.removeEventListener("keydown", handleEscapePress);
  });

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       REACTIVE STATEMENTS        ///////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  $: {
    try {
      options = getAvailableOptions($event);
    } catch (e) {
      handleClose();
    }
  }

  $: handleSearchValueChange(searchValue);

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       FUNCTION DEFINITIONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function getAvailableOptions(target: EventData) {
    const configs = target.config;

    if (typeof target === "undefined") {
      throw "Unexpected Error";
    }

    let comp: any = getAllComponents();

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
      while (n >= 0 && typeof configs[n] !== "undefined") {
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
      while (n < configs.length && typeof configs[n] !== "undefined") {
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

    //Filter out not allowed button step conditions
    let n = index - 1;
    let indentation = 0;
    while (n >= 0 && typeof configs[n] !== "undefined") {
      const short = configs[n].short;
      if (short === "bst0") {
        ++indentation;
      } else if (short === "bste") {
        --indentation;
      }
      --n;
    }

    if (indentation == 0) {
      comp = comp.filter((e) => e.information.short !== "bstn");
    } else {
      comp = comp.filter((e) => e.information.short !== "bst0");
    }

    //Filter out element type specific components
    const eventString = NumberToEventType(target.type);

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
            "eprlrei1",
            "eprlrei2",
            "eprlre",
            "eprlr",
          ].includes(e.information.short),
      );
    }
    if (eventString !== "button") {
      comp = comp.filter(
        (e) => !["bprel", "bpre", "bpr", "bst0"].includes(e.information.short),
      );
    }
    if (eventString !== "endless") {
      comp = comp.filter(
        (e) =>
          ![
            "eplrel",
            "eplre",
            "eplr",
            "epprel",
            "eppre",
            "eppr",
            "epprlrel",
            "epprlrei1",
            "epprlrei2",
            "epprlre",
            "epprlr",
          ].includes(e.information.short),
      );
    }

    //Filter out dev blocks
    if (!get(appSettings).persistent.allowDevBlocks) {
      comp = comp.filter((e) => !e.information.devOnly);
    }

    if (get(appSettings).persistent.userLevelMinimalist === true) {
      comp = comp.filter(
        (e) =>
          !e.information.hiddenInMinimalist &&
          e.information.category !== "deprecated",
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
      "midi",
      "led",
      "hid",
      "code",
      "element settings",
      "special",
      "timer",
      "function",
      "variables",
      "condition",
      "loop",
      "deprecated",
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
    dispatch("paste", {
      index: index,
    });
    handleClose();
  }

  function handleReferenceElementClick(e) {
    const width = e.target.clientWidth;
    offset = -width;
  }

  function handleClickOutside(e) {
    handleClose();
  }

  function handleClose() {
    dispatch("close");
  }

  function replaceToLocalDefinition(script, segment, localDefinition) {
    if (script.includes(segment)) {
      const localDefinitions = LocalDefinitions.getFrom({
        configs: $event.config,
        index: Math.min(index, $event.config.length - 1),
      });
      const defaultLocal = localDefinitions.find(
        (e) => e.value === localDefinition,
      )?.value;

      if (typeof defaultLocal !== "undefined") {
        return script.replace(segment, localDefinition);
      }
    }
    return script;
  }

  function handleAddAction({ component }) {
    let defaultScript = component.information.defaultLua;
    defaultScript = replaceToLocalDefinition(
      defaultScript,
      "self:ind()",
      "num",
    );
    defaultScript = replaceToLocalDefinition(defaultScript, "glr()", "red");
    defaultScript = replaceToLocalDefinition(defaultScript, "glg()", "gre");
    defaultScript = replaceToLocalDefinition(defaultScript, "glb()", "blu");
    const configs = [
      new GridAction(
        undefined,
        new ActionData(component.information.short, defaultScript),
      ),
    ];

    toggledBlocks.add(configs[0].short);

    const compositeLua = configs[0].information.compositeLua;
    if (typeof compositeLua !== "undefined") {
      for (const obj of compositeLua) {
        configs.push(
          new GridAction(undefined, new ActionData(obj.short, obj.script)),
        );
      }
    }

    dispatch("new-config", {
      configs: configs,
      index: index,
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
            if (
              name.indexOf(term.toLocaleLowerCase()) === -1 &&
              option.category
                .toLocaleLowerCase()
                .indexOf(term.toLocaleLowerCase()) === -1
            ) {
              return false;
            }
          }
          return true;
        }),
      }),
    );
    filteredOptions = filteredOptions.filter((e) => e.components.length > 0);
  }

  function handleSearchBarKeyDown(e: any) {
    const { key } = e.detail as KeyboardEvent;
    if (key !== "Enter") {
      return;
    }

    const component = filteredOptions[0]?.components[0];
    if (typeof component === "undefined") {
      return;
    }
    handleAddAction({ component });
  }
</script>

<container style="z-index: 666;">
  <Popover isOpen={true} {referenceElement} placement={"left"}>
    <pick-action
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
      class="flex w-96"
      style={`max-height: calc(100vh - 27px); width: 28vw; min-width: 320px;`}
    >
      <menu id="action-menu" class="action-menu shadow-md p-4">
        <wrapper class="flex flex-col w-full h-full gap-2">
          <div class="flex flex-col flex-grow gap-1">
            <div class="flex flex-row items-center justify-end">
              <MoltenInput
                bind:this={searchBar}
                bind:target={searchValue}
                on:keydown={handleSearchBarKeyDown}
                placeholder={$appSettings.persistent.userLevelMinimalist
                  ? "Search Essentials Blocks..."
                  : "Search..."}
              />
              <button
                on:click={handleClose}
                id="close-btn"
                style="color: var(--foreground-muted)"
                class="fill-current pl-3 flex items-center justify-center"
              >
                <SvgIcon width={10} height={10} iconPath={"close"} />
              </button>
            </div>
          </div>

          <div class="flex flex-col w-full h-full overflow-y-auto">
            {#if filteredOptions.length > 0}
              {#each filteredOptions as option}
                <div
                  style="color: var(--foreground-muted)"
                  class="text-l font-semibold uppercase tracking-widest pt-2 pb-0.5"
                >
                  {option.category[0].toUpperCase() + option.category.slice(1)}
                </div>

                <div class="w-full flex flex-col gap-1">
                  {#each option.components as component}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <button
                      on:click={() => handleAddAction({ component })}
                      class="action-card hover:border-pick cursor-pointer w-full flex items-center gap-3 h-10"
                    >
                      <div
                        style="background-color: {component.information.color};"
                        class="w-1.5 h-full flex-shrink-0"
                      ></div>
                      <div
                        class="w-6 h-6 flex-shrink-0 [&_svg]:fill-foreground [&_svg_path]:fill-foreground [&_span]:text-foreground"
                      >
                        {@html component.information.icon}
                      </div>
                      <div
                        class="flex-1 min-w-0 truncate flex items-center gap-1"
                      >
                        <span class="text-l">
                          {#if typeof component.information.menuName === "undefined"}
                            {component.information.displayName}
                          {:else}
                            {component.information.menuName}
                          {/if}
                        </span>
                        {#if typeof component.information.description != "undefined"}
                          <span
                            class="text-sm truncate"
                            style="color: var(--foreground-muted)"
                          >
                            -- {component.information.description}
                          </span>
                        {/if}
                      </div>
                    </button>
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
            click={handlePaste}
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
    background-color: var(--background-muted);
  }

  .action-card:hover {
    background-color: var(--background-soft);
  }

  .action-menu {
    background-color: var(--background);
    border: 1px solid var(--border);
    height: 35rem;
    width: 28vw;
    min-width: 320px;
    --focus-outline: 1px solid var(--border);
    --focus-offset: 0px;
  }
</style>
