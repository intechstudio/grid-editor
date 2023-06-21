// commonjs node require
import * as lua from "luaparse";

const _utils = {
  scriptToSegments: function ({ script, short }) {
    // get the part after function name with parenthesis
    let config = [];
    config = script.split(short)[1];
    // remove parenthesis
    config = config.slice(1, -1);
    // split by comma to make array
    config = config.split(",");
    // trim whitespaces
    config = config.map((c) => c.trim());

    //console.log(config)
    return config;
  },

  segmentsToScript: function ({ short, array = [] }) {
    let code = short; // prepend with type
    const _unformatted = JSON.stringify(array);
    [..._unformatted].forEach((e) => {
      if (e == "[") {
        code += "(";
      } else if (e == "]") {
        code += ")";
      } else if (e == '"') {
        /* no return */
      } else {
        code += e.trim();
      }
    });
    return code;
  },
};

export function luaParser({ config }) {
  let parser = "";
  try {
    lua.parse(config);
    parser = "VALID";
  } catch (error) {
    parser = error.message;
  }
  return parser;
}

export function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export function isLua(script) {
  try {
    lua.parse(script);
  } catch (err) {
    return false;
  }
  return true;
}

export default _utils;
