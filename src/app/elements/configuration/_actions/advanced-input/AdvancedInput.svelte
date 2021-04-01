<script>
  import RichText from "./RichText.svelte";

  import { _V } from './advanced-validator';

  export let inputSet;

  export let blockAddedOnClick;

  export let index;

  let _v = _V;
  _v.initialize(inputSet);

  let validity = {expression: false, parenthesis: false, fnCommas: false};

  function validate(expression = []) {

    validity.parenthesis = _v.parenthesis(expression);

    validity.expression = _v.arithmetics(expression);

    let exprBlock = [];

    let _fn = _v.fnSplit(expression);
    exprBlock.push(expression.slice(_fn.start, _fn.end));
    while(expression.length > _fn.end && _fn.end !== null){
      expression = expression.slice(_fn.end);
      _fn = _v.fnSplit(expression);
      console.log(expression.slice(_fn.start, _fn.end))
      exprBlock.push(expression.slice(_fn.start, _fn.end));      
    }

    validity.fnCommas = _v.fnCommas(exprBlock).every(v => v === true);

    console.log(exprBlock);

  } 

</script>


<RichText on:text={(e)=>{validate(e.detail)}} style={'min-height:48px;word-break:break-all;'} inputSet={inputSet.sort((a, b) => b.length - a.length)} {index} {blockAddedOnClick}/>

<errors class="flex text-xs flex-col">
  <div class="text-white { validity.expression ?'text-green-400': 'text-red-400' }">expression is {validity.expression ? 'valid' : 'invalid'}</div>
  <div class="text-white { validity.parenthesis ?'text-green-400': 'text-red-400' }">parenthesis is {validity.parenthesis ? 'valid' : 'invalid'}</div>
  <div class="text-white { validity.fnCommas ?'text-green-400': 'text-red-400' }">commas in functions are {validity.fnCommas ? 'valid' : 'invalid'}</div>
</errors>