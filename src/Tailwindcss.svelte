<style global>
  @tailwind base;

  @font-face {
    font-family: "GT Pressura Pro M Trial";
    src: url("../public/assets/fonts/GT-Pressura-Pro-Mono-Trial-Light.otf") format("opentype"),;
  }

  @font-face {
    font-family: "Aldo-SemiBold";
    src: url("../public/assets/fonts/AldoPC.eot"); /* IE9 Compat Modes */
    src: url(".../public/assets/fonts/AldoPC.eot?#iefix") format("embedded-opentype"), /* IE6-IE8 */
      url("../public/assets/fonts/AldoPC.otf") format("opentype"), /* Open Type Font */
      url("../public/assets/fonts/AldoPC.svg") format("svg"), /* Legacy iOS */
      url("../public/assets/fonts/AldoPC.ttf") format("truetype"), /* Safari, Android, iOS */
      url("../public/assets/fonts/AldoPC.woff") format("woff"), /* Modern Browsers */
      url("../public/assets/fonts/AldoPC.woff2") format("woff2"); /* Modern Browsers */
    font-weight: normal;
    font-style: normal;
  }

  /* roboto-300 - latin */
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 300;
    src: url('../public/assets/fonts/roboto-v20-latin-300.eot'); /* IE9 Compat Modes */
    src: local('Roboto Light'), local('Roboto-Light'),
        url('../public/assets/fonts/roboto-v20-latin-300.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('../public/assets/fonts/roboto-v20-latin-300.woff2') format('woff2'), /* Super Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-300.woff') format('woff'), /* Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-300.ttf') format('truetype'), /* Safari, Android, iOS */
        url('../public/assets/fonts/roboto-v20-latin-300.svg#Roboto') format('svg'); /* Legacy iOS */
  }

  /* roboto-regular - latin */
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    src: url('../public/assets/fonts/roboto-v20-latin-regular.eot'); /* IE9 Compat Modes */
    src: local('Roboto'), local('Roboto-Regular'),
        url('../public/assets/fonts/roboto-v20-latin-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('../public/assets/fonts/roboto-v20-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-regular.woff') format('woff'), /* Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-regular.ttf') format('truetype'), /* Safari, Android, iOS */
        url('../public/assets/fonts/roboto-v20-latin-regular.svg#Roboto') format('svg'); /* Legacy iOS */
  }

  /* roboto-500 - latin */
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 500;
    src: url('../public/assets/fonts/roboto-v20-latin-500.eot'); /* IE9 Compat Modes */
    src: local('Roboto Medium'), local('Roboto-Medium'),
        url('../public/assets/fonts/roboto-v20-latin-500.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('../public/assets/fonts/roboto-v20-latin-500.woff2') format('woff2'), /* Super Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-500.woff') format('woff'), /* Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-500.ttf') format('truetype'), /* Safari, Android, iOS */
        url('../public/assets/fonts/roboto-v20-latin-500.svg#Roboto') format('svg'); /* Legacy iOS */
  }

  /* roboto-700 - latin */
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    src: url('../public/assets/fonts/roboto-v20-latin-700.eot'); /* IE9 Compat Modes */
    src: local('Roboto Bold'), local('Roboto-Bold'),
        url('../public/assets/fonts/roboto-v20-latin-700.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('../public/assets/fonts/roboto-v20-latin-700.woff2') format('woff2'), /* Super Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-700.woff') format('woff'), /* Modern Browsers */
        url('../public/assets/fonts/roboto-v20-latin-700.ttf') format('truetype'), /* Safari, Android, iOS */
        url('../public/assets/fonts/roboto-v20-latin-700.svg#Roboto') format('svg'); /* Legacy iOS */
  }

  @tailwind components;

  html {
    font-size: 14px;
  }

  body {
    @apply p-0;
    @apply font-roboto;
    @apply select-none;
  }

  .btn {
    @apply bg-gray-500 text-black;
  }

  .btn:hover {
    @apply bg-gray-600;
  }

  .btn-active {
    @apply bg-red-500 text-white;
  }

  .btn-active:hover {
    @apply bg-red-500;
  }

  input, select{
    @apply border-none;
  }

  @tailwind utilities;
</style>
