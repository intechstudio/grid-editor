<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "../headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;
</script>
  
<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { Script } from "../_script_parsers.js";

  export let config;

  const dispatch = createEventDispatcher();

  let actionDiv;
  let originalActionHtml;
  let updateActionWithConfig;

  $ : config?.information?.actionHtml, actionDiv, updateActionWithConfig, refreshDivContent()

  function refreshDivContent(){
    console.log({config})
    if (actionDiv && originalActionHtml != config.information.actionHtml) {
      //Only change the contents if the default html changes
      // otherwise action state can be lost, script tag runs multiple times
      actionDiv.innerHTML = config.information.actionHtml
      originalActionHtml = config.information.actionHtml
      executeScriptElements(actionDiv)
    }
    if (updateActionWithConfig){
      updateActionWithConfig(config);
    }
  }

  function executeScriptElements(containerElement) {
      const scriptElements = containerElement.querySelectorAll("script");

      Array.from(scriptElements).forEach((scriptElement) => {
        const clonedElement = document.createElement("script");

        Array.from(scriptElement.attributes).forEach((attribute) => {
          clonedElement.setAttribute(attribute.name, attribute.value);
        });

        clonedElement.text = scriptElement.text;

        scriptElement.parentNode.replaceChild(clonedElement, scriptElement);
      });
    }

  onMount(() => {
    console.log("Registering updateCode!")
    actionDiv.addEventListener(
      "updateCode",
      (e) => {
        console.log("Received updateCode!")
        dispatch("output", { short: config.short, script: e.detail.script })
      },
      false
    )
    actionDiv.addEventListener(
      "updateConfigHandler",
      (e) => {
        console.log("Handler update")
        updateActionWithConfig = e.detail.handler
      },
      false
    )
  });
</script>
  
<package
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full flex" bind:this={actionDiv} />
</package>
  