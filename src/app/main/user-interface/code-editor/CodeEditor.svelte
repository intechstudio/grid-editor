<script>  
  import { onMount, createEventDispatcher } from "svelte";

  import { StreamLanguage } from "@codemirror/stream-parser"
  import { EditorView } from "@codemirror/view"
  import { EditorState } from "@codemirror/state"

  import { basicSetup } from './setup/setup.js';

  import { javascript, esLint } from '@codemirror/lang-javascript';
  import { linter, openLintPanel } from '@codemirror/lint';
  import { lua } from './lang-lua/lang-package';
  import { oneDarkTheme, oneDarkHighlightStyle } from "./setup/OneDark";

  import { hoverTooltip } from "@codemirror/tooltip"

  import {showPanel} from "@codemirror/panel"
  import { lintGutter } from "./lang-lua/LintGutter";
  import { luaLint } from './lang-lua/luaLint';

  import { focusedCodeEditor } from '../../_stores/app-helper.store.js';


  const dispatch = createEventDispatcher();

  export let doc = '';
  export let showCharCount = true;
  export let showLineNumbers = true;

  export let advancedClickAddon;
  export let index;

  let dataAtCursor;

  $: if(advancedClickAddon){
    appendAtCursor();
  }

  function appendAtCursor(){
    if($focusedCodeEditor == index && editor != undefined){
      editor.dispatch({
        changes: {
          from: dataAtCursor.cursor,
          insert: advancedClickAddon.human
        }
      })
      //editor.dispatch({selection: {anchor: dataAtCursor.cursor + advancedClickAddon.human.length}})
    }
  }

  function countChars(doc) {
    let count = 0, iter = doc.iter()
    while (!iter.next().done) {
      for (let i = 0; i < iter.value.length; i++) {
        count++
      }
    }
    return `Char count: ${count}`
  }

  function charCountPanel(view) {
    // show this only in advanced large editor
    if(showCharCount){
      let dom = document.createElement("div")
      dom.textContent = countChars(view.state.doc)
      return {
        dom,
        update(update) {
          if (update.docChanged)
            dom.textContent = countChars(update.state.doc)
        }
      }
    }
  }

  function charCounter() {
    return showPanel.of(charCountPanel)
  }


  function luaParser(code){
    ast = parser.parse(code);
    return 1
  }


  let ast = undefined;

  const wordHover = hoverTooltip((view, pos, side) => {
    let {from, to, text} = view.state.doc.lineAt(pos)
    let start = pos, end = pos
    while (start > from && /[a-zA-Z_]/.test(text[start - from - 1])) start--
    while (end < to && /[a-zA-Z_]/.test(text[end - from])) end++
    if (start == pos && side < 0 || end == pos && side > 0)
      return null
    return {
      pos: start,
      end,
      above: true,
      create(view) {
        let dom = document.createElement("div")
        dom.textContent = text.slice(start-from, end-from)
        return {dom}
      }
    }
  })

  let codeblock;

  let editor;

  let widgets = [];

  const initialState = EditorState.create({
    doc: doc,
    extensions: [
      basicSetup({showLineNumbers}),
      wordHover,
      charCounter(),
      lua(),
      EditorView.updateListener.of((v) => {
        
        if(editor.hasFocus){
          focusedCodeEditor.set(index);
        }

        if(v.state.selection){
          let pos = v.state.selection.main.head;
          dataAtCursor = {cursor: pos, ...v.state.doc.lineAt(pos)}
        }

        if (v.docChanged) {

          // Document changed
          const code = v.state.doc.toString();
          // add a whitespace before 'e'
          dispatch('output', {short: 'cb', script: ` ${code.replace(/\n/g, " ")}`});
          
        }
      }),
      //linter(luaLint()),
      oneDarkTheme,
      oneDarkHighlightStyle,
    ],
  });

  onMount(()=>{
    editor = new EditorView({
      state: initialState,
      parent: codeblock
    })

    

  })

