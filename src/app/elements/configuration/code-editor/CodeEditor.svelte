<script>  

  import { onMount } from "svelte";

  const Linter = require("eslint").Linter;

  import { StreamLanguage } from "@codemirror/stream-parser"
  import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
  import { lua } from "@codemirror/legacy-modes/mode/lua"
  import { javascript, esLint } from '@codemirror/lang-javascript';
  import { linter, openLintPanel } from '@codemirror/lint';
  import { keymap } from '@codemirror/view';
  import { oneDarkTheme, oneDarkHighlightStyle } from "./OneDark";

  let codeblock;

  let editor;

  /**
   *  LUA
   * --[[
    example useless code to show lua syntax highlighting
    this is multiline comment
    ]]

    function blahblahblah(x)

      local table = {
        "asd" = 123,
        "x" = 0.34,  
      }
      if x ~= 3 then
        print( x )
      elseif x == "string"
        my_custom_function( 0x34 )
      else
        unknown_function( "some string" )
      end

      --single line comment
      
    end
   */

  const initialState = EditorState.create({
    doc: ``,
    extensions: [
      basicSetup,
      javascript(),
      linter(esLint(new Linter())),
      //linter(editor),
      //StreamLanguage.define(lua),
      oneDarkTheme,
      oneDarkHighlightStyle,
    ],
    gutters: ["CodeMirror-lint-markers"],
  });
 
  onMount(()=>{
    editor = new EditorView({
      state: initialState,
      gutters: ["CodeMirror-lint-markers"],
      parent: codeblock,
      lint: true
    })

    //editor.setSize('100%', '100%');
    //codeBlock.refresh();
  })

</script>

<code-editor class="" bind:this={codeblock}></code-editor>

