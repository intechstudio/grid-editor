<script>

  export let size = 1;
  export let elementNumber;
  const encoderSize = 13;

</script>

<svg 
style="filter:url(#dropshadow)"
data-control-number={elementNumber}
width="{ size * encoderSize + 'px' }" height="{ size * encoderSize + 'px' }" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M29.5 15C29.5 23.0081 23.0081 29.5 15 29.5C6.99187 29.5 0.5 23.0081 0.5 15C0.5 6.99187 6.99187 0.5 15 0.5C23.0081 0.5 29.5 6.99187 29.5 15Z" fill="#323232" stroke="#2B2B2B"/>
<path d="M15 3L21 4.6077L25.3923 9L27 15L25.3923 21L21 25.3923L15 27L9 25.3923L4.6077 21L3 15L4.6077 9L9 4.6077L15 3Z" fill="#373737"/>

  <filter id="dropshadow" y="-20%" height="500%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> <!-- stdDeviation is how much to blur -->
    <feOffset dx="2" dy="4" result="offsetblur"/> <!-- how much to offset -->
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.5"/> <!-- slope is the opacity of the shadow -->
    </feComponentTransfer>
    <feMerge> 
      <feMergeNode/> <!-- this contains the offset blurred image -->
      <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
    </feMerge>
  </filter>
</svg>