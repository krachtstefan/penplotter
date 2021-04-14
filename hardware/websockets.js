const config = require("./config");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: config.websocket.port });

const populate = (message) =>
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });

module.exports = { server: wss, populate };
