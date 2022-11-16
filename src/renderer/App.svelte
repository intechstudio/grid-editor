<script>
  /*
   *   tailwindcss
   */

  import './app.css'

  /**
   *  svelte UI parts and components
   */

  import { onMount } from 'svelte'
  import { get } from 'svelte/store'

  import { appSettings } from './runtime/app-helper.store'

  import Titlebar from './main/Titlebar.svelte'
  import NavTabs from './main/NavTabs.svelte'

  import RightPanelContainer from './main/RightPanelContainer.svelte'
  import LeftPanelContainer from './main/LeftPanelContainer.svelte'
  import GridLayout from './main/grid-layout/GridLayout.svelte'
  import TopSubMenu from './main/TopSubMenu.svelte'

  import Export from './main/modals/Export.svelte'
  import Welcome from './main/modals/Welcome.svelte'
  import Monaco from './main/modals/Monaco.svelte'
  import Feedback from './main/modals/Feedback.svelte'
  import ProfileInfo from './main/modals/ProfileInfo.svelte'
  import ProfileAttachment from './main/modals/ProfileAttachment.svelte'
  import ProfileEdit from './main/modals/ProfileEdit.svelte'

  import FirmwareCheck from './main/FirmwareCheck.svelte'

  import ErrorConsole from './main/ErrorConsole.svelte'

  import TooltipGetter from './main/user-interface/tooltip/TooltipGetter.svelte'

  import Monster from './main/user-interface/Monster.svelte'
  import { attachment } from './main/user-interface/Monster.store'

  import Updater from './shared/updater/Updater.svelte'

  import { windowSize } from './runtime/window-size'

  import { watchResize } from 'svelte-watch-resize'
  import { debug_lowlevel_store } from './main/panels/WebsocketMonitor/WebsocketMonitor.store'

  let modalComponents = {}

  modalComponents[''] = undefined
  modalComponents['export'] = Export
  modalComponents['welcome'] = Welcome
  modalComponents['code'] = Monaco
  modalComponents['feedback'] = Feedback
  modalComponents['profileInfo'] = ProfileInfo
  modalComponents['profileAttachment'] = ProfileAttachment
  modalComponents['profileEdit'] = ProfileEdit

  let shapeSelected
  let colorSelected
  let name

  $: {
    if ($appSettings.persistant.helperShape !== undefined) {
      shapeSelected = $appSettings.persistant.helperShape
    }

    if ($appSettings.persistant.helperColor !== undefined) {
      colorSelected = $appSettings.persistant.helperColor
    }

    name = $appSettings.persistant.helperName
  }

  function resize() {
    $windowSize.window = $windowSize.window + 1
  }

  // websocket rx tx from main for debug
  window.electron.websocket.onReceive((_event, value) => {
    //console.log('websocket',value);
    debug_lowlevel_store.push_inbound(new TextEncoder().encode(value))
  })

  window.electron.websocket.onTransmit((_event, value) => {
    //console.log('websocket',value);
    debug_lowlevel_store.push_outbound(new TextEncoder().encode(value))
  })

  onMount(() => {
    // application mounted, check analytics
    window.electron.analytics.influx('application', 'init', 'init', 'init')
    window.electron.analytics.google('fw-editor-version', {
      value: `v${get(appSettings).version.major}.${
        get(appSettings).version.minor
      }.${get(appSettings).version.patch}`,
    })
  })
</script>

<Monster
  {name}
  shapeSelected={$appSettings.persistant.helperShape}
  colorSelected={$appSettings.persistant.helperColor}
  {attachment} />

<Titlebar />

<main
  use:watchResize={resize}
  id="app"
  spellcheck="false"
  class=" relative flex w-full h-full flex-row justify-between overflow-hidden">

  <!-- Switch between tabs for different application features. -->

  <NavTabs />

  <svelte:component this={modalComponents[$appSettings.modal]} />

  <!-- Update notification -->
  <Updater />

  <TooltipGetter />

  <div class="flex flex-col w-full h-full">

    <TopSubMenu />

    <FirmwareCheck />

    <ErrorConsole />

    <div class="flex w-full h-full overflow-hidden ">

      <LeftPanelContainer classes={'w-3/12 '} />

      <!-- This is the (mostly) Layout part of the code. -->

      <GridLayout classes={'flex-1'} />

      <!-- The right side panel container -->

      <RightPanelContainer classes={'w-4/12'} />

    </div>

  </div>

</main>
