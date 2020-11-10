<script>
    import {flip} from "svelte/animate";

    import { actionListChange } from './action-list-change.store.js'; 

    export let actions = [];

    let ghost;
    let grabbed;

    let lastTarget;

    let mouseY = 0; // pointer y coordinate within client
    let offsetY = 0; // y distance from top of grabbed element to pointer
    let layerY = 0; // distance from top of list to top of client

    let flag;

    function changeOrder(arg){
        actionListChange.click(arg);
    }

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
        let temp = actions[from];
        actions = [...actions.slice(0, from), ...actions.slice(from + 1)];
        actions = [...actions.slice(0, to), temp, ...actions.slice(to)];
        changeOrder('trigger');
    }

    function release(ev) {
        console.log('release');
        grabbed = null;
    }

</script>

<style>
    main {
        position: relative;
    }

    .list {
        /*z-index: 5;*/
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
        padding-bottom: 0;
    }

    .item:not(#grabbed):not(#ghost) {
        /*z-index: 10;*/
    }

    .item > * {
        margin: auto;
    }

    .buttons {
        width: 28px;
        height: 28px;
        min-width: 28px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .buttons button {
        cursor: pointer;
        width: 14px;
        height: 14px;
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
        {#each actions as action, index (action)}
            <div 
                id={(grabbed && (action.id ? action.id : JSON.stringify(action)) == grabbed.dataset.id) ? "grabbed" : ""}
                class="item"
                data-index={index}
                data-id={(action.id ? action.id : JSON.stringify(action))}
                data-grabY="0" 
                animate:flip|local={{duration: 200}}>
                <div class="pb-2 text-white">{action.name}</div>
                <div class="wrapper">
                    <div>
                        <div class="invisible text-xs">Order</div>
                        <div class="buttons bg-secondary">
                            <button 
                                class="up focus:outline-none  border-none" 
                                style={"display: " + (index > 0 ? "" : "none") + ";"}
                                on:click={function(ev) {moveDatum(index, index - 1);}}>
                                <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12px" height="12px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
                                </button>
                            <button 
                                class="down focus:outline-none border-none" 
                                style={"display: " + (index < actions.length - 1 ? "" : "none") + ";"}
                                on:click={function(ev) {moveDatum(index, index + 1);}}>
                                <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12px" height="12px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                                </button>
                        </div>    
                    </div>
                    <slot {action} {index}></slot>            
                </div>         
            </div>
            
        {/each}
    </div>
</main>