</script>

<div class="relative h-full w-full ">
  <div bind:this={codeblock}></div>
</div>

<style global>

  :focus{
    outline:none;
  }

  .cm-editor {
    height: 100%;
    width: 100%;
  }

  /* The lint marker gutter */
  .CodeMirror-lint-markers {
    width: 16px;
  }

  .CodeMirror-lint-tooltip {
    background-color: #ffd;
    border: 1px solid black;
    border-radius: 4px 4px 4px 4px;
    color: black;
    font-family: monospace;
    font-size: 10pt;
    overflow: hidden;
    padding: 2px 5px;
    position: fixed;
    white-space: pre;
    white-space: pre-wrap;
    z-index: 100;
    max-width: 600px;
    opacity: 0;
    transition: opacity .4s;
    -moz-transition: opacity .4s;
    -webkit-transition: opacity .4s;
    -o-transition: opacity .4s;
    -ms-transition: opacity .4s;
  }

  .CodeMirror-lint-mark {
    background-position: left bottom;
    background-repeat: repeat-x;
  }

  .CodeMirror-lint-mark-warning {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJFhQXEbhTg7YAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAMklEQVQI12NkgIIvJ3QXMjAwdDN+OaEbysDA4MPAwNDNwMCwiOHLCd1zX07o6kBVGQEAKBANtobskNMAAAAASUVORK5CYII=");
  }

  .CodeMirror-lint-mark-error {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJDw4cOCW1/KIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAHElEQVQI12NggIL/DAz/GdA5/xkY/qPKMDAwAADLZwf5rvm+LQAAAABJRU5ErkJggg==");
  }

  .CodeMirror-lint-marker {
    background-position: center center;
    background-repeat: no-repeat;
    cursor: pointer;
    display: inline-block;
    height: 16px;
    width: 16px;
    vertical-align: middle;
    position: relative;
  }

  .CodeMirror-lint-message {
    padding-left: 18px;
    background-position: top left;
    background-repeat: no-repeat;
  }

  .CodeMirror-lint-marker-warning, .CodeMirror-lint-message-warning {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAANlBMVEX/uwDvrwD/uwD/uwD/uwD/uwD/uwD/uwD/uwD6twD/uwAAAADurwD2tQD7uAD+ugAAAAD/uwDhmeTRAAAADHRSTlMJ8mN1EYcbmiixgACm7WbuAAAAVklEQVR42n3PUQqAIBBFUU1LLc3u/jdbOJoW1P08DA9Gba8+YWJ6gNJoNYIBzAA2chBth5kLmG9YUoG0NHAUwFXwO9LuBQL1giCQb8gC9Oro2vp5rncCIY8L8uEx5ZkAAAAASUVORK5CYII=");
  }

  .CodeMirror-lint-marker-error, .CodeMirror-lint-message-error {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAHlBMVEW7AAC7AACxAAC7AAC7AAAAAAC4AAC5AAD///+7AAAUdclpAAAABnRSTlMXnORSiwCK0ZKSAAAATUlEQVR42mWPOQ7AQAgDuQLx/z8csYRmPRIFIwRGnosRrpamvkKi0FTIiMASR3hhKW+hAN6/tIWhu9PDWiTGNEkTtIOucA5Oyr9ckPgAWm0GPBog6v4AAAAASUVORK5CYII=");
  }

  .CodeMirror-lint-marker-multiple {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAMAAADzjKfhAAAACVBMVEUAAAAAAAC/v7914kyHAAAAAXRSTlMAQObYZgAAACNJREFUeNo1ioEJAAAIwmz/H90iFFSGJgFMe3gaLZ0od+9/AQZ0ADosbYraAAAAAElFTkSuQmCC");
    background-repeat: no-repeat;
    background-position: right bottom;
    width: 100%; height: 100%;
  }

</style>