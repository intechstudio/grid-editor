export const _V = {
 
  initialize:function(inputSet = []){

    let regex = {};
    let functions = {pattern: [], values: {}};

    let newarr = [inputSet[0].type];
    for (let i=1; i<inputSet.length; i++) {
      if (inputSet[i].type!=inputSet[i-1].type) newarr.push(inputSet[i].type);
    }

    console.log(newarr);

    newarr.forEach((type , i) => {
      regex[type] = inputSet.filter(obj => obj.type === type).map((v)=> (type == 'operator') ? `${'\\' + v.desc}` : `${'\\b' + v.value + '\\b'}`).join('|');
    })

    inputSet.forEach((obj,i) => {
      if(obj.parameters !== undefined) {
        functions.values[obj.value] = {parameters: obj.parameters}; // here may be added code version? although not born for this valid case..
      }
    })

    for (const key in functions.values) {
      functions.pattern.push('\\b' + key + '\\b');
    }

    functions.pattern = functions.pattern.join('|');

    this.VALIDATOR = {
      
      regex: regex,
      functions: functions
    }
    console.log(this);
  },

  /**
  const protocol = {
    midi: function(){
      return {fn: this.midi.name, args: arguments, len: arguments.length}
    },
    ledColor: function(){
      return {fn: this.ledColor.name, args: arguments, len: arguments.length}
    },
    if: function(){
      return {fn: this.if.name, args: arguments, len: arguments.length}
    },
    abs: function(){
      return {fn: this.abs.name, args: arguments, len: arguments.length}
    }
  }
 */
  checkFn: function(text){
    const pattern = `${'('+ this.VALIDATOR.functions.pattern +')'}`;
    const regex = new RegExp(pattern, "g");
    return regex.test(text);
  },

  nest: function(array) {
    const pattern = `${'('+ this.VALIDATOR.functions.pattern +').*'}`;
    const regex = new RegExp(pattern, "g");
    let m = regex.exec(array);
    if(m !== null){
      console.log(m.index, regex.lastIndex );
    }

    let openBracket = [];
    let closeBracket = [];

  },

  arithmetics: function(text) {
    const pattern = `${'(' + this.VALIDATOR.regex.operator + ')(?:\\s*\\1){1,}|(?:(' + this.VALIDATOR.regex.operator + ')(?:\\s*))+(?:(' + this.VALIDATOR.regex.operator + ')(?:\\s*)|$)|([0-9](\\s)(?:\d))'}`
    const regex = new RegExp(pattern, "gm")
    return !regex.test(text);
  },

  isJson: function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  },

  arrayToExpression: function(type = '', array = []){
    let code = type; // prepend with type
    const _unformatted = JSON.stringify(array);
    [..._unformatted].forEach(e => {
      if(e == '['){ code += '(' }
      else if(e == ']') { code += ')'}
      else if(e == "\"") { /* no return */ }
      else { code += e }
    })
    return code;
  },

  parenthesis: function(expression){
    let stack = [];
    let current;
    const matchLookup = {
          "(": ")", 
          "[": "]", 
          "{": "}", 
        };
    //console.log(expression);
    for (let i = 0; i < expression.length; i++) {
      current = expression[i]; //easier than writing it over and over
      
      if (current === '(' || current === '[' || current === "{") {
        stack.push(current);
        
      } else if (current === ')' || current === ']' || current === "}") {
        const lastBracket = stack.pop();
        
        if (matchLookup[lastBracket] !== current) { //if the stack is empty, .pop() returns undefined, so this expression is still correct
        
          return false; //terminate immediately - no need to continue scanning the string
        }
      }
    }
    return stack.length === 0; //any elements mean brackets left open
  },

  exprSplit: function(text){
    let pattern = [];
    for (const key in this.VALIDATOR.regex) {
      pattern.push(`${'(?<' + key + '>' + this.VALIDATOR.regex[key] + ')'}`);
    }
    // for "," in functions
    pattern.push(`${'(?<separator>(\,))'}`);
    // if its a simple integer
    pattern.push(`${'(?<integer>([+-]?[1-9]\\d*|0))'}`) ;
    // if its dot notation
    pattern.push(`${'(?<dotnotation>((\\w+)\.(\\w)+))'}`)
    // if its character which is invalid
    pattern.push(`${'(?<other>([a-zA-Z]+))'}`);

    // create full pattern
    pattern = pattern.join('|');

    const regex = new RegExp(pattern, "g");

    let m;
    let arr = [];
    while ((m = regex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
          regex.lastIndex++;
      }  
      for (const key in m.groups) {
        if(m.groups[key] !== undefined){
          arr.push({type: key, value: m.groups[key]});
        }
      }
    }

    return arr;
  
  },

  splitExprToArray: function(splitExpr){
    let altered = "";
    let depth = 0;
    splitExpr.forEach((element, i) =>{
        if(element.type == 'action' || element.type == 'function' || element.type == 'getter' || element.type == 'setter'){
          // do nothing
        } else if(element.value == '('){
          if(depth >= 1){
            if(depth == 1){
              altered += "\"";
            }
            altered += "(";
          } else {
            altered += "[";
          }
          depth += 1;
        } else if(element.value == ')'){
          depth -= 1;
          if(depth >= 1){
            altered += ")"
            if(depth == 1){
              altered += "\"";
            }
          } else {
            altered += "]";
          }       
        } else if(element.value == ',' && depth <= 1 ) {
          altered += ",";
        } else if(element.type == 'operator' && depth <= 1){
          altered += ",\""+element.value+"\",";
        } else {
          if(depth <= 1){
            altered += "\""+element.value+"\"";
          } else {
            altered += element.value;
          }
        }
    })
    return altered;
  },

  fnSplit: function(text){

    const pattern = `().*`

    const regex = new RegExp(pattern, "gs")

    let m;
    while ((m = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        } 
        return {start:m.index, end:regex.lastIndex};
    }
    return {start: null, end:null};  
  },

  fnCommas: function(arr = []){
    // original comma detection regex
    // ([a-zA-Z0-9\s)(]*[,]){${numOfComma}}
    const pattern = this.VALIDATOR.functions.pattern;
    let validity = [];
    let _fn;
    arr.forEach((str,i) => {
      const fn = new RegExp(pattern, "g").exec(str);
      console.log(fn, str);
      if(fn) {
        _fn = fn[0].toUpperCase();
        let indices = [];
        for(let i=0; i<str.length;i++) {
          if (str[i] === ",") indices.push(i);
        }
        validity.push(indices.length === this.VALIDATOR.functions.values[fn[0]].parameters.length - 1)
      } else {
        validity.push(false)
      }
    });
  
    return validity;
  }

}
