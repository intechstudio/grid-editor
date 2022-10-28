export function checkVariableName(varName){

      let variableName = varName.toString();

      const keywords = [
        "and", "break", "do", "else", "elseif", 
        "end", "false", "for", "function", "if",
        "in", "local", "nil", "not", "or", 
        "repeat", "return", "then", "true", "until", "while"
      ];

      if(variableName == '' || variableName == undefined){
        return false;
      }      

      const checks = {
        isSpecial: /[!@#\$%\^\&*\)\(\/\\+=.,-]/gm.test(variableName), // expect false
        isFirstCharNumber: !isNaN(variableName.charAt(0)), // expect false
        isNumber: !isNaN(variableName), //expect false
        hasSpace: /\s/gm.test(variableName),
        nonLatin: variableName.match(/[a-zA-Z0-9_]/gm).length !== variableName.length,
        isLuaKeyword: keywords.includes(variableName),
      };

      
      let checkArray = [];

      for (const test in checks) {
        if (Object.hasOwnProperty.call(checks, test)) {
          checkArray.push(checks[test]);
        }
      }

      const valid = checkArray.includes(true) ? false : true;

      return valid;
}