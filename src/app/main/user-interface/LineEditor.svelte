<script>

    import { createEventDispatcher, onDestroy, onMount } from 'svelte';

    import * as monaco from '../../../../node_modules/monaco-editor/esm/vs/editor/editor.api'
  
    const dispatch = createEventDispatcher();
  
    export let value;

    let monaco_block;

    let editor;
  

    function update_codeblock_height(){

        //console.log(editor._getViewModel().getLineCount(), editor._modelData.viewModel)
        //editor.viewModel.getViewLineCount()

        const contentHeight = editor._getViewModel().getLineCount() * 19
        //const contentHeight = editor.getModel().getLineCount()* 19

        monaco_block.style.height = contentHeight +"px";
        //monaco_container.style.height = containerHeight +"px";
        editor.layout()


    }


    onDestroy(()=>{
        
    })

    onMount(()=>{

        editor = monaco.editor.create(monaco_block, {
        value: value,
        language: 'lua',
        theme: "my-theme",
        minimap: {
            enabled: false
        },
        lineNumbers: "off",
        lineNumbersMinChars: 0,
        lineDecorationsWidth: 0,
        folding: false,
        glyphMargin: false,
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        renderLineHighlight: 'none',
        scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
        },
        contextmenu: false,
        scrollPredominantAxis: false,
        scrollBeyondLastLine: 0,
        wordWrap: 'on',
        });
        update_codeblock_height();

        editor.getModel().onDidChangeContent((event) => {


            dispatch('output', {script: editor.getValue() });

            update_codeblock_height();
            
            /*
            if (editor.getValue() !== $appSettings.monaco_code_committed){
                commitState = 1;
            }
            else{
                commitState = 0;
            }
            */
        
        });

    })



</script>


<div bind:this={monaco_block} class="w-full min-w-max justify-between"></div>

