function splitExpression(expression) {
  var parts = [];
  var currentPart = "";
  var parenthesisCount = 0;
  var bracketCount = 0;

  for (var i = 0; i < expression.length; i++) {
    var char = expression.charAt(i);
    if (
      (char === "," && parenthesisCount === 0 && bracketCount === 0) ||
      i === expression.length - 1
    ) {
      if (i === expression.length - 1 && char !== ",") {
        currentPart += char;
      }
      parts.push(currentPart.trim());
      currentPart = "";
    } else {
      currentPart += char;
      if (char === "(") {
        parenthesisCount++;
      } else if (char === ")") {
        parenthesisCount--;
      } else if (char === "[") {
        bracketCount++;
      } else if (char === "]") {
        bracketCount--;
      }
    }
  }

  if (expression.charAt(expression.length - 1) === ",") {
    parts.push("");
  }

  return parts;
}

export class Script {
  static toSegments({ script, short }) {
    const expressions = [
      {
        name: "for loop",
        regex: /\bfor\s.+do\b/g,
      },
      {
        name: "if statement",
        regex: /\bif\s+.+\s+then\b/g,
      },
      {
        name: "function call",
        regex: /\w+\s*\(/g,
      },
    ];

    const exp = expressions.find((e) => e.regex.exec(script) !== null);

    // get the part after function name with parenthesis
    let config = [];

    // extract script parts as a whole
    switch (exp.name) {
      case "function call": {
        // remove short
        config = script.split(short)[1];
        // remove parenthesis
        config = config.replace(/^\((.*)\)$/, "$1");
        // split by comma to make array

        // old implementation: config = config.split(",");
        config = splitExpression(config);

        break;
      }
      case "for loop": {
        //remove for
        config = script.replace("for", "");
        //remove do
        const index = config.lastIndexOf("do");
        config = config.slice(0, index) + config.slice(index + "do".length);
        // split by comma to make array
        config = config.split(",");
        // split by "=" to extract variable name and value
        config = [...config[0].split("="), ...config.slice(1)];
        break;
      }
      case "for loop": {
        //remove if
        config = script.replace("if", "");
        //remove then
        const index = config.lastIndexOf("then");
        config = config.slice(0, index) + config.slice(index + "then".length);
        //make it an array
        config = [config];
        break;
      }
    }
    // trim whitespaces
    config = config.map((c) => c.trim());
    return config;
  }

  static toScript({ short, array = [] }) {
    const code = `${short}(${array.join(",")})`;
    return code;
  }
}
