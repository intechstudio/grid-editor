<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  let moduleWidth = 2.1 * 106.6 + 2;
</script>

<div draggable={$appSettings.layoutMode}>
  <slot />

  <div
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module flex bg-blue-500 border-2 {true
      ? ' border-gray-500'
      : 'border-transparent'}"
    style="--module-size: {moduleWidth + 'px'}"
  >
    <div
      class="grid grid-cols-10 h-full w-full justify-items-center items-center relative"
    >
      {#each Array.from({ length: 100 }, (_, i) => i) as num}
        <span
          class="text-lg animate-customAnimation
          {'animation-delay-' + String(Math.floor(Math.random() * 5))}"
          >{num % Math.floor(Math.random() * 2) === 0 ? "1" : "0"}</span
        >
      {/each}

      <div class="absolute w-full h-full items-center justify-center flex">
        <div
          class="flex flex-col bg-slate-600 bg-opacity-10 backdrop-blur-sm py-3 px-2 rounded-2xl w-64 gap-1 items-center"
        >
          <span class="text-white text-center text-2xl mb-2"
            >Oops, firmware mismatch is detected!</span
          >
          <span class="text-md text-white text-center mb-3"
            >Click Update to start the automatic update process!</span
          >
          <button
            class="relative items-center justify-center rounded
            focus:outline-none text-white py-1 w-24 bg-commit"
          >
            <div>Update</div>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div
    class="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 opacity-10 text-white font-bold text-xs"
  />
</div>

<style global>
  @keyframes animation2 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.01);
    }
    100% {
      transform: scale(1);
    }
  }

  .animate-pulsation {
    animation-name: animation2;
    animation-duration: 2s;
    animation-iteration-count: infinite;
  }

  @keyframes customAnimation {
    0% {
      color: rgb(59 130 246);
    }
    25% {
      color: SteelBlue;
    }
    50% {
      color: CornflowerBlue;
    }
    75% {
      color: rgb(147 197 253);
    }
    100% {
      color: CornflowerBlue;
    }
  }

  .animate-customAnimation {
    animation-name: customAnimation;
    animation-duration: 2s;
    animation-iteration-count: infinite;
  }

  .animation-delay-0 {
    animation-delay: 0s;
  }

  .animation-delay-1 {
    animation-delay: 0.5s;
  }

  .animation-delay-2 {
    animation-delay: 1s;
  }

  .animation-delay-3 {
    animation-delay: 1.5s;
  }

  .animation-delay-4 {
    animation-delay: 2s;
  }

  .animation-delay-5 {
    animation-delay: 2.5s;
  }

  .module {
    width: var(--module-size);
    height: var(--module-size);
    border-radius: 0.5rem;
  }

  .knob-and-led {
    display: flex;
    padding: 2px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: filter 0.2s;
    filter: drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.5));
  }

  .knob-and-led:hover {
    filter: drop-shadow(0px 0px 13px rgba(255, 255, 255, 0.15));
    cursor: pointer;
  }

  .knob-and-led:not(.active-element):hover {
    background-color: rgba(136, 136, 136, 0.1);
    box-shadow: inset 0 0 0px #ffffff33;
    padding: 0.2rem;
    border-radius: 0.5rem;
  }

  .control-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    display: flex;
    justify-content: space-around;
    margin-top: var(--control-row-mt);
    margin-left: var(--control-row-mx);
    margin-right: var(--control-row-mx);
  }

  .control-row:last-child {
    margin-bottom: var(--control-row-mb);
  }

  .disable-pointer-events {
    pointer-events: none;
  }

  .active-element {
    background-color: rgba(136, 136, 136, 0.35);
    box-shadow: inset 0 0 0px #ffffff33;
    padding: 0.2rem;
    border-radius: 0.5rem;
  }

  .active-systemelement {
    background-color: #212a2b;
    box-shadow: inset 0 0 10px #dddddd60;
  }
</style>
