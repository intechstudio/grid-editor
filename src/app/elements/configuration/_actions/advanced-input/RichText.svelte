<script>

  import { createEventDispatcher, onMount } from 'svelte';
  
  import { get, writable } from 'svelte/store';

  import { clickOutside } from '../../../../settings/ui/helpers/clickOutside';

  import { actionPrefStore, advancedPrefStore } from '../../../action-preferences.store';

  const dispatch = createEventDispatcher();
  
  export let inputSet = [];

  export let style;

  export let blockAddedOnClick;

  export let index;

  let focus;
  let content = "";
  let editable;
  let isBackspace = false;

  $: if(blockAddedOnClick && $advancedPrefStore.index == index && editable){
    content = editable.textContent.slice(0, chars) + blockAddedOnClick.desc + editable.textContent.slice(chars);
  }

  function createPattern(options){
    return options.map(opt => {
      let str = opt.desc;
      if(opt.type == 'operator'){
        return `${'\\' + str}`
      } else {
        return `${'\\b' + str + '\\b'}`
      }
    }).join("|")
  }

  function updateContent(e) {
    // and strip the html tags
    if (editable) content = editable.textContent;
  }

  function marker(txt, rex) {
    function markTerm(term) {
      let idx = findMatch(term, txt);
      return `<mark class="bg-secondary ${{'variable': 'text-blue-400', 'function': 'text-pink-400', 'setter': 'text-red-400', 'getter': 'text-green-400', 'operator': 'text-white', 'action': 'text-yellow-400' }[idx] ?? 'text-white'}" >${term}</mark>`;
    }
    return txt.replace(rex, (term) => markTerm(term));
  }

  export function highlight(node, [rawRex, text]) {
    function action() {
      if (text) node.innerHTML = marker(text, new RegExp(rawRex, "g"));
    }
    action();
    return {
      update(obj) {
        [rawRex, text] = obj;
        action();
        setCurrentCursorPosition();
        dispatch('text', editable.textContent);
      },
    };
  }
  
  function findMatch(term, txt){
    let obj = inputSet.find(elem => elem.desc == term);
    if(obj) {obj = obj.type} else {obj = undefined}
    return obj;
  }

let chars;

function createRange(node, chars, range) {
    if (!range) {
        range = document.createRange()
        range.selectNode(node);
        range.setStart(node, 0);
    }
    if (chars.count === 0) {
        range.setEnd(node, chars.count);
    } else if (node && chars.count >0) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.length < chars.count) {
                chars.count -= node.textContent.length;
            } else {
                 range.setEnd(node, chars.count);
                 chars.count = 0;
            }
        } else {
            for (var lp = 0; lp < node.childNodes.length; lp++) {
                range = createRange(node.childNodes[lp], chars, range);
                if (chars.count === 0) {
                   break;
                }
            }
        }
   } 
   return range;
};

function setCurrentCursorPosition() {
    !isBackspace ? chars += 1 : chars -= 1
    if(blockAddedOnClick) chars = chars + blockAddedOnClick.desc.length - 1;
    if (chars >= 0) {
        var selection = window.getSelection();
        let range = createRange(editable, { count: chars });
        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }       
    // reset the manul clicked element
    blockAddedOnClick = undefined;
};

function isChildOf(node, parentId) {
    while (node !== null) {
        if (node.id === parentId) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
};

function getCurrentCursorPosition(e) {

    e.code == 'Backspace' ? isBackspace = true : isBackspace = false;
    
    var selection = window.getSelection(),
        charCount = -1,
        node;
    
    if (selection.focusNode) {
        if (isChildOf(selection.focusNode, editable.id)) {
            node = selection.focusNode; 
            charCount = selection.focusOffset;
            while (node) {
                if (node.id === editable.id) {
                    break;
                }
                if (node.previousSibling) {
                    node = node.previousSibling;
                    charCount += node.textContent.length;
                } else {
                     node = node.parentNode;   
                     if (node === null) {
                         break
                     }
                }
           }
      }
    }
    chars = charCount;
  }

</script>

<main class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  <div 
    spellcheck="false"
    id="rich-text-input"
    contenteditable="true"
    use:highlight={[createPattern(inputSet), content]}
    bind:this={editable}
    on:keydown={(e)=>{getCurrentCursorPosition(e);}}
    on:mouseup={(e)=>{getCurrentCursorPosition(e);}}
    on:input={updateContent}
    on:focus={()=>{advancedPrefStore.setIndex(index)}}
    {style}
    class="w-full inline-block bg-secondary font-mono text-white p-1 pl-2 rounded-none focus:outline-none">    
  </div>
</main>

<style>


  ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
      background: #1e2628;
  }
  
  ::-webkit-scrollbar-thumb {
      background: #286787;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }
  
  ::-webkit-scrollbar-corner {
      background: #1e2628
  }
  
  :global(mark.red) {
    @apply text-red-400;
  }
  
  :global(mark.blue) {
    @apply text-purple-400;
  }
  
  :global(mark.other) {
    @apply text-yellow-400;
  }
  
  :global(mark) {
    color: white;
    /*@apply bg-secondary;*/
  }
  
  
  </style>