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
  class="bg-primary pt-4 h-full flex flex-col overflow-hidden scroll-smooth">
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
            cursor-pointer {selected == sessionProfileElement ? 'border border-green-300 bg-primary-600' : 'border border-black border-opacity-0'}">
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
              placeholder-gray-400 text-md"
              placeholder="Find Profile" />

          </div>

          <div class="flex flex-col gap-2 wrap">
            <div class="text-gray-100 ">Suggested searches:</div>
            <div class="flex flex-row gap-2">
              <button
                class="border border-primary-300 text-primary-100 rounded-md
                py-1 px-2">
                photoshop
              </button>
              <button
                class="border border-primary-300 text-primary-100 rounded-md
                py-1 px-2">
                audio
              </button>
              <button
                class="border border-primary-300 text-primary-100 rounded-md
                py-1 px-2">
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
              cursor-pointer {selected == profileCloudElement ? 'border border-green-300 bg-primary-600' : 'border border-black border-opacity-0'}">

              <div class="flex flex-row justify-between items-start gap-1">

                <div class="flex flex-col text-left gap-2">
                  <div class="text-gray-300 text-sm flex flex-row ">
                    <span>{profileCloudElement.category}</span>
                  </div>

                  <div>
                    <span class="text-gray-100 ">
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

                <div class="flex flex-col text-right gap-2">
                  <div class="text-gray-100 text-sm ">
                    @{profileCloudElement.author}
                  </div>
                  <div class="flex flex-row gap-1">
                    <button>!</button>
                    <button
                      class="p-1 hover:bg-primary-500 rounded"
                      on:click|preventDefault={() => {
                        $appSettings.modal = 'profileAttachment'
                      }}>
                      <svg
                        width="17"
                        height="18"
                        viewBox="0 0 20 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_262_1471)">
                          <path
                            d="M3.37381 20.1806C2.526 20.1806 1.71199 19.8298
                            1.06324 19.1804C-0.375193 17.7373 -0.375193 15.3901
                            1.06291 13.9479L12.2792 2.03728C14.0292 0.284467
                            16.7098 0.441967 18.666 2.40072C19.5426 3.27884
                            20.0345 4.54478 20.016 5.87541C19.9976 7.19199
                            19.4832 8.45197 18.6041 9.33259L10.1273
                            18.357C9.89133 18.6098 9.49571 18.6213 9.24385
                            18.3842C8.9926 18.1467 8.98041 17.7504 9.21729
                            17.4985L17.707 8.4604C18.371 7.79509 18.752 6.85132
                            18.766 5.85789C18.7801 4.86384 18.421 3.92664
                            17.7823 3.28632C16.5823 2.08382 14.6285 1.45414
                            13.176 2.91007L1.96006 14.8207C0.995686 15.7876
                            0.995998 17.3404 1.94756 18.2944C2.39379 18.741
                            2.92348 18.9585 3.48754 18.9244C4.04567 18.8903
                            4.61942 18.6041 5.10317 18.1191L14.0275
                            8.62035C14.351 8.29628 15.001 7.50191 14.3394
                            6.83878C13.9647 6.46347 13.7016 6.4866 13.615
                            6.49378C13.3679 6.51566 13.0791 6.6866 12.7794
                            6.98722L6.06223 14.1313C5.82504 14.3835 5.4291
                            14.3957 5.17877 14.1578C4.92721 13.921 4.91565
                            13.5241 5.15221 13.2728L11.8816 6.11535C12.4107
                            5.58378 12.9516 5.29566 13.5022 5.24628C13.9319
                            5.20814 14.571 5.29972 15.2229 5.95347C16.1904
                            6.92283 16.0701 8.34472 14.9244 9.49285L6.00006
                            18.991C5.28756 19.7059 4.42723 20.1213 3.5641
                            20.1744C3.50067 20.1787 3.43723 20.1806 3.37379
                            20.1806L3.37381 20.1806Z"
                            fill="#F1F1F1" />
                        </g>
                        <defs>
                          <clipPath id="clip0_262_1471">
                            <rect
                              width="20"
                              height="20"
                              fill="white"
                              transform="translate(0 0.5)" />
                          </clipPath>
                        </defs>
                      </svg>

                    </button>

                    <button
                      class="p-1 hover:bg-primary-500 rounded"
                      on:click|preventDefault={() => {
                        $appSettings.modal = 'profileInfo'
                      }}>
                      <svg
                        class="fill-white "
                        width="19"
                        height="18"
                        viewBox="0 0 21 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_293_1221)">
                          <path
                            d="M10.2723 0.489136C5.02014 0.489136 0.761475
                            4.7478 0.761475 10C0.761475 15.2522 5.02014 19.5109
                            10.2723 19.5109C15.5246 19.5109 19.7832 15.2522
                            19.7832 10C19.7832 4.7478 15.5246 0.489136 10.2723
                            0.489136ZM10.2723 17.8974C5.91178 17.8974 2.37493
                            14.3606 2.37493 10C2.37493 5.63944 5.91178 2.10259
                            10.2723 2.10259C14.6329 2.10259 18.1698 5.63944
                            18.1698 10C18.1698 14.3606 14.6329 17.8974 10.2723
                            17.8974Z" />
                          <path
                            d="M9.25342 6.26359C9.25342 6.53385 9.36078 6.79304
                            9.55188 6.98415C9.74299 7.17525 10.0022 7.28261
                            10.2724 7.28261C10.5427 7.28261 10.8019 7.17525
                            10.993 6.98415C11.1841 6.79304 11.2915 6.53385
                            11.2915 6.26359C11.2915 5.99333 11.1841 5.73414
                            10.993 5.54303C10.8019 5.35193 10.5427 5.24457
                            10.2724 5.24457C10.0022 5.24457 9.74299 5.35193
                            9.55188 5.54303C9.36078 5.73414 9.25342 5.99333
                            9.25342 6.26359ZM10.782 8.64131H9.76293C9.66952
                            8.64131 9.59309 8.71773 9.59309
                            8.81114V14.5856C9.59309 14.679 9.66952 14.7554
                            9.76293 14.7554H10.782C10.8754 14.7554 10.9518
                            14.679 10.9518 14.5856V8.81114C10.9518 8.71773
                            10.8754 8.64131 10.782 8.64131Z" />
                        </g>
                        <defs>
                          <clipPath id="clip0_293_1221">
                            <rect
                              width="20"
                              height="20"
                              fill="white"
                              transform="translate(0.272461)" />
                          </clipPath>
                        </defs>
                      </svg>

                    </button>

                    <button
                      class="p-1 hover:bg-primary-500 rounded"
                      on:click|preventDefault={() => {
                        $appSettings.modal = 'profileEdit'
                      }}>
                      edit info
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
