<script>
    import {flip} from "svelte/animate";

    export let selectedActions = [];

    let ghost;
    let grabbed;

    let lastTarget;

    let mouseY = 0; // pointer y coordinate within client
    let offsetY = 0; // y distance from top of grabbed element to pointer
    let layerY = 0; // distance from top of list to top of client

    let flag;

    function grab(clientY, element) {
    
        // modify grabbed element
        grabbed = element;
        grabbed.dataset.grabY = clientY;

        // modify ghost element (which is actually dragged)
        ghost.innerHTML = grabbed.innerHTML;

        // record offset from cursor to top of element
        // (used for positioning ghost)
        offsetY = grabbed.getBoundingClientRect().y - clientY;

        drag(clientY);
    }

    // drag handler updates cursor position
    function drag(clientY) {
        if (grabbed) {
            mouseY = clientY;
            layerY = ghost.parentNode.getBoundingClientRect().y;
        }
    }

    // touchEnter handler emulates the mouseenter event for touch input
    // (more or less)
    function touchEnter(ev) {   
        drag(ev.clientY);
        // trigger dragEnter the first time the cursor moves over a list item
        let target = document.elementFromPoint(ev.clientX, ev.clientY).closest(".item");
        if (target && target != lastTarget) {
            lastTarget = target;
            dragEnter(ev, target);
        }
    }

    function dragEnter(ev, target) {
        // swap items in data
        if (grabbed && target != grabbed && target.classList.contains("item")) {
            moveDatum(parseInt(grabbed.dataset.index), parseInt(target.dataset.index));
        }
    }

    // does the actual moving of items in data
    function moveDatum(from, to) {
        let temp = selectedActions[from];
        selectedActions = [...selectedActions.slice(0, from), ...selectedActions.slice(from + 1)];
        selectedActions = [...selectedActions.slice(0, to), temp, ...selectedActions.slice(to)];
    }

    function release(ev) {
        grabbed = null;
    }

    function handleCalls(data){
        console.log('CALLED', data)
    }

</script>

<style>
    main {
        position: relative;
    }

    .list {
        cursor: grab;
        z-index: 5;
        display: flex;
        flex-direction: column;
    }

    .wrapper{
      display:flex;
    }

    .item {
        box-sizing: border-box;
        width: 100%;
        user-select: none;
        padding-bottom: 1rem;
    }

    .item:last-child {
        margin-bottom: 0;
    }

    .item:not(#grabbed):not(#ghost) {
        z-index: 10;
    }

    .item > * {
        margin: auto;
    }

    .buttons {
        width: 32px;
        min-width: 32px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .buttons button {
        cursor: pointer;
        width: 18px;
        height: 18px;
        margin: 0 auto;
        padding: 0;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0);
        background-color: inherit;
    }

    .buttons button:focus {
        border: 1px solid white;
    }

    #grabbed {
        opacity: 0.0;
    }

    #ghost {
        pointer-events: none;
        z-index: -5;
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0.0;
    }

    #ghost * {
        pointer-events: none;
    }

    #ghost.haunting {
        z-index: 20;
        opacity: 1.0;
    }
    
</style>

<!-- All the documentation has to go up here, sorry.
     (otherwise it conflicts with the HTML or svelte/animate) 
     The .list has handlers for pointer movement and pointer up/release/end.
     Each .item has a handler for pointer down/click/start, which assigns that
     element as the item currently being "grabbed".  They also have a handler
     for pointer enter (the touchmove handler has extra logic to behave like the
     no longer extant 'touchenter'), which swaps the entered element with the
     grabbed element when triggered.
     You'll also find reactive styling below, which keeps it from being directly
     part of the imperative javascript handlers. -->

     
<main class="dragdroplist">

    <div 
        bind:this={ghost}
        id="ghost"
        class={grabbed ? "item haunting" : "item"}
        style={"top: " + (mouseY + offsetY - layerY) + "px"}><p></p></div>
    <div class="list">
        {#each selectedActions as data, index (data)}

            <div 
                id={(grabbed && (data.id ? data.id : JSON.stringify(data)) == grabbed.dataset.id) ? "grabbed" : ""}
                class="item"
                data-index={index}
                data-id={(data.id ? data.id : JSON.stringify(data))}
                data-grabY="0" 
                animate:flip|local={{duration: 200}}>
                <div class="text-white pb-2">{data.name}</div>
                <div class="wrapper">
                        {handleCalls(data)}
                    <div 
                        on:mousedown={function(ev) {grab(ev.clientY, this);}}
                        on:touchstart={function(ev) {grab(ev.touches[0].clientY, this);}}
                        on:mouseenter={function(ev) {ev.stopPropagation(); dragEnter(ev, ev.target);}}
                        on:touchmove={function(ev) {ev.stopPropagation(); ev.preventDefault(); touchEnter(ev.touches[0]);}} 
                        class="buttons bg-secondary">
                        <button 
                            class="up focus:outline-none  border-none" 
                            style={"display: " + (index > 0 ? "" : "none") + ";"}
                            on:click={function(ev) {moveDatum(index, index - 1)}}>
                            <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
                            </button>
                        <button 
                            class="down focus:outline-none border-none" 
                            style={"display: " + (index < selectedActions.length - 1 ? "" : "none") + ";"}
                            on:click={function(ev) {moveDatum(index, index + 1)}}>
                            <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                            </button>
                    </div>    
                    <slot {data} {index}></slot>            
                </div>         
            </div>
            
        {/each}
    </div>
</main>