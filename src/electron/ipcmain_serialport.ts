const { setIntervalAsync, clearIntervalAsync } = require("set-interval-async");

export const serial = {
  mainWindow: undefined,
};

let port_disovery_interval;

/* const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};
 */

// Basic serial usage
async function listSerialPorts() {
  if (serial.mainWindow !== undefined) {
    try {
      const timeoutPromise = new Promise((res) =>
        setTimeout(() => res("Serial port connect request timed out!"), 1000)
      );

      //Always return with a false if successful
      const portRequestPromise =
        serial.mainWindow.webContents.executeJavaScript(
          `if(navigator.intechConnect){navigator.intechConnect()}`,
          true
        );

      //Check which async function return first
      const result = await Promise.race([timeoutPromise, portRequestPromise]);

      //If the timeout function returns first, do the error handling
      if (typeof result === "string") {
        throw new Error(result);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export function restartSerialCheckInterval() {
  if (typeof port_disovery_interval !== "undefined") {
    clearIntervalAsync(port_disovery_interval);
  }

  port_disovery_interval = setIntervalAsync(listSerialPorts, 1000);
}

restartSerialCheckInterval();
