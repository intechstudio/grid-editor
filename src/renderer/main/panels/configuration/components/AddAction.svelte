<script>
  import { createEventDispatcher, onMount } from "svelte";

  import { clickOutside } from "../../../_actions/click-outside.action";

  import { menuBoundaries } from "../../../_actions/boundaries.action.js";

  import _utils from "../../../../runtime/_utils";

  import {
    presetManagement,
    openedActionBlocks,
  } from "../../../../runtime/app-helper.store";

  import { get } from "svelte/store";

  import {
    appActionClipboard,
    appMultiSelect,
    user_input,
  } from "../../../../runtime/runtime.store";

  import { addOnDoubleClick } from "../../../_actions/add-on-double-click";

  import { getAllComponents } from "../../../../lib/_configs";
  import { end } from "luaparse";

  export let animation = false;
  export let userHelper = false;
  export let config = [];
  export let configs = [];
  export let index;

  const dispatch = createEventDispatcher();

  let configSelection = false;
  let visible;

  let selectedConfig = [];

  let promptValue = "";

  let topOffset = 0;

  let selected_action = "";

  let actionPickerTimestamp = 0;

  function initConfig() {
    let cfg = "";

    if (promptValue !== "") {
      cfg = promptValue.trim();
    } else {
      cfg = get(presetManagement.selected_action).configs;
    }

    let action_name = get(presetManagement.selected_action).name;

    window.electron.analytics.influx(
      "application",
      "configpicker",
      "added action",
      action_name
    );

    dispatch("new-config", {
      config: cfg,
    });

    configSelection = false;
    visible = false;
  }

  function pickAction(action) {
    const short = action.short;

    openedActionBlocks.update((s) => {
      s = s.filter((v) => v !== short);
      s.push(short);
      return s;
    });

    selected_action = action.desc;
    presetManagement.selected_action.update({
      name: action.desc,
      configs: `--[[@${action.short}]] ${action.defaultLua}`,
    });
  }

  function paste() {
    dispatch("new-config", {
      config: get(appActionClipboard).join(""),
    });
    configSelection = false;
    visible = false;

    window.electron.analytics.influx(
      "application",
      "configpicker",
      "multiselect",
      "paste"
    );
  }

  let action_options = [];
  onMount(() => {});

  let i;
  let j;
  function openActionPicker() {
    let prevCondition = undefined;
    let nextCondition = undefined;
    let selectedConfig = config;
    let selectedCondition = undefined;

    console.log("ALL WHAT WE HAVE ON ACTION CHAIN", configs);

    console.log(index, "index");

    for (i = index + 1; i < configs.length; i++) {
      if (
        configs[i]?.information.category == null ||
        configs[i]?.information.category == "condition"
      ) {
        nextCondition = configs[i];
        break;
      } else {
        nextCondition = undefined;
      }
    }

    for (j = index - 1; j > 0; j--) {
      if (
        configs[i]?.information.category == null ||
        configs[j]?.information.category == "condition"
      ) {
        prevCondition = configs[j];
        break;
      } else {
        prevCondition = undefined;
      }
    }

    if (
      configs[i]?.information.category == null ||
      config?.information.category == "condition"
    ) {
      selectedCondition = config;
    } else {
      selectedCondition = undefined;
    }


    let ends = []
    let k;



    for(k = 0; k < configs.length; k++){
      if(configs[k]?.short == 'en'){
        ends.push(configs[k])
      }
    }

    let l;
    let endIfPairs=[];
/*     for(l = 0; l < configs.length; l++){ */
      

  let newConfigArray = [];

  configs.forEach((config)=>{
    newConfigArray = [...newConfigArray, config];
  })
   
  // end - if pairs
      ends.forEach((end)=>{
        let endIndex = newConfigArray.indexOf(end)

        for (l = endIndex-1; l > 0; l--) {
          console.log(newConfigArray, "newConfigArray")
        if (
          newConfigArray[l]?.short == "if"
        ) {
          console.log(end, "end")
          console.log(newConfigArray[l], "newConfigArray[l]")

          
          endIfPairs=[...endIfPairs,
            {if: newConfigArray[l],
            end:end
        }]
        
        let ifIndex = l;
        newConfigArray.splice(ifIndex,1)
        
         let endIndex = newConfigArray.indexOf(end);
        newConfigArray.splice(endIndex,1)  
        
        console.log(newConfigArray, "newConfigArray")
        } 

        break;
    } 
      })

      console.log("endIfPairs", endIfPairs)
      console.log("configs", configs)
     


   /*  } */




/*     console.log(prevCondition, "prevCondition");
    console.log(selectedCondition, "selectedCondition");
    console.log(selectedConfig, "selectedConfig");
    console.log(nextCondition, "nextCondition"); */

    /*     configs.forEach((element, index) => {
      console.log(
        "lol",
        index,
        element.information.category,
        element.information.short
      );
    }); */

    try {
      const sorting_array = [
        "variables",
        "led",
        "midi",
        "keyboard",
        "mouse",
        "element settings",
        "condition",
        "special",
        "code",
        "timer",
      ];

      const condition_sorting = ["if", "ei", "el", "en"];

      const allcomponents = getAllComponents();

      if (allcomponents === undefined) {
        return undefined;
      }

      const blocks = allcomponents.map((x) => x.information);

      let object = {};

      const li = get(user_input);
      const eventtype = parseInt(li.event.eventtype);

      blocks.forEach((elem) => {
        /*     console.log(elem, "elem"); */
        if (elem.category === null) {
          return;
        }

        let found = false;

        // check if compatible events are defined in the action component
        if (elem.eventtype !== undefined) {
          elem.eventtype.forEach((ev) => {
            /*  console.log("HELLO", ev, eventtype); */

            if (ev === eventtype) {
              found = true;
              /* console.log("FOUND"); */
            }
          });
        }

        if (elem.eventtype === undefined || found) {
          // check if we already got this type of category in obj
          if (!(elem.category in object)) {
            object[elem.category] = [];
          }

          // push to category
          if (selectedCondition == undefined) {
            selectedCondition = prevCondition;
          }

          //only show correct conditions on the add action panel
          if (selectedCondition?.short == "if" && (nextCondition?.short == "el" || nextCondition?.short == "ei")) {
              if (elem?.short !== "el") {
                object[elem.category].push(elem);
                console.log("hello");
              }
          } else if (selectedCondition?.short == "el") {
            if (elem?.short !== "el" && elem?.short !== "ei") {
              object[elem.category].push(elem);
            }
          } else if (selectedCondition?.short == "ei") {

            if (nextCondition?.short == "el") {
              console.log("ITS ME")
              if (elem?.short !== "el") {
                object[elem.category].push(elem);
              }
            } else {
              object[elem.category].push(elem);
            }
          } else if (selectedCondition?.short == "en" && nextCondition?.short == "en" && prevCondition?.short =="en"){
            console.log("1")
            if (elem?.short !== "el" && elem?.short !== "ei") {
                object[elem.category].push(elem);
              }
          }else if (selectedCondition?.short == "en" && nextCondition?.short == "en" && prevCondition?.short =="if"){ /*ha valahol fent van egy else*/
            console.log("2")
            if (elem?.short !== "el" && elem?.short !== "ei") {
                object[elem.category].push(elem); 
              }
          }else if (selectedCondition?.short == "en" && nextCondition?.short == "en" && prevCondition?.short =="ei"){
            console.log("3")
            if (elem?.short !== "if" ) {
                object[elem.category].push(elem);
              }
          }else if (selectedCondition?.short == "en" && nextCondition?.short == "en" && prevCondition?.short =="el"){
            console.log("4")
            object[elem.category].push(elem);
          }else {
            object[elem.category].push(elem);
          }
        }

        if (elem.eventtype === eventtype) {
        }
      });

      let _action_collection = [];

      for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
          let _obj = {
            category: key,
            collection: object[key],
          };

          /*  console.log(_obj, "obj"); */
          _action_collection.push(_obj);
        }
      }

      _action_collection.sort(function (a, b) {
        return (
          sorting_array.indexOf(a.category) - sorting_array.indexOf(b.category)
        );
      });

      /*       console.log("help filtering this", _action_collection); */

      // custom sorting array
      let change_condition_order = _action_collection.find(
        (x) => x.category == "condition"
      );
      /*       console.log("change_condition_order", change_condition_order); */
      change_condition_order.collection =
        change_condition_order.collection.sort(function (a, b) {
          return (
            condition_sorting.indexOf(a.short) -
            condition_sorting.indexOf(b.short)
          );
        });

      action_options = _action_collection;
    } catch (error) {
      console.log("PARA", error);
    }

    configSelection = !configSelection;
    appMultiSelect.reset();

    /* console.log("Open Picker"); */
    actionPickerTimestamp = Date.now();
  }

  function closeActionPicker() {
    let actionPickerDuration = Date.now() - actionPickerTimestamp;

    window.electron.analytics.influx(
      "application",
      "configpicker",
      "time to pick",
      actionPickerDuration
    );

    initConfig();
  }

  /*   $: console.log(config, "config"); */
