<script lang="ts">
  import {
    GridAction,
    ActionData,
    GridEvent,
    EventData,
    type GridElement,
    type GridPage,
  } from "./../../../../runtime/runtime";
  import { LocalDefinitions } from "./../../../../runtime/runtime.store";
  import {
    ClipboardKey,
    appClipboard,
  } from "./../../../../runtime/clipboard.store";
  import { Analytics } from "../../../../runtime/analytics.js";
  import { getAllComponents } from "../../../../lib/_configs";
  import { toggledBlocks } from "../Configuration";
  import {
    NumberToEventType,
    EventTypeToNumber,
    type ElementType,
    type ModuleType,
  } from "@intechstudio/grid-protocol";
  import {
    bodyRulesAt,
    companionElement,
    isAllowedIn,
    pickerInsertIndex,
  } from "./ActionPickerFilter";
  import { addActions } from "../../../../runtime/operations";
  import type { Companion } from "../../../../config-blocks/ActionBlockInformation";
  import { onMount, onDestroy, tick } from "svelte";
  import {
    MoltenPushButton,
    MoltenInput,
    SvgIcon,
  } from "@intechstudio/grid-uikit";
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import MoltenModal from "../../../modals/MoltenModal.svelte";
  import { Modal } from "../../../modals/modal.store";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  export let data: Modal.Instance;
  export let index: number;
  export let event: GridEvent;
  // Element the modal opens anchored next to (the "+" trigger that opened it).
  export let anchorElement: HTMLElement | undefined = undefined;
  // The modal is mounted outside the caller's component tree (Modal.Window
  // portals it to document.body), so a dispatched Svelte event would never
  // reach it - callers pass their existing new-config/paste handlers in as
  // callback props instead.
  export let onNewConfig: (payload: {
    configs: GridAction[];
    index: number;
  }) => void = () => {};
  export let onPaste: (payload: { index: number }) => void = () => {};

  let actionPickerTimestamp = 0;
  let options = [];
  let filteredOptions = [];
  let searchValue = "";
  let searchBar;

  onMount(async () => {
    actionPickerTimestamp = Date.now();
    await tick();
    searchBar?.focus();
  });

  onDestroy(() => {
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
      options = getAvailableOptions($event);
    } catch (e) {
      data.close();
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

    //Filter out components restricted to other element or event types, or
    //to the top level of a real event (not a function body tab)
    const pickerTarget = {
      elementType: target.getInfo().element.type as ElementType,
      eventType: eventString,
      isVirtual: event.realEvent !== event,
      moduleType: target.getInfo().module.type as ModuleType,
      bodies: bodyRulesAt(configs, index),
    };
    comp = comp.filter((e) => isAllowedIn(e.information, pickerTarget));

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
      "touch",
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
    onPaste({ index });
    data.close();
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
    let defaultScript =
      component.information.defaultLuaIn?.(
        $event.config.map((e) => e.script),
      ) ?? component.information.defaultLua;
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

    const isReal = event.realEvent === event;
    onNewConfig({
      configs,
      index: isReal ? pickerInsertIndex(event.config, index) : index,
    });
    data.close();
    // Only when the block landed: the insert runs synchronously inside
    // onNewConfig (addActions → insert) and leaves the config unchanged when
    // it fails (a full Setup).
    if (isReal && event.config.includes(configs[0])) {
      addCompanions(component.information.companions ?? []);
    }
  }

  // Blocks that come with the added one (Touch Start and Touch Tick with the
  // first zone), appended to the element's event of that type if missing.
  // There is no undo history: each event is sent on its own.
  async function addCompanions(companions: Companion[]) {
    const element = event.parent as GridElement;
    const page = element?.parent as GridPage | undefined;
    for (const { eventType, short, script, elementType } of companions) {
      const owner = companionElement(
        page?.control_elements ?? [],
        element,
        elementType,
      );
      const target = owner?.events.find(
        (e) => e.type === EventTypeToNumber(eventType),
      );
      if (typeof target === "undefined") {
        continue;
      }
      if (!target.isLoaded()) {
        await target.load();
      }
      if (!target.config.some((e) => e.short === short)) {
        // an explicit index: addActions without one calls an unbound push
        await addActions(
          target,
          target.config.length,
          new GridAction(target, new ActionData(short, script)),
        );
      }
    }
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

<MoltenModal {data} width="28vw" height="35rem" anchor={anchorElement}>
  <div slot="content" class="flex">
    <menu id="action-menu" class="action-menu p-4">
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
              on:click={() => data.close()}
              id="close-btn"
              style="color: var(--foreground-muted)"
              class="fill-current pl-3 flex items-center justify-center"
            >
              <SvgIcon scale={0.8} iconPath={"close"} />
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
                    class="action-card hover:border-pick cursor-pointer w-full flex items-center h-10"
                    data-testid={component.information.name}
                  >
                    <div
                      style="background-color: {component.information.color};"
                      class="w-2 h-full flex-shrink-0"
                    ></div>
                    <div
                      class="flex-shrink-0 [&_svg]:fill-foreground [&_svg_path]:fill-foreground [&_span]:text-foreground pl-1 pr-3"
                    >
                      <SvgIcon
                        scale={1.3}
                        iconData={component.information.blockIcon}
                      />
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
                          class=" truncate"
                          style="color: var(--foreground-muted); font-size: .9em;"
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
  </div>
</MoltenModal>

<style>
  .action-card {
    background-color: var(--background-muted);
  }

  .action-card:hover {
    background-color: var(--background-soft);
  }

  .action-menu {
    background-color: var(--background);
    height: 35rem;
    width: 28vw;
    min-width: 320px;
    --focus-outline: 1px solid var(--border);
    --focus-offset: 0px;
  }
</style>
