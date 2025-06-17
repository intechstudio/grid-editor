<script>
    export let value = 0;
    export let info = '';
    export let color;
    export let trackColor;
    export let textColor;
    export let thickness = '5%';               // Thickness of stroke
    export let checkable = false;
    export let checked = false;
    export let decimals = false;

    let newValue;                           // Value already validated
    let radius, radiusBtn, xaxis, side;
    let circle, hidCircle, btnCircle;
    let rootEle;                                
    let rootWidth, rootHeight;            
    let max = 100;
    let discRadius = 80;

    $: calculate(value, rootWidth, rootHeight);



    function calculate() { 
        newValue = (value > max ? max : value < 0 ? 0 : value) || 0;

        if (circle && hidCircle) { 
            let isPercent = thickness.slice(-1) == '%';
            let breadth = parseInt(thickness) || 5;
            let border = isPercent ? (breadth / 100) * rootWidth : breadth;

            // Discount the stroke thickness on both sides
            side = rootWidth; 
            radius = (side - (border * 2)) / 2;
            radiusBtn = (radius - border) * (discRadius / 100);
            xaxis = radius;

            // Colors
            if (color) { rootEle.style.setProperty('--def-circlebar-color', color); }
            if (trackColor) { rootEle.style.setProperty('--def-circlebar-track', trackColor); }
            if (textColor) { rootEle.style.setProperty('--def-circlebar-text', textColor); }

            // Bar graph
            let dashValue = Math.round(2 * Math.PI * radius); 
            circle.style.strokeDashoffset = dashValue; 
            circle.style.strokeDasharray = dashValue; 

            circle.style.strokeWidth = border;
            circle.style.transform = `translate(${border}px, ${border}px)`;
            hidCircle.style.strokeWidth = border;
            hidCircle.style.transform = `translate(${border}px, ${border}px)`;
            hidCircle.style.transform = `translate(${border}px, ${border}px)`;

            // Position toggle button
            if (checkable) { 
                btnCircle.style.transform = `translate(${border}px, ${border}px)`; 
            }

            // Decimals
            if (decimals) {
                newValue = Math.round((newValue + Number.EPSILON) * 100) / 100;
            } else {
                newValue = Math.round(newValue);
            }

            // Value for dashoffset
            circle.style.strokeDashoffset = dashValue - (dashValue * newValue) / 100;
        }
    }
</script>

<section bind:clientWidth={rootWidth} bind:this={rootEle} class="circle">
    <div class="container">
        <svg>
            <circle cx="{xaxis}" cy="{radius}" r="{radius}" bind:this={hidCircle}></circle>
            <circle cx="{xaxis}" cy="{radius}" r="{radius}" color="{color}" bind:this={circle}></circle>
            {#if checkable}
                <circle cx="{xaxis}" cy="{radius}" r="{radiusBtn}" bind:this={btnCircle} class="btn" class:sel={checked} on:click={() => checked = !checked}></circle>
            {/if}
        </svg>   
    </div>
</section>

<style>

    div.container {
        width: 100%;
        height: 0;
        padding-bottom: 100%;
    }
    section {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        --def-circlebar-color: #DC143C;
        --def-circlebar-track: #223;
        --def-circlebar-text: #999;
    }

    svg {
        box-sizing: border-box;
        transform: rotate(270deg); 
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    svg > circle {
        width: 100%;
        height: 100%;  
        fill: transparent;
        stroke: var(--circlebar-track, var(--def-circlebar-track));
        transform: translate(5px, 5px);
        transition: all 0.2s ease;
    }

    svg > circle.btn {
        stroke-width: 0;
        fill: var(--circlebar-track, var(--def-circlebar-track));
        cursor: pointer;
    }

    svg > circle.btn.sel {
        stroke: var(--circlebar-color, var(--def-circlebar-color));
        fill: var(--circlebar-color, var(--def-circlebar-color));
    }    

    svg > circle:nth-child(2) {
        stroke: var(--circlebar-color, var(--def-circlebar-color));
    }

    .info {
        position: absolute;
        font-weight: bold;
        color: var(--circlebar-text, var(--def-circlebar-text));
        text-transform: uppercase;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        white-space: pre-line;
    }

    .btn {
        position: absolute;
        color: var(--circlebar-text, var(--def-circlebar-text));
        box-sizing: border-box;
        padding: 50px;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;    
        
    }

    .info > div {
        font-weight: normal;
        width: 90%;
        margin: auto;
    }
</style>