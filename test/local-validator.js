/*

Mocha/Chai validator for testing the local variable action block validator

### *** NOT *** Acceptable
- empty string
- `space in the name`
- `123`
- `num*2`
- `1hello`
- any non latin letters
- any string containing any Lua operators
- Especially test the ',' (comma) operator
- Any of the reserved lua keywords

  `and       break     do        else      elseif
     end       false     for       function  if
     in        local     nil       not       or
     repeat    return    then      true      until     while`
     
### Acceptable
Any string alphanumerical (latin) + '_' that does not start with a number 

- `num`
- `variable2`
- `variable_name3`
- `_hiddenVar`


*/

const chai = require('chai')
const expect = chai.expect

const validator = require('../src/app/validators/local_validator')

describe("validator --[[@l]] / variable name", () => {

	it("should return FALSE if it contains any special characters", ()=> {      
        expect(validator.checkVariableName('my*Var')).to.be.false
        expect(validator.checkVariableName('my-Var')).to.be.false
        expect(validator.checkVariableName('my,')).to.be.false
        expect(validator.checkVariableName('myVar*2')).to.be.false
	})

    it("should return FALSE if it starts with a number", ()=> {    
        expect(validator.checkVariableName('1variable')).to.be.false
	})

    it("should return FALSE if it only contains numbers", ()=> { 
        expect(validator.checkVariableName('123')).to.be.false
	})

    it("should return FALSE if it contains a space", ()=> { 
        expect(validator.checkVariableName('variable name')).to.be.false
	})

    it("should return FALSE if it contains any non-latin character", ()=> { 
        expect(validator.checkVariableName('variableNém')).to.be.false
	})

    it("should return FALSE for empty string", ()=> { 
        expect(validator.checkVariableName('')).to.be.false
	})

    it("should return FALSE if it matches any of the reserved lua keywords", ()=> { 
        expect(validator.checkVariableName('and')).to.be.false
        expect(validator.checkVariableName('break')).to.be.false
        expect(validator.checkVariableName('do')).to.be.false
        expect(validator.checkVariableName('else')).to.be.false
        expect(validator.checkVariableName('elseif')).to.be.false
        expect(validator.checkVariableName('end')).to.be.false
        expect(validator.checkVariableName('false')).to.be.false
        expect(validator.checkVariableName('for')).to.be.false
        expect(validator.checkVariableName('function')).to.be.false
        expect(validator.checkVariableName('if')).to.be.false
        expect(validator.checkVariableName('in')).to.be.false
        expect(validator.checkVariableName('local')).to.be.false
        expect(validator.checkVariableName('nil')).to.be.false
        expect(validator.checkVariableName('not')).to.be.false
        expect(validator.checkVariableName('or')).to.be.false
        expect(validator.checkVariableName('repeat')).to.be.false
        expect(validator.checkVariableName('return')).to.be.false
        expect(validator.checkVariableName('then')).to.be.false
        expect(validator.checkVariableName('true')).to.be.false
        expect(validator.checkVariableName('until')).to.be.false
        expect(validator.checkVariableName('while')).to.be.false
	})
  
    it("should return TRUE if it only part of it matches any of the reserved lua keywords", ()=> { 
        expect(validator.checkVariableName('and2')).to.be.true
        expect(validator.checkVariableName('do_a_break')).to.be.true
        expect(validator.checkVariableName('variable_else')).to.be.true
	})  
  
    it("should return TRUE if any decent variable name is given", ()=> { 
        expect(validator.checkVariableName('variableName')).to.be.true
        expect(validator.checkVariableName('VariableName2')).to.be.true
        expect(validator.checkVariableName('my_var')).to.be.true
	}) 

})