import { grid } from "@intechstudio/grid-protocol";

import { messageStream } from "./message-stream.store.js";

import { debug_lowlevel_store } from "../main/panels/DebugMonitor/DebugMonitor.store.js";

const configuration = window.ctxProcess.configuration();

// INITIALIZE THE INTERVAL
console.log(
  "Initialize Discovery Interval! ENABLE debugging through navigator.debugSerial = true"
);

export async function requestPort() {
  if (navigator.debugSerial) console.log("Serial Try Connect");

  if (navigator.intechPort === undefined) {
    const filters = [
      {
        usbVendorId: parseInt(configuration.USB_VID_0),
        usbProductId: parseInt(configuration.USB_PID_0),
      },
      {
        usbVendorId: parseInt(configuration.USB_VID_1),
        usbProductId: parseInt(configuration.USB_PID_1),
      },
      {
        usbVendorId: parseInt(configuration.USB_VID_2),
        usbProductId: parseInt(configuration.USB_PID_2),
      },
    ];

    navigator.serial
      .requestPort({ filters })
      .then((port) => {
        port
          .open({ baudRate: 2000000 })
          .then((e) => {
            navigator.intechPort = port;

            port.addEventListener("disconnect", (e) => {
              if (navigator.serialDebug) console.log("Device disconnected:", e);
              navigator.intechPort = undefined;
            });

            fetchStream();
          })
          .catch((error) => {
            if (navigator.debugSerial) console.log("Error on Open: ", error);
          });
      })
      .catch((error) => {
        //no port selected by the user
        if (navigator.debugSerial) console.log("Error on Request: ", error);
      });
  }

  return false;
}

navigator.intechConnect = requestPort;

let result = [];

async function fetchStream() {
  console.log("--------serial---------");

  if (!navigator.intechPort || !navigator.intechPort.readable) {
    console.warn("Invalid or missing navigator.intechPort");
    return;
  }

  console.log(navigator.intechPort.readable, navigator.intechPort);

  const reader = navigator.intechPort.readable.getReader();
  let charsReceived = 0;
  let rxBuffer = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream complete");
        break;
      }

      charsReceived += value.length;
      const chunk = value;

      let buffer = Array.from(chunk);

      for (let i = 0; i < buffer.length; i++) {
        rxBuffer.push(buffer[i]);
      }

      let messageStartIndex = 0;
      let messageStopIndex = 0;

      for (let i = 0; i < rxBuffer.length; i++) {
        if (rxBuffer[i] === 10) {
          // newline character found
          messageStopIndex = i;
          let currentMessage = rxBuffer.slice(
            messageStartIndex,
            messageStopIndex
          );
          messageStartIndex = i + 1;

          // Decode the message
          debug_lowlevel_store.push_inbound(currentMessage);
          let class_array = grid.decode_packet_frame(currentMessage);
          grid.decode_packet_classes(class_array);

          if (class_array !== false) {
            messageStream.deliver_inbound(class_array);
          }
        }
      }

      rxBuffer = rxBuffer.slice(messageStartIndex);
    }
  } catch (error) {
    console.warn("Error reading from serial port:", error);
  } finally {
    reader.releaseLock();
  }
}

navigator.intechFetch = fetchStream;

// Send Serial data to the webserial interface

export function serial_write_islocked() {
  if (navigator.intechPort === undefined || navigator.intechPort === null) {
    return true;
  }

  if (
    navigator.intechPort.writable === undefined ||
    navigator.intechPort.writable === null
  ) {
    return true;
  }

  let port = navigator.intechPort;

  if (port.writable.locked === true) {
    return false;
  }
}

export function serial_write(param) {
  if (param === undefined) {
    return Promise.reject("Serial Write Error 1.");
  }

  if (navigator.intechPort === undefined || navigator.intechPort === null) {
    return Promise.reject("Serial Write Error 2.");
  }

  if (
    navigator.intechPort.writable === undefined ||
    navigator.intechPort.writable === null
  ) {
    return Promise.reject("Serial Write Error 3.");
  }

  return new Promise((resolve, reject) => {
    param.push(10);

    debug_lowlevel_store.push_outbound(param);

    let port = navigator.intechPort;

    if (port.writable.locked === true) {
      //console.log("SORRY it's locked");
      reject("SORRY it's locked");
      return;
    }

    const writer = port.writable.getWriter();

    const data = new Uint8Array(param);

    writer
      .write(data)
      .then((e) => {
        // Allow the serial port to be closed later.
        writer.releaseLock();
        resolve();
      })
      .catch((e) => {
        console.log(e);
        reject(e);
      });
  });
}
