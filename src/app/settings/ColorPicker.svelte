<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let startColor /*= '#FF0000'; */
  export let alpha;
  export let index;
  export let width = 240;
  
  Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
  };

  const dispatch = createEventDispatcher();
  let tracked;
  let h = 1;
  let s = 1;
  let v = 1;
  let a = 1;
  let r = 255;
  let g = 0;
  let b = 0;
  let hexValue /* = '#FF0000';*/
  
  function setStartColor() {
      let hex = startColor.replace('#','');
      if (hex.length !== 6 && hex.length !== 3 && !hex.match(/([^A-F0-9])/gi)) {
        alert('Invalid property value (startColor)');
        return;
      }
      let hexFiltered='';
      if (hex.length === 3)
        hex.split('').forEach( c => {hexFiltered += c+c;});
      else
        hexFiltered=hex;
      hexValue = hexFiltered;
      r = parseInt(hexFiltered.substring(0,2), 16);
      g = parseInt(hexFiltered.substring(2,4), 16);
      b = parseInt(hexFiltered.substring(4,6), 16);
      a = alpha;
      rgbToHSV(r,g,b,true);
      updateHuePicker();
      updateAlphaPicker();
    
  }
  
  function removeEventListenerFromElement(elementId, eventName, listenerCallback) {
    let element = document.querySelector(elementId);
    if (element) element.removeEventListener(eventName, listenerCallback);
  }
  
  function killMouseEvents() {
    removeEventListenerFromElement("#alpha-event"+index, "mousedown", alphaDown);
    removeEventListenerFromElement("#colorsquare-event"+index, "mousedown", csDown);
    removeEventListenerFromElement("#hue-event"+index, "mousedown", hueDown);
    document.removeEventListener("mouseup",mouseUp);
    document.removeEventListener("mousemove",mouseMove);
    document.removeEventListener("touchstart",killMouseEvents);
    document.removeEventListener("mousedown",killTouchEvents);
  }
  
  function killTouchEvents() {
    removeEventListenerFromElement("#alpha-event"+index, "touchstart", alphaDownTouch);
    removeEventListenerFromElement("#colorsquare-event"+index, "touchstart", csDownTouch);
    removeEventListenerFromElement("#hue-event"+index, "touchstart", hueDownTouch);
    document.removeEventListener("touchend",mouseUp);
    document.removeEventListener("touchmove",touchMove);
    document.removeEventListener("touchstart",killMouseEvents);
    document.removeEventListener("mousedown",killTouchEvents);
  }
  
  function updateHuePicker() {
    let huePicker = document.querySelector("#hue-picker"+index);
    let xPercentage = h * 100;
    huePicker.style.left = xPercentage + "%";
  }

  function updateAlphaPicker() {
    let alphaPicker = document.querySelector("#alpha-picker"+index);
    let xPercentage = a * 100;
    alphaPicker.style.left = xPercentage + "%";
  }
  
  function colorChangeCallback() {
    dispatch('colorChange', {
        r: r,
        g: g,
        b: b,
        a: a
      });
  }
  
  function mouseMove(event) {
   if (tracked) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let trackedPos = tracked.getBoundingClientRect();
    let xPercentage, yPercentage, picker;
    switch (tracked.id) {
     case "hue-event"+index:
      xPercentage = (mouseX - 10 - trackedPos.x) / (width-20) * 100;
      (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
      xPercentage = xPercentage.toFixed(2);
      picker = document.querySelector("#hue-picker"+index);
      picker.style.left = xPercentage + "%";
      h = xPercentage / 100;
      hueChange();
      break;
     case "alpha-event"+index:
      xPercentage = (mouseX - 10 - trackedPos.x) / (width-20) * 100;
      (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
      xPercentage = xPercentage.toFixed(2);
      picker = document.querySelector("#alpha-picker"+index);
      picker.style.left = xPercentage + "%";
      a = xPercentage / 100;
      colorChange();
      break;
    }
  
   }
  
  }
  
  function touchMove(event) {
   if (tracked) {
    let mouseX = event.touches[0].clientX;
    let mouseY = event.touches[0].clientY;
    let trackedPos = tracked.getBoundingClientRect();
    let xPercentage, yPercentage, picker;
    switch (tracked.id) {
     case "hue-event"+index:
      xPercentage = (mouseX - 10 - trackedPos.x) / (width-20) * 100;
      (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
      xPercentage = xPercentage.toFixed(2);
      picker = document.querySelector("#hue-picker"+index);
      picker.style.left = xPercentage + "%";
      h = xPercentage / 100;
      hueChange();
      break;
     case "alpha-event"+index:
      xPercentage = (mouseX - 10 - trackedPos.x) / (width-20) * 100;
      (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
      xPercentage = xPercentage.toFixed(2);
      picker = document.querySelector("#alpha-picker"+index);
      picker.style.left = xPercentage + "%";
      a = xPercentage / 100;
      colorChange();
      break;
    }
  
   }
  
  }
  
  function csDown(event) {
   tracked = event.currentTarget;
   let xPercentage = ((event.offsetX + 1) / width) * 100;
   let yPercentage = ((event.offsetY + 1) / 160) * 100;
   yPercentage = yPercentage.toFixed(2);
   xPercentage = xPercentage.toFixed(2)
   let picker = document.querySelector("#colorsquare-picker"+index);
   picker.style.top = yPercentage + "%";
   picker.style.left = xPercentage + "%";
   s = xPercentage / 100;
   v = 1 - yPercentage / 100;
   colorChange();
  }
  
  function csDownTouch(event) {
   tracked = event.currentTarget;
   let rect = event.target.getBoundingClientRect();
   let offsetX = event.targetTouches[0].clientX - rect.left;
   let offsetY = event.targetTouches[0].clientY - rect.top;
   let xPercentage = ((offsetX + 1) / width) * 100;
   let yPercentage = ((offsetY + 1) / 160) * 100;
   yPercentage = yPercentage.toFixed(2);
   xPercentage = xPercentage.toFixed(2)
   let picker = document.querySelector("#colorsquare-picker"+index);
   picker.style.top = yPercentage + "%";
   picker.style.left = xPercentage + "%";
   s = xPercentage / 100;
   v = 1 - yPercentage / 100;
   colorChange();
  }
  
  function mouseUp(event) {
   tracked = null;
  }
  
  function hueDown(event) {
   tracked = event.currentTarget;
   let xPercentage = ((event.offsetX - 9) / (width-20)) * 100;
   xPercentage = xPercentage.toFixed(2);
   let picker = document.querySelector("#hue-picker"+index);
   picker.style.left = xPercentage + "%";
   h = xPercentage / 100;
   hueChange();
  }
  
  function hueDownTouch(event) {
   tracked = event.currentTarget;
   let rect = event.target.getBoundingClientRect();
   let offsetX = event.targetTouches[0].clientX - rect.left;
   let xPercentage = ((offsetX - 9) / (width-20)) * 100;
   xPercentage = xPercentage.toFixed(2);
   let picker = document.querySelector("#hue-picker"+index);
   picker.style.left = xPercentage + "%";
   h = xPercentage / 100;
   hueChange();
  }
  

  function hueChange() {
   colorChange();
  }

 
  function colorChange() {
   let rgb = hsvToRgb(h, s, v);
   r = rgb[0];
   g = rgb[1];
   b = rgb[2];
   hexValue = RGBAToHex();
   console.log('colorchange',rgb);
   colorChangeCallback();
  }


  function alphaDown(event) {
   tracked = event.currentTarget;
   let xPercentage = ((event.offsetX - 9) / (width-20)) * 100;
   xPercentage = xPercentage.toFixed(2);
   let picker = document.querySelector("#alpha-picker"+index);
   picker.style.left = xPercentage + "%";
   a = xPercentage / 100;
   colorChange();
  }
  
  function alphaDownTouch(event) {
   tracked = event.currentTarget;
   let rect = event.target.getBoundingClientRect();
   let offsetX = event.targetTouches[0].clientX - rect.left;
   let xPercentage = ((offsetX - 9) / (width-20)) * 100;
   xPercentage = xPercentage.toFixed(2);
   let picker = document.querySelector("#alpha-picker"+index);
   picker.style.left = xPercentage + "%";
   a = xPercentage / 100;
   colorChange();
  }
  
  //Math algorithms
  function hsvToRgb(h, s, v) {
   var r, g, b;
  
   var i = Math.floor(h * 6);
   var f = h * 6 - i;
   var p = v * (1 - s);
   var q = v * (1 - f * s);
   var t = v * (1 - (1 - f) * s);
  
   switch (i % 6) {
    case 0:
     r = v, g = t, b = p;
     break;
    case 1:
     r = q, g = v, b = p;
     break;
    case 2:
     r = p, g = v, b = t;
     break;
    case 3:
     r = p, g = q, b = v;
     break;
    case 4:
     r = t, g = p, b = v;
     break;
    case 5:
     r = v, g = p, b = q;
     break;
   }
  
   return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  
  function RGBAToHex() {
   let rHex = r.toString(16);
   let gHex = g.toString(16);
   let bHex = b.toString(16);
  
   if (rHex.length == 1)
    rHex = "0" + rHex;
   if (gHex.length == 1)
    gHex = "0" + gHex;
   if (bHex.length == 1)
    bHex = "0" + bHex;
  
  
   return ("#" + rHex + gHex + bHex).toUpperCase();
  }
  
  function rgbToHSV(r, g, b, update) {
      let rperc, gperc, bperc,max,min,diff,pr,hnew,snew,vnew;
      rperc = r / 255;
      gperc = g / 255;
      bperc = b / 255;
      max = Math.max(rperc, gperc, bperc);
      min = Math.min(rperc, gperc, bperc);
      diff = max - min;
  
      vnew = max;
      (vnew == 0) ? snew = 0 : snew = diff / max ;
  
      for (let i=0;i<3;i++) {
        if ([rperc,gperc,bperc][i] === max) {
          pr=i;
          break;
        }
      }
      if (diff==0) {
        hnew = 0;
        if (update) {
          h=hnew;
          s=snew;
          v=vnew;
          hueChange();
          return;
        }
        else {
          return {h:hnew,s:snew,v:vnew};
        }
      }
      else {
        switch (pr) {
          case 0:
            hnew=60*(((gperc-bperc)/diff)%6)/360
            break;
          case 1:
            hnew=60*(((bperc-rperc)/diff)+2)/360
            break;
          case 2:
            hnew=60*(((rperc-gperc)/diff)+4)/360
            break;
        }
        if (hnew < 0) hnew+=6;
      }
  
      if (update) {
        h=hnew;
        s=snew;
        v=vnew;
        hueChange();
      }
      else {
        return {h:hnew,s:snew,v:vnew};
      }
  }


  onMount(() => {
   document.addEventListener("mouseup", mouseUp);
   document.addEventListener("touchend", mouseUp);
   document.addEventListener("mousemove", mouseMove);
   document.addEventListener("touchmove", touchMove);
   document.addEventListener("touchstart", killMouseEvents);
   document.addEventListener("mousedown", killTouchEvents);
   setStartColor();
  });

  </script>
  
  <style>

  .main-container {
    width: 240px;
    -webkit-touch-callout: none;
      -webkit-user-select: none;
       -khtml-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none;
  }
  
  .hue-selector {
    background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
    margin: 15px 10px 10px 10px;
    border-radius: 10px;
    height: 10px;
  }
  
  .hue-picker {
    background: #FFF;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    left: 0%;
    position: relative;
    cursor: default;
    transform: translate(-5px, -1px);
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
  }
  
  .hue-event {
    width: var(--picker-width);
    height: 14px;
    transform: translate(-8px, -14px);
    cursor: default;
    touch-action: none;
  }
  
  .alpha-selector {
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
    margin: 10px 10px;
    border-radius: 10px;
    height: 10px;
    position: relative;
  }
  
  .alpha-picker {
    background: #FFF;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    left: 100%;
    position: relative;
    cursor: default;
    transform: translate(-5px, -11px);
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
  }
  
  .alpha-event {
    width: var(--picker-width);
    height: 14px;
    transform: translate(-8px, -24px);
    cursor: default;
    touch-action: none;
  }
  
  .alpha-value {
    background: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }
  
  #colorsquare-picker {
    margin: 0;
    padding: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #FFFB;
    position: relative;
    transform: translate(-9px, -9px);
    left: 100%;
  }
  
  #colorsquare-event {
    width: 100%;
    height: 100%;
    position: relative;
    transform: translate(0, -16px);
    touch-action: none;
  }

  </style>
  
  <div class="main-container secondary rounded p-1">

    <div class="hue-selector">
        <div class="hue-picker" id="hue-picker{index}"></div>
        <div class="hue-event" style="--picker-width: {width +'px'}" id="hue-event{index}" on:mousedown={hueDown} on:touchstart={hueDownTouch}></div>
    </div>
  
    <div class="alpha-selector">
        <div class="alpha-value"></div>
        <div class="alpha-picker" id="alpha-picker{index}"></div>
        <div class="alpha-event" style="--picker-width: {width + 'px'}" id="alpha-event{index}" on:mousedown={alphaDown} on:touchstart={alphaDownTouch}></div>
    </div>

  </div>