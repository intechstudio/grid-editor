<script>

  export let id;
  export let moduleWidth;
  export let rotation;
  export let bank;

  let overlayDesign; 

  $: breakpoint = moduleWidth > 200 ? 'large' : 'small';

  let controlElementSettings;

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

</script>

<div class="overlay text-white w-full">
  {#each control_block(2) as block }
    <div class="text-xs flex flex-col justify-around items-center" style="width: {moduleWidth / 2 +'px'}">
      {#each control_block(2) as element }
        <div class="text-xs flex flex-col items-center justify-center border border-gray-700 hover:bg-highlight cursor-pointer w-full" style="height: {moduleWidth / 2 + 'px'}; transform: rotate({-1*rotation+'deg'})">
          {element * 2 + block}
        </div>
      {/each}
    </div>
  {/each}
</div>



<style>

  .overlay{
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    background-color: rgba(30 ,30,30,0.8);
    border-radius: 0.75rem;
    justify-content: space-around;
    backdrop-filter: blur(1px);
    z-index: 50;
  }

</style>