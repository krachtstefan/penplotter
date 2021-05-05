import { PopulateStateAction } from "./redux/penplotter/types";
import WebSocket from "ws";
import config from "./config";
export const wss = new WebSocket.Server({ port: config.websocket.port });

export const populate = (message: PopulateStateAction) =>
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
