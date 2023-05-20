import { store } from "../main-store";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { app } from "electron";
import log from "electron-log";
import dotenv from "dotenv";
dotenv.config();

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = store.get("userId") || uuidv4();
// (re)save the userid, so it persists for the next app session.
store.set("userId", userId);

// using the measurement protocol
export async function googleAnalytics(name, params) {
  const measurement_id = `G-SJB4MHFG3N`;
  const api_secret = `snyDyY8-Rka6ZrCTe_6m-A`;

  console.log("send to google...", userId, name, params);

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: userId,
          events: [
            {
              name: name.replace(/\s|-/g, "_"),
              params: params,
            },
          ],
        }),
      }
    );
  } catch (error) {
    console.log("google analytics error", error);
  }
}
