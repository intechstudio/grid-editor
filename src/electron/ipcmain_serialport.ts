import { setIntervalAsync, clearIntervalAsync } from "set-interval-async";

export const serial = {
  mainWindow: undefined,
};

const RECONNECT_INTERVAL = 1000;

let port_disovery_interval;

/* const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};
 */

// Basic serial usage
async function attemptSerialConnection() {
  console.log("Attmepting to connect serial port...");
  if (serial.mainWindow !== undefined) {
    try {
      const timeoutPromise = new Promise((res) =>
        setTimeout(() => res("Serial port connect request timed out!"), 1000)
      ).then((e) => {
        //If the timeout function returns first, do the error handling
        throw e;
      });

      //Always return with a false if successful
      const portRequestPromise =
        serial.mainWindow.webContents.executeJavaScript(
          `if(navigator.intechConnect){navigator.intechConnect()}`,
          true
        );

      //Check which async function return first
      const result = await Promise.race([timeoutPromise, portRequestPromise]);
    } catch (e) {
      console.log(e);
    }
  }
}

export function restartSerialCheckInterval() {
  clearIntervalAsync(port_disovery_interval);
  port_disovery_interval = setIntervalAsync(
    attemptSerialConnection,
    RECONNECT_INTERVAL
  );
}

restartSerialCheckInterval();
