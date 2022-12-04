import {keyboard, Key} from "@nut-tree/nut-js";

keyboard.config = { autoDelayMs: 10 }

export async function typeKey(key: Key){ 
  await keyboard.type(Key[key]);
}