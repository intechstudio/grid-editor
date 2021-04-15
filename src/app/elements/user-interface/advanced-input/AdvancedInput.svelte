<script>
  import RichText from "./RichText.svelte";

  import { _V } from './advanced-validator';
import CodeEditor from "../../code-editor/CodeEditor.svelte";

  export let inputSet;

  export let blockAddedOnClick;

  export let index;

  // should have a constructor
  let errors = {other: [], caret_open: [], caret_close: [], flow: []};;

  let _v = _V;
  _v.initialize(inputSet);

  let validity = {expression: false, parenthesis: false, fnCommas: false};

  function validate(expression = []) {

    validity.parenthesis = _v.parenthesis(expression);

    validity.expression = _v.arithmetics(expression);

    let exprBlock = [];

    let nestedExpr = _v.nest(expression);
    //console.log(nestedExpr);

    let splitExpr = _v.exprSplit(expression);

    errors = {other: [], caret_open: [], caret_close: [], flow: []};

    //console.log(splitExpr)

    splitExpr.forEach((element, i) => {
      if(element.type == 'other'){
        errors.other.push(element.value + ',');
      }
      if(splitExpr.length - 1 > i){
        if(splitExpr[i+1].value !== '(' && (element.type == 'action' || element.type == 'function' || element.type == 'setter' || element.type == 'getter')){
          errors.caret_open.push('\'' + element.value + '\' misses open parenthesis');
        }
        if(element.value == ')' && (splitExpr[i+1].type !== 'operator' && splitExpr[i+1].type !== 'separator')){
          errors.caret_close.push('close parenthesis must be followed with operator instead of ' + splitExpr[i+1].type);
        }
        if(element.type == 'operator' && element.value !== ')' && (splitExpr[i+1].type !== 'integer' && splitExpr[i+1].type !== 'variable' &&  splitExpr[i+1].type !== 'getter')){
          errors.flow.push('integer, variable or getter must be used after \'' + element.value + '\'');
        }
      }
    });

    // this is going to be good for comma calculation!
    let altered = "";
    splitExpr.forEach((element, i) =>{
      // this could be regex
      if(element.type == 'action' || element.type == 'function' || element.type == 'getter' || element.type == 'setter'){
        altered += 'function '+ element.value;
      } else if(element.value == '(' && _v.checkFn(splitExpr[i-1].value) == false){
        altered += '{';
      } else if(element.value == ')' && splitExpr[i-1].value == ';'){
        altered += '}';
      } else if(element.value == ',') {
        altered += ',';
      } else if(element.type == 'operator'){
        altered += element.value;
      } else {
        altered += "\""+element.value+"\"";
      }
    })

    console.log(splitExpr)
    //console.log(altered);

    

    console.log(
      //[protocol.if(protocol.abs(1), protocol.midi(0,1,2,4)), protocol.if(protocol.abs(1), protocol.midi(0,1,4))]
    ) ;

    errors.other.length ? errors.other = ['Undefined characters: ', ...errors.other].join(' ') : null;
    
    //console.log(errors);

    //"if":["0","midi":["abs:[12"]+23","12"],"ledColor":[]]

    let _fn = _v.fnSplit(expression);
    exprBlock.push(expression.slice(_fn.start, _fn.end));
    while(expression.length > _fn.end && _fn.end !== null){
      expression = expression.slice(_fn.end);
      _fn = _v.fnSplit(expression);
      //console.log(expression.slice(_fn.start, _fn.end))
      exprBlock.push(expression.slice(_fn.start, _fn.end));      
    }

    //console.log(exprBlock);

    validity.fnCommas = _v.fnCommas(exprBlock).every(v => v === true);


  } 

</script>

<!--
<RichText on:text={(e)=>{validate(e.detail)}} style={'min-height:48px;word-break:break-all;'} inputSet={inputSet.sort((a, b) => b.length - a.length)} {index} {blockAddedOnClick}/>
-->
<CodeEditor/>

<!--
<errors class="flex text-xs flex-col">
  <div class="text-white { validity.expression ?'text-green-400': 'text-red-400' }">expression is {validity.expression ? 'valid' : 'invalid'}</div>
  <div class="text-white { validity.parenthesis ?'text-green-400': 'text-red-400' }">parenthesis is {validity.parenthesis ? 'valid' : 'invalid'}</div>
  <div class="text-white { validity.fnCommas ?'text-green-400': 'text-red-400' }">commas in functions are {validity.fnCommas ? 'valid' : 'invalid'}</div>
  <div class="text-white">{errors.other}</div>
  <div class="text-white">{errors.caret_open.join('; ')}</div>
  <div class="text-white">{errors.caret_close.join('; ')}</div>
  <div class="text-white">{errors.flow.join('; ')}</div>

</errors>
-->