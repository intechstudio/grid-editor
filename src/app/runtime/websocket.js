export function initialize_ws(){

  console.log("WS: initialize")

}

let heartbeatTimeout;

const client = new WebSocket('ws://localhost:1337');

console.log("WS: ", client);

client.addEventListener('open', e => {

  heartbeatTimeout = setTimeout(e=>{client.close()}, 5000 + 1000);

  client.addEventListener('message', function message(data) {

    const decoded = JSON.parse(data.data)

    if (decoded.event === "grid_ping"){

      //console.log("PING")
      clearTimeout(heartbeatTimeout)
      heartbeatTimeout = setTimeout(e=>{client.close()}, 5000 + 1000);

      client.send(JSON.stringify({"event":"grid_pong"}))
    }
  });
});


client.addEventListener('close', function clear() {
  console.log("CONNECTION CLOSED")
  clearTimeout(heartbeatTimeout)
});