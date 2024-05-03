import { grid } from "../../protocol/grid-protocol";
import { formatText } from "lua-fmt";

export const stringManipulation = {
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
    // Regular expression to match Lua block comments
    var blockCommentRegex = /--\[\[\s*([\s\S]*?)\s*--\]\]/g;

    // Replace each block comment with equivalent line comments
    var convertedCode = script.replace(blockCommentRegex, function (match, p1) {
      // Split the block comment into lines and add '-- ' to each line
      var lines = p1.split("\n");
      var commentedLines = lines.map(function (line) {
        return "-- " + line.trim();
      });

      // Join the lines back together with newline characters
      return commentedLines.join("\n");
    });

    return convertedCode;
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
        (lookup_element) => lookup_element[lookupFormat] == element.value
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

  compressScript: function (script) {
    let code = script;
    code = stringManipulation.shortify(code);
    const result = formatText(code);
    return result.trim();
  },

  expandScript: function (script) {
    let code = script;
    const result = stringManipulation.humanize(String(code));
    return result.trim();
  },
};

stringManipulation.initialize(grid.getProperty("LUA"));
