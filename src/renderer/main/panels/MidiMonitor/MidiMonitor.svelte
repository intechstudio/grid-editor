<script>
  import { fade } from "svelte/transition";
  import { midi_monitor_store } from "./MidiMonitor.store";
  import Toggle from "../../user-interface/Toggle.svelte"
  // ok but slow nice
  let rawView = false;
</script>


<div
  transition:fade={{ duration: 150 }}
  class="flex bg-primary justify-start relative w-full h-full flex-col text-white gap-2 p-4 overflow-auto"
>
  <div class="flex flex-wrap text-white items-center my-2">
    <Toggle bind:toggleValue={rawView}/>
    <div class="ml-3 text-white font-medium">Raw View</div>
  </div>

  <div class="font-mono">
    <div class="w-full grid grid-cols-6">
      <div>[X,Y]</div>
      <div>CH</div>
      <div>CMD</div>
      <div>P1</div>
      <div>P2</div>
      <div>DIR</div>
    </div>
  </div>

  <div class=" flex flex-col h-full ">
    {#each $midi_monitor_store as midi}
      <div class=" ">
        {#if midi.class_name === "MIDI"}
          <div
            class="{midi.class_instr == 'REPORT'
              ? 'text-blue-400'
              : 'text-green-400'} flex items-start justify-start w-full font-mono "
          >
            <div class="w-full grid grid-cols-6 ">
              <div>
                <span class="text-teal-400">
                  {#if !rawView && midi.class_parameters.DEVICE_NAME != undefined}
                    {midi.class_parameters.DEVICE_NAME}
                  {:else}
                    [{midi.brc_parameters.SX},{midi.brc_parameters.SY}]
                  {/if}
                </span>
              </div>
              <div>{midi.class_parameters.CHANNEL}</div>
              <div>
                  <span class="text-teal-400">
                    {#if !rawView && midi.class_parameters.COMMAND_NAME != undefined}
                      {midi.class_parameters.COMMAND_NAME}
                    {:else}
                      {midi.class_parameters.COMMAND}
                    {/if}
                  </span>
              </div>
              <div>
                <span class="text-teal-400">
                  {#if !rawView && midi.class_parameters.PARAM1_VALUE != undefined}
                    {midi.class_parameters.PARAM1_VALUE}
                  {:else}
                    {midi.class_parameters.PARAM1}
                  {/if}
                </span>
              </div>
              <div>{midi.class_parameters.PARAM2}</div>
              <div class="flex items-center">
                {#if midi.class_instr == "REPORT"}
                  <div>RX</div>
                  <svg
                    class="ml-1 w-5 h-5 fill-current text-blue-400"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    style="enable-background:new 0 0 512 512;"
                    xml:space="preserve"
                  >
                    <path
                      d="M492,236H68.442l70.164-69.824c7.829-7.792,7.859-20.455,0.067-28.284c-7.792-7.83-20.456-7.859-28.285-0.068
                    l-104.504,104c-0.007,0.006-0.012,0.013-0.018,0.019c-7.809,7.792-7.834,20.496-0.002,28.314c0.007,0.006,0.012,0.013,0.018,0.019
                    l104.504,104c7.828,7.79,20.492,7.763,28.285-0.068c7.792-7.829,7.762-20.492-0.067-28.284L68.442,276H492
                    c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
                    />
                  </svg>
                {:else}
                  <div>TX</div>
                  <svg
                    class="rotate-180 transform ml-1 w-5 h-5 fill-current text-green-400"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    style="enable-background:new 0 0 512 512;"
                    xml:space="preserve"
                  >
                    <path
                      d="M492,236H68.442l70.164-69.824c7.829-7.792,7.859-20.455,0.067-28.284c-7.792-7.83-20.456-7.859-28.285-0.068
                    l-104.504,104c-0.007,0.006-0.012,0.013-0.018,0.019c-7.809,7.792-7.834,20.496-0.002,28.314c0.007,0.006,0.012,0.013,0.018,0.019
                    l104.504,104c7.828,7.79,20.492,7.763,28.285-0.068c7.792-7.829,7.762-20.492-0.067-28.284L68.442,276H492
                    c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
                    />
                  </svg>
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div
            class="{midi.class_instr == 'REPORT'
              ? 'text-blue-400'
              : 'text-green-400'} flex items-center justify-between w-full font-mono"
          >
            <div class="w-full grid grid-cols-6 ">
              <div>[{midi.brc_parameters.SX},{midi.brc_parameters.SY}]</div>
              <div>
                SysEx:{String.fromCharCode.apply(String, midi.raw).substr(8)}
              </div>
              <div />

              <div />
              <div />
              <div class="flex items-center">
                {#if midi.class_instr == "REPORT"}
                  <div>RX</div>
                  <svg
                    class="ml-1 w-5 h-5 fill-current text-blue-400"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    style="enable-background:new 0 0 512 512;"
                    xml:space="preserve"
                  >
                    <path
                      d="M492,236H68.442l70.164-69.824c7.829-7.792,7.859-20.455,0.067-28.284c-7.792-7.83-20.456-7.859-28.285-0.068
                    l-104.504,104c-0.007,0.006-0.012,0.013-0.018,0.019c-7.809,7.792-7.834,20.496-0.002,28.314c0.007,0.006,0.012,0.013,0.018,0.019
                    l104.504,104c7.828,7.79,20.492,7.763,28.285-0.068c7.792-7.829,7.762-20.492-0.067-28.284L68.442,276H492
                    c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
                    />
                  </svg>
                {:else}
                  <div>TX</div>
                  <svg
                    class="rotate-180 transform ml-1 w-5 h-5 fill-current text-green-400"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    style="enable-background:new 0 0 512 512;"
                    xml:space="preserve"
                  >
                    <path
                      d="M492,236H68.442l70.164-69.824c7.829-7.792,7.859-20.455,0.067-28.284c-7.792-7.83-20.456-7.859-28.285-0.068
                    l-104.504,104c-0.007,0.006-0.012,0.013-0.018,0.019c-7.809,7.792-7.834,20.496-0.002,28.314c0.007,0.006,0.012,0.013,0.018,0.019
                    l104.504,104c7.828,7.79,20.492,7.763,28.285-0.068c7.792-7.829,7.762-20.492-0.067-28.284L68.442,276H492
                    c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
                    />
                  </svg>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
