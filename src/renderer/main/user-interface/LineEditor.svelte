<script>

    import { createEventDispatcher, onDestroy, onMount } from 'svelte';

    import {monaco_elementtype} from '../../runtime/monaco-helper'

    import {editor as monaco_editor} from '../../../../node_modules/monaco-editor/esm/vs/editor/editor.api'
  
    const dispatch = createEventDispatcher();
  
    export let value;
    export let access_tree;
    export let sidebarWidth;

    let monaco_block;

    let editor;

    $: update_codeblock_height(sidebarWidth)
  

    function update_codeblock_height(){

        if (editor === undefined){
            return;
        }
        
        //console.log(editor._getViewModel().getLineCount(), editor._modelData.viewModel)
        //editor.viewModel.getViewLineCount()

        const contentHeight = editor._getViewModel().getLineCount() * 16
        //const contentHeight = editor.getModel().getLineCount()* 19

        monaco_block.style.height = contentHeight +"px";
        //monaco_container.style.height = containerHeight +"px";
        editor.layout()


    }


    onDestroy(()=>{
        editor.dispose();
    })

    onMount(()=>{



        $monaco_elementtype = access_tree.elementtype
        
        editor = monaco_editor.create(monaco_block, {
        value: value,
        language: 'intech_lua',
        theme: "my-theme",
        minimap: {
            enabled: false
        },
        fontSize: 12,
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
        suggest: {
            showIcons: false,
            showWords: true
        }
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


<div
on:click|preventDefault={()=>{}}
on:mousedown|preventDefault={()=>{}}
bind:this={monaco_block} class="line-editor w-full justify-between"></div>



<style>
  
  
</style>