import { Grid } from "../lib/_utils";

function splitExpression(expression) {
  let res = [];
  let part = "";
  for (const char of expression) {
    if (Grid.isBracketClosed(part) && char === ",") {
      res.push(part.trim());
      part = "";
    } else {
      part += char;
    }
  }

  res.push(part);

  return res;
}

export function extractParam(script, key) {
  const prefix = `self:${key}(`;
  const start = script.indexOf(prefix);
  if (start === -1) return null;
  let depth = 0;
  const contentStart = start + prefix.length;
  for (let i = contentStart - 1; i < script.length; i++) {
    if (script[i] === "(") depth++;
    else if (script[i] === ")") {
      depth--;
      if (depth === 0) return script.slice(contentStart, i);
    }
  }
  return null;
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
