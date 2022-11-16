<script>
  import { clickOutside } from '/main/_actions/click-outside.action'
  import { appSettings } from '/runtime/app-helper.store'

  let editor
  let modalWidth
  let modalHeight

  let liked = false

  modalWidth = 500

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout()
    }
  }

  function isProfileLiked() {
    liked = !liked
  }
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />
<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50 ">

  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      $appSettings.modal = ''
    }}
    class=" z-50 w-4/6 h-fit max-h-[3/4] text-white relative flex flex-col
    shadow bg-primary bg-opacity-100 items-start opacity-100 p-6">

    <div>Profile Info</div>
    <button
      on:click={() => {
        $appSettings.modal = ''
      }}
      id="close-btn"
      class="p-1 absolute top-6 right-6 cursor-pointer rounded not-draggable
      hover:bg-secondary">
      <svg
        class="w-5 h-5 p-1 fill-current text-gray-300"
        viewBox="0 0 29 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091
          2.37512L2.37506 0.142151Z" />
        <path
          d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934
          0.142151L28.4264 2.37512Z" />
      </svg>
    </button>

    <div class="p-6 flex flex-row gap-10 overflow-auto">
      <div class="w-3/5 flex flex-col gap-4">
        <div>
          <div class="text-green-400 font-semibold mb-2">Category</div>
          <div class="text-lg font-medium">Productivity macros</div>
        </div>
        <div>
          <img src="/assets/imgs/profile_info_image.png" alt="" />
        </div>
        <div>
          <p>
            Lorem ipsum dolor sit amet consectetur. Placerat a sed tempor
            consequat. Lacinia enim laoreet nullam varius bibendum. Dignissim
            consectetur lacinia lacinia ultrices ipsum quis. Ac facilisis ut id
            aliquam potenti consequat mi quam. Vestibulum imperdiet blandit
            tempor ipsum in libero facilisi. Nulla vulputate odio ut ullamcorper
            elit. Hendrerit sit velit mauris sit.
          </p>
        </div>
        <div>
          <ul class="list-disc list-inside">
            <li>Lorem ipsum dolor sit amet consectetur.</li>
            <li>Auctor porttitor dui eget gravida et mi.</li>
            <li>Nibh sed massa in convallis arcu viverra.</li>
            <li>Lobortis mauris in dignissim id accumsan quam vitae.</li>
            <li>
              Eget nibh augue tellus rutrum sed nisl sed morbi proin. Maecenas
              nisl purus orci mattis enim nunc. Lectus et bibendum nisi amet
              eget nec habitasse dignissim nec.
            </li>
            <li>
              Tellus eros cursus ullamcorper aliquam nisi nam id justo. Purus
              sagittis vitae velit velit. Neque nam convallis venenatis urna
              iaculis.
            </li>
          </ul>
        </div>
      </div>
      <div class="w-2/5">

        <div class="bg-secondary py-8 px-6 rounded-lg flex flex-col gap-6">

          <div>
            <div class="font-semibold mb-2 ">Author</div>

            <div
              class="flex flex-row items-center justify-between
              border-primary-700 border-b border-t-0 border-x-0 pb-4">

              <div class="flex flex-col items-center">
                <img
                  class="mb-2 mr-2"
                  src="/assets/imgs/user_image.png"
                  alt="img" />
                <span class="font-medium">Jordan</span>
              </div>

              <div class="text-center">
                <button
                  on:click={() => {
                    isProfileLiked()
                  }}>
                  {#if !liked}
                    <svg
                      class="fill-white"
                      width="35"
                      height="32"
                      viewBox="0 0 38 35"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        shape-rendering="optimizeQuality"
                        d="M37.0596 6.96976C36.4705 5.60586 35.6212 4.3699
                        34.5591 3.33109C33.4962 2.28917 32.243 1.46117 30.8677
                        0.892121C29.4415 0.299708 27.912 -0.00352347 26.3677
                        3.08886e-05C24.2012 3.08886e-05 22.0874 0.593293 20.2505
                        1.7139C19.811 1.98196 19.3936 2.2764 18.998
                        2.5972C18.6025 2.2764 18.1851 1.98196 17.7456
                        1.7139C15.9087 0.593293 13.7949 3.08886e-05 11.6284
                        3.08886e-05C10.0684 3.08886e-05 8.55664 0.298859 7.12842
                        0.892121C5.74853 1.46341 4.50488 2.28519 3.43701
                        3.33109C2.37352 4.36873 1.52398 5.60498 0.936523
                        6.96976C0.325684 8.38919 0.0136719 9.89651 0.0136719
                        11.4478C0.0136719 12.9112 0.3125 14.4361 0.905762
                        15.9873C1.40234 17.2837 2.11426 18.6284 3.02393
                        19.9864C4.46533 22.1353 6.44727 24.3765 8.9082
                        26.6485C12.9863 30.4146 17.0249 33.0161 17.1963
                        33.1216L18.2378 33.7896C18.6992 34.084 19.2925 34.084
                        19.7539 33.7896L20.7954 33.1216C20.9668 33.0118 25.001
                        30.4146 29.0835 26.6485C31.5444 24.3765 33.5264 22.1353
                        34.9678 19.9864C35.8774 18.6284 36.5938 17.2837 37.0859
                        15.9873C37.6792 14.4361 37.978 12.9112 37.978
                        11.4478C37.9824 9.89651 37.6704 8.38919 37.0596
                        6.96976ZM18.998 30.3135C18.998 30.3135 3.35352 20.2896
                        3.35352 11.4478C3.35352 6.96976 7.0581 3.33987 11.6284
                        3.33987C14.8408 3.33987 17.627 5.13284 18.998
                        7.75198C20.3691 5.13284 23.1553 3.33987 26.3677
                        3.33987C30.938 3.33987 34.6426 6.96976 34.6426
                        11.4478C34.6426 20.2896 18.998 30.3135 18.998 30.3135Z" />
                    </svg>
                  {/if}
                  {#if liked}
                    <svg
                      class="fill-red-600"
                      width="35"
                      height="32"
                      viewBox="0 0 38 35"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        shape-rendering="optimizeQuality"
                        d="M37.0459 6.96979C36.4569 5.60589 35.6075 4.36993
                        34.5454 3.33112C33.4825 2.2892 32.2293 1.4612 30.854
                        0.892151C29.4279 0.299738 27.8983 -0.00349296 26.354
                        6.14062e-05C24.1875 6.14062e-05 22.0737 0.593323 20.2368
                        1.71393C19.7974 1.98199 19.3799 2.27643 18.9844
                        2.59723C18.5889 2.27643 18.1714 1.98199 17.7319
                        1.71393C15.895 0.593323 13.7812 6.14062e-05 11.6147
                        6.14062e-05C10.0547 6.14062e-05 8.54297 0.29889 7.11475
                        0.892151C5.73486 1.46344 4.49121 2.28522 3.42334
                        3.33112C2.35985 4.36876 1.5103 5.60501 0.922852
                        6.96979C0.312012 8.38922 0 9.89655 0 11.4478C0 12.9112
                        0.298828 14.4361 0.89209 15.9874C1.38867 17.2838 2.10059
                        18.6285 3.01025 19.9864C4.45166 22.1353 6.43359 24.3765
                        8.89453 26.6485C12.9727 30.4146 17.0112 33.0162 17.1826
                        33.1216L18.2241 33.7896C18.6855 34.084 19.2788 34.084
                        19.7402 33.7896L20.7817 33.1216C20.9531 33.0118 24.9873
                        30.4146 29.0698 26.6485C31.5308 24.3765 33.5127 22.1353
                        34.9541 19.9864C35.8638 18.6285 36.5801 17.2838 37.0723
                        15.9874C37.6655 14.4361 37.9644 12.9112 37.9644
                        11.4478C37.9688 9.89655 37.6567 8.38922 37.0459 6.96979Z" />
                    </svg>
                  {/if}
                </button>

                <div class="font-medium">200</div>
              </div>

            </div>
          </div>

          <div class="flex flex-col gap-1">
            <div>Compatible controllers: EF44</div>
            <div class="flex items-center gap-2">
              <span>Compatible with Ableton</span>
              <img
                class="w-10"
                src="/assets/svgs/ableton_logo.svg"
                alt="ableton_logo" />

            </div>
            <div>Made with Grid Editor v1.2.27</div>
          </div>
        </div>

      </div>

    </div>

  </div>

</modal>
