<script>
  import newProfiles from './newProfiles'
  import { clickOutside } from '/main/_actions/click-outside.action'
  import { appSettings } from '/runtime/app-helper.store'

  let sessionProfile = [
    {
      name: 'BU16',
      latestMod: '11-22-2022 16:50',
    },

    {
      name: 'PBF4',
      latestMod: '11-22-2022 16:50',
    },
  ]

  let selected = undefined
  let isSessionProfileOpen = false
  let isProfileCloudOpen = false
</script>

<div
  use:clickOutside={{ useCapture: true }}
  on:click-outside={() => {
    selected = undefined
  }}
  class="bg-primary pt-4 h-full flex flex-col overflow-hidden ">
  <div class="m-4 ">
    <button
      on:click={() => {
        isSessionProfileOpen = !isSessionProfileOpen
      }}
      class="flex justify-between items-center p-4 text-white font-medium
      cursor-pointer bg-secondary w-full">
      <div>Session Profiles</div>
      {isSessionProfileOpen ? '▼' : '▲'}
    </button>

    {#if isSessionProfileOpen}
      <div class="bg-secondary p-3">

        {#each sessionProfile as sessionProfileElement}
          <button
            on:click={() => {
              selected = sessionProfileElement
            }}
            class="w-full text-left bg-primary-700 hover:bg-primary-600 mb-4 p-2
            cursor-pointer {selected == sessionProfileElement ? 'border border-green-300 bg-primary-100' : 'border border-black border-opacity-0'}">
            <div class="flex justify-between">
              <span class="text-zinc-100 ">{sessionProfileElement.name}</span>

            </div>

            <span class="text-zinc-400 text-sm">
              modified: {sessionProfileElement.latestMod}
            </span>

          </button>
        {/each}

      </div>
    {/if}

  </div>

  <div class=" flex flex-col m-4 h-full overflow-hidden ">
    <button
      on:click={() => {
        isProfileCloudOpen = !isProfileCloudOpen
      }}
      class="flex justify-between items-center p-4 text-white font-medium
      cursor-pointer bg-secondary w-full">
      <div>Profile Cloud</div>
      {isProfileCloudOpen ? '▼' : '▲'}
    </button>

    {#if isProfileCloudOpen}
      <div class="bg-secondary p-3 gap-6 flex flex-col h-full overflow-auto">

        <div class="flex flex-col gap-2">
          <div class="relative">
            <svg
              class="absolute left-3 bottom-1"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.2095 11.6374C14.2989 10.1509 14.7868 8.30791 14.5756
                6.47715C14.3645 4.64639 13.4699 2.96286 12.0708 1.76338C10.6717
                0.563893 8.87126 -0.0630888 7.02973 0.0078685C5.1882 0.0788258
                3.44137 0.84249 2.13872 2.14608C0.83606 3.44967 0.0736462
                5.19704 0.00400665 7.03862C-0.0656329 8.8802 0.562637 10.6802
                1.76312 12.0784C2.96361 13.4767 4.64778 14.3701 6.47869
                14.5799C8.3096 14.7897 10.1522 14.3005 11.6379
                13.2101H11.6368C11.6705 13.2551 11.7065 13.2979 11.747
                13.3395L16.0783 17.6707C16.2892 17.8818 16.5754 18.0005 16.8738
                18.0006C17.1723 18.0007 17.4585 17.8822 17.6696 17.6713C17.8807
                17.4603 17.9994 17.1742 17.9995 16.8758C17.9996 16.5773 17.8811
                16.2911 17.6702 16.08L13.3389 11.7487C13.2987 11.708 13.2554
                11.6704 13.2095 11.6362V11.6374ZM13.4998 7.31286C13.4998 8.12541
                13.3397 8.93001 13.0288 9.68071C12.7178 10.4314 12.2621 11.1135
                11.6875 11.6881C11.113 12.2626 10.4308 12.7184 9.68014
                13.0294C8.92944 13.3403 8.12484 13.5004 7.31229 13.5004C6.49974
                13.5004 5.69514 13.3403 4.94444 13.0294C4.19373 12.7184 3.51163
                12.2626 2.93707 11.6881C2.3625 11.1135 1.90674 10.4314 1.59578
                9.68071C1.28483 8.93001 1.12479 8.12541 1.12479 7.31286C1.12479
                5.67183 1.77669 4.09802 2.93707 2.93763C4.09745 1.77725 5.67126
                1.12536 7.31229 1.12536C8.95332 1.12536 10.5271 1.77725 11.6875
                2.93763C12.8479 4.09802 13.4998 5.67183 13.4998 7.31286V7.31286Z"
                fill="#CDCDCD" />
            </svg>
            <input
              type="text"
              class="w-full py-3 pl-12 pr-2 bg-primary-700 text-white
              placeholder-gray-500 text-md"
              placeholder="Find Profile" />

          </div>

          <div class="flex flex-col gap-2 wrap">
            <div class="text-zinc-100 ">Suggested searches:</div>
            <div>
              <button
                class="border border-zinc-600 text-zinc-400 rounded-md py-1 px-2">
                photoshop
              </button>
              <button
                class="border border-zinc-600 text-zinc-400 rounded-md py-1 px-2">
                audio
              </button>
              <button
                class="border border-zinc-600 text-zinc-400 rounded-md py-1 px-2">
                video
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col overflow-y-auto gap-4 ">
          {#each newProfiles as profileCloudElement}
            <button
              on:click={() => {
                selected = profileCloudElement
              }}
              class="w-full bg-primary-700 hover:bg-primary-600 p-2
              cursor-pointer {selected == profileCloudElement ? 'border border-green-300 bg-primary-100' : 'border border-black border-opacity-0'}">

              <div class="flex flex-row justify-between items-start gap-2">

                <div class="text-left">
                  <div class="text-zinc-300 text-sm flex flex-row ">
                    <span>{profileCloudElement.category}</span>
                  </div>

                  <div class=" flex">
                    <span class="text-zinc-100 ">
                      {profileCloudElement.name}
                    </span>
                  </div>
                  <div class="flex gap-3 flex-wrap">
                    <span
                      class="text-zinc-100 text-sm px-3 bg-violet-600 rounded-xl">
                      {profileCloudElement.module}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col text-right ">
                  <div class="text-zinc-200 text-sm ">
                    @{profileCloudElement.author}
                  </div>
                  <div>
                    <button>!</button>
                    <button
                      on:click|preventDefault={() => {
                        $appSettings.modal = 'profileAttachment'
                      }}>
                      at
                    </button>
                    <button
                      on:click|preventDefault={() => {
                        $appSettings.modal = 'profileInfo'
                      }}>
                      info
                    </button>
                  </div>
                </div>

              </div>
            </button>
          {/each}
        </div>

      </div>
    {/if}
  </div>

</div>
