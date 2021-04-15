<script>

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let toggleValue = ''
  
  function handleChange(){
    dispatch('change',{})
  }

</script>

<input type="checkbox" bind:checked={toggleValue} on:change={handleChange} class="toggle">

<style>

  input[type="checkbox"]{
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }

  input[type="checkbox"]:focus{
    outline: 0;
  }

  .toggle{
    height: 26px;
    width: 42px;
    border-radius: 16px;
    display: inline-block;
    position: relative;
    margin: 0;
    border: 2px solid #474755;
    background: linear-gradient(180deg, #2D2F39 0%, #1F2027 100%);
    transition: all .2s ease;
  }

  .toggle::after{
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 2px rgba(44,44,44,.2);
    transition: all .2s cubic-bezier(.5,.1,.75,1.35);
  }

  .toggle:checked{
    border-color: #cc5b5b;
  }

  .toggle:checked::after{
      transform: translatex(16px)
  }

</style>