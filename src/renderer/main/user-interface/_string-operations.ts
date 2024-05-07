import { grid } from "../../protocol/grid-protocol";
import { formatText } from "lua-fmt";
import * as luamin from "luamin";

export const stringManipulation = {
  initialize: function (inputSet = []) {
    let regex_short = {};
    let regex_human = {};
    let lookup = [];

    //let functions = { pattern: [], values: {} };

    // create type fields for different lua parts
    let newarr = [inputSet[0].type];
    for (let i = 1; i < inputSet.length; i++) {
      if (inputSet[i].type != inputSet[i - 1].type)
        newarr.push(inputSet[i].type);
    }

    // make human readable and short regex groups
    newarr.forEach((type, i) => {
      regex_human[type] = inputSet
        .filter((obj) => obj.type === type)
        .map((v) =>
          type == "arithmetic_operator" || type == "relational_operator"
            ? `${"\\" + v.human}`
            : `${"\\b" + v.human + "\\b"}`
        )
        .join("|");
      regex_short[type] = inputSet
        .filter((obj) => obj.type === type)
        .map((v) =>
          type == "arithmetic_operator" || type == "relational_operator"
            ? `${"\\" + v.short}`
            : `${"\\b" + v.short + "\\b"}`
        )
        .join("|");
      lookup[i] = inputSet
        .filter((obj) => obj.type === type)
        .map((v) => {
          return { short: v.short, human: v.human };
        });
    });

    /*
    // function could be used for validation purpose, currently not used.
    inputSet.forEach((obj, i) => {
      if (obj.parameters !== undefined) {
        functions.values[obj.human] = { parameters: obj.parameters }; // here may be added code version? using human readable
      }
    });

    for (const key in functions.values) {
      functions.pattern.push("\\b" + key + "\\b");
    }

    functions.pattern = functions.pattern.join("|");
    */

    let function_types = [];
    for (const key in regex_human) {
      function_types.push(key);
    }

    this.VALIDATOR = {
      regex_short: regex_short,
      regex_human: regex_human,
      lookup: [].concat(...lookup),
      function_types: function_types,
      //functions: functions
    };

    //console.log(this.VALIDATOR);
  },

  splitShortScript: function (script: string, mode: string) {
    let lookupType: any;

    switch (mode) {
      case "short":
        lookupType = "regex_short";
        break;
      case "human":
        lookupType = "regex_human";
        break;
    }

    let pattern = [];

    for (const key in this.VALIDATOR[lookupType]) {
      pattern.push(
        `${"(?<" + key + ">" + this.VALIDATOR[lookupType][key] + ")"}`
      );
    }

    // for "," in functions
    pattern.push(`${"(?<separator>(,))"}`);
    // for parenthesis ")" "("
    pattern.push(`${"(?<parenthesis>([\\)\\(\\]\\[\\}\\{]))"}`);
    // if its a simple integer
    pattern.push(`${"(?<integer>([+-]?[1-9]\\d*|0))"}`);
    // if its if-then-end
    pattern.push(`${"(?<ifblock>(\\bif\\b|\\bthen\\b|\\bend\\b))"}`);
    // if its new line or space
    pattern.push(`${"(?<space>([\\s\\n]))"}`);
    // if its special
    pattern.push(`${"(?<special>(\\blocal\\b|[=._@:;'\"`~|^<>&]))"}`);
    // if its backslash
    pattern.push(`${"(?<backslash>(\\\\))"}`);
    // if unknown
    pattern.push(`${"(?<other>([a-zA-Z]+))"}`);
    // create full pattern
    const regExPattern = pattern.join("|");

    const regex = new RegExp(regExPattern, "g");

    let m: any;
    let arr = [];
    while ((m = regex.exec(script)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      for (const key in m.groups) {
        if (m.groups[key] !== undefined) {
          arr.push({ type: key, value: m.groups[key] });
        }
      }
    }
    return arr;
  },

  humanize: function (script: string) {
    // We should heaviliy consider handling spaces and returns better!

    const splitArray = this.splitShortScript(script, "short");

    //console.log('HUMAN SPLIT: ',splitArray);

    const humanized = this.splitArrayToString(splitArray, "human");

    //console.log('HUMAN: ',humanized);

    return humanized;
  },

  shortify(script: string) {
    // We should heaviliy consider handling spaces and returns better!
    const splitArray = this.splitShortScript(script, "human");
    const shorted = this.splitArrayToString(splitArray, "short");
    return shorted;
  },

  typeCheck: function (type: string, value: string) {
    let bool = false;

    const blacklist = ["if", "else", "elseif", "end"];

    if (
      this.VALIDATOR.function_types.includes(type) &&
      !blacklist.includes(value)
    ) {
      bool = true;
    }

    return bool;
  },

  splitArrayToString: function (splitArray: any[], direction: string) {
    let returnFormat: string;
    let lookupFormat: string;

    switch (direction) {
      case "human": {
        returnFormat = "human";
        lookupFormat = "short";
        break;
      }
      case "short": {
        returnFormat = "short";
        lookupFormat = "human";
        break;
      }
    }

    let string = "";

    splitArray.forEach((element) => {
      const found = this.VALIDATOR.lookup.find(
        (lookup_element: any) => lookup_element[lookupFormat] == element.value
      );

      try {
        if (this.typeCheck(element.type, element.value)) {
          string += `${found[returnFormat]}`;
        } else {
          string += element.value;
        }
      } catch (error) {
        console.warn(`Could not ${returnFormat}ize section!`, element);

        string += element.value;
      }
    });

    return string;
  },

  minifyScript: function (value: string) {
    var code = value;
    const minified = luamin.minify(code);
    return minified;
  },

  compressScript: function (script: string) {
    const short = stringManipulation.shortify(script);
    const minified = this.minifyScript(short);
    return minified;
  },

  expandScript: function (script: string) {
    const human = stringManipulation.humanize(script);
    const formatted = formatText(human);
    return formatted;
  },
};

stringManipulation.initialize(grid.getProperty("LUA"));
