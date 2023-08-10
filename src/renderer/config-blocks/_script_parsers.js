export class Script {
  static toSegments({ script, short }) {
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
  }

  static toScript({ short, array = [] }) {
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
  }
}