</script>

{#if !userHelper}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <action-placeholder
    on:click={openActionPicker}
    on:mouseenter={() => {
      visible = true;
    }}
    on:mouseleave={() => {
      visible = false;
    }}
    class="{(visible || configSelection) && !animation
      ? 'opacity-100'
      : 'opacity-0'} transition-opacity delay-100 duration-300 cursor-pointer flex items-center"
  >
    <div class="h-2 w-full rounded-full bg-pick -mr-1" />

    <div
      class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-pick z-10 "
    >
      <svg
        class="w-5 h-5 p-1"
        viewBox="0 0 7 7"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z"
          fill="white"
        />
      </svg>
    </div>
  </action-placeholder>
{:else}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <action-placeholder
    on:click={openActionPicker}
    on:mouseenter={() => {
      visible = true;
    }}
    on:mouseleave={() => {
      visible = false;
    }}
    class=" cursor-pointer flex w-full items-center"
  >
    <div
      class="{(visible || configSelection) && !animation
        ? 'border-pick bg-select-saturate-10'
        : 'border-secondary'} transition-colors duration-300 w-full border-l-4 text-white pl-4 p-2"
    >
      Add action block...
    </div>
  </action-placeholder>
{/if}

{#if configSelection}
  <pick-action class="w-full absolute flex">
    <menu
      id="action-menu"
      use:menuBoundaries={"init"}
      on:offset-top={(e) => {
        topOffset = e.detail;
      }}
      style="right: calc(100% + 2rem);top:{-250 +
        topOffset}px;width:300px;height:500px;z-index:9999"
      class="absolute shadow-md rounded-md bg-primary border border-gray-700 p-4 "
    >
      <wrapper
        use:clickOutside={{ useCapture: true }}
        on:click-outside={() => {
          configSelection = false;
          visible = false;
        }}
        class="flex flex-col flex-grow h-full"
      >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          on:click={() => {
            configSelection = false;
            visible = false;
          }}
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

        {#if $appActionClipboard.length}
          <button
            on:click={() => {
              paste();
            }}
            class="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-sm mr-8 mb-2 px-4 py-1 text-white rounded-full focus:ring-1 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500"
          >
            Paste
          </button>
        {/if}

        <div class="flex flex-col w-full overflow-y-auto">
          {#each action_options as option}
            {#if option.category != "special" || 1}
              <div class="text-gray-500 text-sm">{option.category}</div>

              <div class="w-full flex justify-start py-1 h-full flex-wrap">
                {#each option.collection as action}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div
                    style="--action-color: {action.color};"
                    use:addOnDoubleClick
                    on:click={() => {
                      pickAction(action);
                    }}
                    on:double-click={closeActionPicker}
                    class="action-card {selected_action == action.desc
                      ? ' border-pick'
                      : ''} border-2 hover:border-pick border-primary cursor-pointer py-0.5 px-1 mx-1 flex items-center rounded-md text-white           "
                  >
                    <div class="w-6 h-6 p-0.5 m-0.5">{@html action.icon}</div>
                    <div
                      class="py-0.5 ml-1 px-1 bg-secondary rounded bg-opacity-25"
                    >
                      {action.desc}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/each}
        </div>

        <div class="w-full mt-2 flex items-end">
          <button
            disabled={selectedConfig === undefined}
            class:disabled={selectedConfig === undefined}
            on:click={closeActionPicker}
            class="bg-commit hover:bg-commit-saturate-20 w-full mr-1 text-white py-2 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
          >
            Add Action
          </button>

          <div class="flex flex-col ml-1">
            <input
              placeholder="prompt"
              class="px-1 py-2 w-16 rounded bg-secondary focus:ring-1 focus:outline-none text-white font-mono"
              bind:value={promptValue}
            />
          </div>
        </div>
      </wrapper>
    </menu>
  </pick-action>
{/if}

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
