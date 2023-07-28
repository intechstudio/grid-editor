import grid from "../../protocol/grid-protocol.js";

const stringManipulation = {
  initialize: function (inputSet = []) {
    let regex_short = {};
    let regex_human = {};
    let lookup = [];

    let functions = { pattern: [], values: {} };

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
            : `${"\\b" + v.human + "\\b"}`,
        )
        .join("|");
      regex_short[type] = inputSet
        .filter((obj) => obj.type === type)
        .map((v) =>
          type == "arithmetic_operator" || type == "relational_operator"
            ? `${"\\" + v.short}`
            : `${"\\b" + v.short + "\\b"}`,
        )
        .join("|");
      lookup[i] = inputSet
        .filter((obj) => obj.type === type)
        .map((v) => {
          return { short: v.short, human: v.human };
        });
    });

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

  checkFn: function (text) {
    const pattern = `${"(" + this.VALIDATOR.functions.pattern + ")"}`;
    const regex = new RegExp(pattern, "g");
    return regex.test(text);
  },

  arithmetics: function (text) {
    // OPERATOR IS NO MORE A CORRECT NAME
    const pattern = `${
      "(" +
      this.VALIDATOR.regex.operator +
      ")(?:\\s*\\1){1,}|(?:(" +
      this.VALIDATOR.regex.operator +
      ")(?:\\s*))+(?:(" +
      this.VALIDATOR.regex.operator +
      ")(?:\\s*)|$)|([0-9](\\s)(?:d))"
    }`;
    const regex = new RegExp(pattern, "gm");
    return !regex.test(text);
  },

  removeWhiteSpaces: function (string) {
    return string.replace(/\s/g, "");
  },

  splitShortScript: function (script, mode) {
    let lookupType;

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
        `${"(?<" + key + ">" + this.VALIDATOR[lookupType][key] + ")"}`,
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
    pattern.push(`${"(?<special>(\\blocal\\b|[=._@:;'\"`]))"}`);
    // if its backslash
    pattern.push(`${"(?<backslash>(\\\\))"}`);
    // if unknown
    pattern.push(`${"(?<other>([a-zA-Z]+))"}`);
    // create full pattern
    pattern = pattern.join("|");

    const regex = new RegExp(pattern, "g");

    let m;
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

  humanize: function (script) {
    // We should heaviliy consider handling spaces and returns better!

    const splitArray = this.splitShortScript(script, "short");

    //console.log('HUMAN SPLIT: ',splitArray);

    const humanized = this.splitArrayToString(splitArray, "human");

    //console.log('HUMAN: ',humanized);

    return humanized;
  },

  blockCommentToLineComment: function (script) {
    const short_lines = script.split("\n");
    let short_code_comment_fixed = "";

    let inBlockComment = false;

    // Convert Block comments to line comments
    short_lines.forEach((element, index) => {
      let result = element;

      //console.log("LINE: ", result + "\n", inBlockComment);

      if (inBlockComment === true) {
        result = "--" + result;
      } else if (element.indexOf("--[[") !== -1) {
        if (element.indexOf("--]]") === -1) {
          inBlockComment = true;
          result = element.replace("--[[", "--");
        } else if (element.indexOf("--[[") < element.indexOf("--]]")) {
          result = element.replace("--[[", "--").replace("--]]", "\r\n");
        }
      }
      if (element.indexOf("--]]") !== -1) {
        result = "--" + element.replace("--]]", "\r\n");
        inBlockComment = false;
      }

      //console.log("RESULT: ", "$" + result.trim() + "$", inBlockComment);

      if (result.trim() !== "--") {
        short_code_comment_fixed += result + "\n";
      }
    });

    return short_code_comment_fixed;
  },
  lineCommentToNoComment: function (script) {
    const short_lines2 = script.split("\n");

    // Covert line comments to global comment variables
    short_lines2.forEach((element, index) => {
      let trimmed = element.trim();

      let lineCommentStartIndex = trimmed.indexOf("--");

      if (lineCommentStartIndex !== -1) {
        let beginning = trimmed.substring(0, lineCommentStartIndex);
        let comment = trimmed
          .substring(lineCommentStartIndex + 2, trimmed.length)
          .trim();

        let gotReturnChar = false;
        if (comment.indexOf("\r") == comment.length - 1) {
          gotReturnChar = true;
          comment = comment.substring(0, comment.length - 1);
        }

        if (lineCommentStartIndex > 2) {
          comment = "$" + comment;
        }
        let commentEncoded = ' COMMENT="' + window.btoa(comment) + '"';

        if (gotReturnChar) {
          commentEncoded += "\r";
        }

        short_lines2[index] = beginning + commentEncoded;
      }
    });

    return short_lines2.join("\n");
  },

  noCommentToLineComment: function (script) {
    let lines = script.split("\n");

    let lines2 = [];

    lines.forEach((element, index) => {
      if (element.indexOf("COMMENT = ") !== -1) {
        let parts = element.split("COMMENT = ");
        //console.log("parts", parts);
        parts[1] = window.atob(parts[1].split('"')[1]);
        //console.log("parts", parts);

        if (parts[1].substring(0, 1) === "$") {
          parts[1] = parts[1].substring(1);
          let result = parts.join("--");
          //console.log(result);
          //console.log("$$$$");
          lines2[lines2.length - 1] += result;
        } else {
          let result = parts.join("--");
          //console.log(result);
          lines2.push(result);
        }
      } else {
        lines2.push(element);
      }
    });

    return lines2.join("\n");
  },

  shortify(script) {
    // We should heaviliy consider handling spaces and returns better!

    const splitArray = this.splitShortScript(script, "human");

    const shorted = this.splitArrayToString(splitArray, "short");

    return shorted;
  },

  typeCheck: function (type, value) {
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

  splitArrayToString: function (splitArray, direction) {
    let returnFormat;
    let lookupFormat;

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
        (lookup_element) => lookup_element[lookupFormat] == element.value,
      );

      try {
        if (this.typeCheck(element.type, element.value)) {
          string += `${found[returnFormat]}`;
        } else {
          string += element.value;
        }
      } catch (error) {
        console.error(`Could not ${returnFormat}ize section!`, element);

        string += element.value;
      }
    });

    return string;
  },

  splitExprToArray: function (splitExpr) {
    let altered = "";
    let depth = 0;
    //console.log(splitExpr)
    splitExpr.forEach((element, i) => {
      if (element.type == "grid_function" || element.type == "grid_variable") {
        // do nothing
      } else if (element.value == "(") {
        if (depth >= 1) {
          if (depth == 1) {
            altered += '"';
          }
          altered += "(";
        } else {
          altered += "[";
        }
        depth += 1;
      } else if (element.value == ")") {
        depth -= 1;
        if (depth >= 1) {
          altered += ")";
          if (depth == 1) {
            altered += '"';
          }
        } else {
          altered += "]";
        }
      } else if (element.value == "," && depth <= 1) {
        altered += ",";
      } else if (element.type == "arithmetic_operator" && depth <= 1) {
        altered += ',"' + element.value + '",';
      } else {
        if (depth <= 1 || element.value == undefined) {
          altered += '"' + element.value + '"';
        } else {
          altered += element.value;
        }
      }
    });
    return altered;
  },

  fnSplit: function (text) {
    const pattern = `().*`;

    const regex = new RegExp(pattern, "gs");

    let m;
    while ((m = regex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      return { start: m.index, end: regex.lastIndex };
    }
    return { start: null, end: null };
  },

  fnCommas: function (arr = []) {
    // original comma detection regex
    // ([a-zA-Z0-9\s)(]*[,]){${numOfComma}}
    const pattern = this.VALIDATOR.functions.pattern;
    let validity = [];
    let _fn;
    arr.forEach((str, i) => {
      const fn = new RegExp(pattern, "g").exec(str);
      if (fn) {
        _fn = fn[0].toUpperCase();
        let indices = [];
        for (let i = 0; i < str.length; i++) {
          if (str[i] === ",") indices.push(i);
        }
        validity.push(
          indices.length ===
            this.VALIDATOR.functions.values[fn[0]].parameters.length - 1,
        );
      } else {
        validity.push(false);
      }
    });

    return validity;
  },
};

export default stringManipulation;

export function debounce(callback, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay);
  };
}

stringManipulation.initialize(grid.properties.LUA);
