export const editor_lua_properties = [
  // code OPERATORS https://www.tutorialspoint.com/code/code_operators.htm
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\*',  human:'*'}, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\+',  human:'+'}, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\-',  human:'-'}, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\%',  human:'%'},
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\/',  human:'/'},
  {type: 'arithmetic_operator', allowed: ['encoder', 'potmeter', 'button'], short: '\\^',  human:'^'},

  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '==',   human:'=='},
  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '~=',   human:'~='},
  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '>',    human:'>'},
  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '<',    human:'<'},
  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '>=',   human:'>='},
  {type: 'relational_operator', allowed: ['encoder', 'potmeter', 'button'], short: '<=',   human:'<='},

  {type: 'logical_operator', allowed: ['encoder', 'potmeter', 'button'],  short: 'and',  human:'and'},
  {type: 'logical_operator', allowed: ['encoder', 'potmeter', 'button'],  short: 'or',   human:'or'},
  {type: 'logical_operator', allowed: ['encoder', 'potmeter', 'button'],  short: 'not',  human:'not'},
]
