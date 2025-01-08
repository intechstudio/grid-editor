export class Grid {
  static toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
  }

  static isParenthesisClosed(value: string) {
    const pairs = [
      { start: "(", end: ")" },
      { start: "[", end: "]" },
    ];
    const stacks = new Map();

    // Initialize stacks for each pair
    pairs.forEach((pair) => {
      stacks.set(pair, []);
    });

    // Process each character in the input value
    for (const char of value) {
      // Find the corresponding pair for the current character
      const pair = pairs.find((e) => e.start === char || e.end === char);

      // If no pair is found (invalid character), continue
      if (!pair) continue;

      // Check if the character is a start or end bracket for the pair
      switch (char) {
        case pair.start:
          stacks.get(pair).push(char); // Push to the stack of the corresponding pair
          break;
        case pair.end:
          // Check if there's a corresponding start, and pop from the stack
          if (stacks.get(pair).length === 0) {
            return false; // Unmatched closing bracket
          }
          stacks.get(pair).pop();
          break;
      }
    }

    // Check if all stacks are empty, meaning all parentheses are closed correctly
    return [...stacks.values()].every((stack) => stack.length === 0);
  }

  static getClosestEvent(events: number[], event: number) {
    if (events.map((e) => Number(e)).includes(Number(event))) {
      return event;
    }

    //Select closest event type if incoming device does not have the corrently selected event type
    const closestEvent = Math.min(
      ...events.map((e) => Number(e)).filter((e) => e > 0)
    );

    return closestEvent !== Infinity ? closestEvent : 0;
  }
}
