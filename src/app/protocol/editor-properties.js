export const editor_lua_properties = [
  // code OPERATORS https://www.tutorialspoint.com/code/code_operators.html
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\*',  human:'*'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\+',  human:'+'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\-',  human:'-'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\%',  human:'%'},
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\/',  human:'/'},
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\//', human:'//'},
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\^',  human:'^'},

  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\==',   human:'=='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\~=',   human:'~='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\>',    human:'>'},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\<',    human:'<'},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\>=',   human:'>='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '\<=',   human:'<='},

  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'and',  human:'and'},
  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'or',   human:'or'},
  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'not',  human:'not'},

  {type: 'global', allowed: ['2', '1', '3'], short: 'l', human: 'locals'},
  {type: 'global', allowed: ['2', '1', '3'], short: 'if', human: 'if'},
  {type: 'global', allowed: ['2', '1', '3'], short: 'el', human: 'else'},
  {type: 'global', allowed: ['2', '1', '3'], short: 'ei', human: 'else if'},
  {type: 'global', allowed: ['2', '1', '3'], short: 'en', human: 'end'},
 
  {type: 'encoder', allowed: ['2'], short: 'sec', human: 'encoder_settings'},

  {type: 'button', allowed: ['3'], short: 'sbc', human: 'button_settings'}
]
