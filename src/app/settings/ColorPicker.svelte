<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let startColor = "rgb(255,0,0)"; //rgb!
  export let alpha = 1;
  export let showAlpha = true;

  let hueValue = 0;
  let alphaValue = 0;
  
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
      startColor = rgb2hex(startColor).toUpperCase();
      let hex = startColor.replace('#','');
      if (hex.length !== 6 && hex.length !== 3 && !hex.match(/([^A-F0-9])/gi)) {
        //alert('Invalid property value (startColor)');
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
      hueValue = h * 1536;
      alphaValue = a * 100;
  }
  
  function colorChangeCallback() {
    //console.log('colorChangeCallback', r,g,b,a);
    dispatch('colorChange', {
        r: r,
        g: g,
        b: b,
        a: a
      });
  }

  function mouseUp(event) {
   tracked = null;
  }
  
  function hueDown(event) {
   let slider = event.target.value;
   h = slider / 1536;
   colorChange();
  }

  
  function alphaDown(event) {
    let slider = event.target.value;
    a = slider / 100;
    colorChange();
  }
  
  function colorChange() {
    //console.log('colorChange');
    let rgb = hsvToRgb(h, s, v);
    r = rgb[0];
    g = rgb[1];
    b = rgb[2];
    hexValue = RGBAToHex();
    colorChangeCallback();
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
          console.log('rgbToHSV-diff')
          colorChange();
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
        //disable sending colorchange on init
        //colorChange(); 
      }
      else {
        return {h:hnew,s:snew,v:vnew};
      }
  }

  function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
  }

  onMount(() => {
    setStartColor();
  });

  </script>
  
  <style>
  
  .slider{
    outline: none;
  }

  .slider::-webkit-slider-thumb{
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    @apply shadow;
    @apply rounded-full;
    background: white;
    cursor: pointer;
  }

  .hue-selector {
    -webkit-appearance: none;
    -moz-apperance: none;
    background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
    border-radius: 10px;
    height: 10px;
    width: 100%;
    display: inline-block;
  }
  
  .alpha-value {
    -webkit-appearance: none;
    background: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }

  .alpha-selector {
    -webkit-appearance: none;
    display:flex;
    width: 100%;
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
    border-radius: 10px;
    height: 10px;
    position: relative;
  }
  

  </style>
  
  <div class="w-full flex flex-col secondary rounded p-4">
    <input class:mb-2="{showAlpha}" on:input={hueDown} bind:value={hueValue} class="hue-selector slider" type="range" min="0" max="1536">

    {#if showAlpha}
      <div class="alpha-selector mt-2"> 
        <input class="alpha-value slider" on:input={alphaDown} bind:value={alphaValue} type="range" min="0" max="100">
      </div>
    {/if}

  </div>