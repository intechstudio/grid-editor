export const _V = {
 
  initialize:function(inputSet = []){

    let TYPES = {};
    let FUNCTIONS = {PATTERN: [], VALUES: {}};

    let newarr = [inputSet[0].type];
    for (let i=1; i<inputSet.length; i++) {
      if (inputSet[i].type!=inputSet[i-1].type) newarr.push(inputSet[i].type);
    }

    newarr.forEach((type , i) => {
      TYPES[type] = {parameters: 0 , pattern: inputSet.filter(obj => obj.type === type).map((v)=> (type == 'operator') ? `${'\\' + v.desc}` : `${'\\b' + v.desc + '\\b'}`).join('|')};
    })

    inputSet.forEach((obj,i) => {
      if(obj.parameters !== undefined) {
        FUNCTIONS.VALUES[obj.desc] = {parameters: obj.parameters}; // here may be added code version? although not born for this valid case..
      }
    })

    for (const KEY in FUNCTIONS.VALUES) {
      FUNCTIONS.PATTERN.push('\\b' + KEY + '\\b');
    }

    FUNCTIONS.PATTERN = FUNCTIONS.PATTERN.join('|');

    this.VALIDATOR = {
      
      TYPES: TYPES,
      FUNCTIONS: FUNCTIONS
    }
    console.log(this);
  },


  arithmetics: function(text) {
    const pattern = `${'(' + this.VALIDATOR.TYPES.operator.pattern + ')(?:\\s*\\1){1,}|(?:(' + this.VALIDATOR.TYPES.operator.pattern + ')(?:\\s*))+(?:(' + this.VALIDATOR.TYPES.operator.pattern + ')(?:\\s*)|$)|([0-9](\\s)(?:\d))'}`
    const regex = new RegExp(pattern, "gm")
    return !regex.test(text);
  },

  parenthesis: function(expression){
    let stack = [];
    let current;
    const matchLookup = {
          "(": ")", 
          "[": "]", 
          "{": "}", 
        };
                      
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

  fnSplit: function(text){
    const pattern = `(${this.VALIDATOR.FUNCTIONS.PATTERN}).+?(?=(${this.VALIDATOR.FUNCTIONS.PATTERN}))|(${this.VALIDATOR.FUNCTIONS.PATTERN}).*`

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
    const pattern = this.VALIDATOR.FUNCTIONS.PATTERN;
    let validity = [];
    let _fn;
    arr.forEach((str,i) => {
      const fn = new RegExp(pattern, "g").exec(str);
      if(fn) {
        _fn = fn[0].toUpperCase();
        let indices = [];
        for(let i=0; i<str.length;i++) {
          if (str[i] === ",") indices.push(i);
        }
        validity.push(indices.length === this.VALIDATOR.FUNCTIONS.VALUES[fn[0]].parameters.length - 1)
      } else {
        validity.push(false)
      }
    });
  
    return validity;
  }

}
