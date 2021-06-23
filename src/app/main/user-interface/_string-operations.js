const stringManipulation = {
 
  initialize: function(inputSet = []){
    let regex_short = {};
    let regex_human = {};
    let lookup = [];

    let functions = {pattern: [], values: {}};

    // create type fields for different lua parts
    let newarr = [inputSet[0].type];
    for (let i=1; i<inputSet.length; i++) {
      if (inputSet[i].type!=inputSet[i-1].type) newarr.push(inputSet[i].type);
    }
    
    // make human readable and short regex groups
    newarr.forEach((type , i) => {
      regex_human[type] = inputSet.filter(obj => obj.type === type).map((v)=> (type == 'arithmetic_operator') ? `${'\\' + v.human}` : `${'\\b' + v.human + '\\b'}`).join('|');
      regex_short[type] = inputSet.filter(obj => obj.type === type).map((v)=> (type == 'arithmetic_operator') ? `${'\\' + v.short}` : `${'\\b' + v.short + '\\b'}`).join('|');
      lookup[i] = inputSet.filter(obj => obj.type === type).map((v) => { return { "short": v.short, "human": v.human};});
    });

    // function could be used for validation purpose, currently not used.
    inputSet.forEach((obj,i) => {
      if(obj.parameters !== undefined) {
        functions.values[obj.human] = {parameters: obj.parameters}; // here may be added code version? using human readable
      }
    })

    for (const key in functions.values) {
      functions.pattern.push('\\b' + key + '\\b');
    }

    functions.pattern = functions.pattern.join('|');



    this.VALIDATOR = {
      
      regex_short: regex_short,
      regex_human: regex_human,
      lookup: [].concat(...lookup)
      //functions: functions
    }

    console.log( this.VALIDATOR)
  },

  checkFn: function(text){
    const pattern = `${'('+ this.VALIDATOR.functions.pattern +')'}`;
    const regex = new RegExp(pattern, "g");
    return regex.test(text);
  },

  arithmetics: function(text) {
    // OPERATOR IS NO MORE A CORRECT NAME
    const pattern = `${'(' + this.VALIDATOR.regex.operator + ')(?:\\s*\\1){1,}|(?:(' + this.VALIDATOR.regex.operator + ')(?:\\s*))+(?:(' + this.VALIDATOR.regex.operator + ')(?:\\s*)|$)|([0-9](\\s)(?:\d))'}`
    const regex = new RegExp(pattern, "gm")
    return !regex.test(text);
  },

  splitShortScript: function(script, mode){

    let lookupType;

    switch(mode){
      case 'short': lookupType = 'regex_short'; break;
      case 'human': lookupType = 'regex_human'; break;
    }

    let pattern = [];

    for (const key in this.VALIDATOR[lookupType]) {
      pattern.push(`${'(?<' + key + '>' + this.VALIDATOR[lookupType][key] + ')'}`);
    }

    // split with dev
    if(process.env.NODE_ENV == "development"){
      //console.log("Running _V in development mode.");
      //pattern.push(`${'(?<development>([a-zA-Z_]+))'}`);
    }

    // for "," in functions
    pattern.push(`${'(?<separator>(\,))'}`);
    // for parenthesis ")" "("
    pattern.push(`${'(?<parenthesis>([\\)\\(\\]\\[]))'}`)
    // if its a simple integer
    pattern.push(`${'(?<integer>([+-]?[1-9]\\d*|0))'}`) ;
    // if its if-then-end
    pattern.push(`${'(?<ifblock>(\\bif\\b|\\bthen\\b|\\bend\\b))'}`);
    // if its local
    pattern.push(`${'(?<special>(\\blocal\\b|[=.]))'}`)
    // if its dotnotation
    pattern.push(`${'(?<dotnotation>(\\bthis\\b.\\w+))'}`)
    // if unknown
    pattern.push(`${'(?<other>([a-zA-Z]+))'}`)
    // create full pattern
    pattern = pattern.join('|');

    const regex = new RegExp(pattern, "g");

    let m;
    let arr = [];
    while ((m = regex.exec(script)) !== null) {
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

  humanize: function(script){

    const splitArray = this.splitShortScript(script, 'short');

    //console.log('HUMAN SPLIT: ',splitArray);

    const humanized = this.splitArrayToString(splitArray, 'human');

    //console.log('HUMAN: ',humanized);

    return humanized;
    
  },

  shortify(script){

    const splitArray = this.splitShortScript(script, 'human');

    //console.log('SHORT SPLIT: ', splitArray);

    const shorted = this.splitArrayToString(splitArray, 'short');

    //console.log('SHORT: ', shorted);

    return shorted;

  },

  splitArrayToString: function(splitArray, direction){

    let returnFormat;
    let lookupFormat;

    switch(direction){
      case 'human': {
        returnFormat = 'human';
        lookupFormat = 'short';
        break;
      } 
      case 'short': {
        returnFormat = 'short';
        lookupFormat = 'human';
        break;
      }

    }

    let string = '';

    splitArray.forEach((element) => {

      const value = element.type == 'dotnotation' ? element.value.split('this.')[1] : element.value;
      const found = this.VALIDATOR.lookup.find(element => element[lookupFormat] == value);

      try {

        if(element.type == 'dotnotation'){
          string += `this.${found[returnFormat]}`;
          //console.log('DOT NOTATION', `this.${found[returnFormat]}`)
        }
        else if(element.value == 'local'){
          string += `local ` // <-- here is a space!;
        }
        else if(element.type == 'global'){
          string += `${found[returnFormat]}`
          //console.log('GLOBAL', `${found[returnFormat]}`)
        }
        else {
          string += element.value;
        }
        
      } catch (error) {
        
        console.error(`Could not ${returnFormat}ize section!`, element);

        string += element.value

      }      
    
    });

    return string;

  },

  splitExprToArray: function(splitExpr){
    let altered = "";
    let depth = 0;
    //console.log(splitExpr)
    splitExpr.forEach((element, i) =>{
        if(element.type == 'grid_function' || element.type == 'grid_variable'){
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
        } else if(element.type == 'arithmetic_operator' && depth <= 1){
          altered += ",\""+element.value+"\",";
        } else {
          if(depth <= 1 || element.value == undefined){
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

export default stringManipulation;

export function debounce( callback, delay ) {
  let timeout;
  return function() {
      clearTimeout( timeout );
      timeout = setTimeout( callback, delay );
  }
}