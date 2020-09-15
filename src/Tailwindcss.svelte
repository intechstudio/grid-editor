<style global>
  @tailwind base;
  @tailwind components;

  html {
    font-size: 14px;
  }

  body {
    @apply p-0;
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
