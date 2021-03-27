<script>

  import { createEventDispatcher } from 'svelte';
  
  import { get, writable } from 'svelte/store';

  import { clickOutside } from '../../../settings/ui/helpers/clickOutside';

  import { actionPrefStore, advancedPrefStore } from '../../action-preferences.store';

  const dispatch = createEventDispatcher();

  export let dropDownValue = '';
  
  export let optionList = [];

  export let manual;

  export let index;

  let focus;

  let content = "";
  let editable;
  let isBackspace = false;

  $: if(manual && $advancedPrefStore.index == index && editable){
    content = editable.textContent.slice(0, chars) + manual.value + editable.textContent.slice(chars)     
  }

  function handleChange(){
    dispatch('change',{})
  }

  function updateContent(e) {
    // and strip the html tags
    if (editable) content = editable.textContent;
  }

  function marker(txt, rex) {
    function markTerm(term) {
      // replacer function
      let idx = findMatch(term);
      return `<mark class="${{'variable': 'red', 'function': 'blue'}[idx] ?? 'other'}">${term}</mark>`;
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
        setCurrentCursorPosition(text)
      },
    };
  }
  
  function findMatch(term){
    let obj = optionList.find(elem => elem.desc == term);
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

function setCurrentCursorPosition(text /**chars*/) {
  

    !isBackspace ? chars += 1 : chars -= 1

    if(manual) chars = chars + manual.value.length - 1;

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
    manual = undefined;
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

function getCurrentCursorPosition(e /*parentId*/) {
    
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


function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}


</script>

<main class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  <div 
  id="rich-text-input"
  contenteditable="true"
  use:highlight={[optionList.map(opt => opt.value).join("|"), content]}
  bind:this={editable}
  on:keydown={(e) => {getCurrentCursorPosition(e); e.code == 'Backspace' ? isBackspace = true : isBackspace = false;}}
  on:input={updateContent}
  on:mouseup={(e)=>{getCurrentCursorPosition(e);}}
  on:keyup={(e)=>{}}
  on:focus={()=>{advancedPrefStore.setIndex(index)}}
  class="w-full inline-block bg-secondary font-mono text-white p-1 pl-2 rounded-none focus:outline-none">
    
  </div>
  
  {#if focus}
  <ul class:shadow={focus} style="max-height:250px; min-width:100px;z-index:9000;" class="fixed scrollbar block border-t overflow-y-auto border-important text-white cursor-pointer  w-auto bg-secondary">
    
  </ul>
  {/if}
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
  @apply bg-secondary;
}


</style>