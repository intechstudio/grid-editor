export const editor_lua_properties = [
  // code OPERATORS https://www.tutorialspoint.com/code/code_operators.htm
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\*',  human:'*'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\+',  human:'+'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\-',  human:'-'}, 
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\%',  human:'%'},
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\/',  human:'/'},
  {type: 'arithmetic_operator', allowed: ['2', '1', '3'], short: '\\^',  human:'^'},

  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '==',   human:'=='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '~=',   human:'~='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '>',    human:'>'},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '<',    human:'<'},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '>=',   human:'>='},
  {type: 'relational_operator', allowed: ['2', '1', '3'], short: '<=',   human:'<='},

  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'and',  human:'and'},
  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'or',   human:'or'},
  {type: 'logical_operator', allowed: ['2', '1', '3'],  short: 'not',  human:'not'},
  {type: 'global', allowed: ['2', '1', '3'], short: 'l', human: 'locals'}
]
