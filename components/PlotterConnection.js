import { ActionTypes, usePenplotterDispatch } from "../contexts/Penplotter";

import config from "../config";
import { useEffect } from "react";
import useWebSocket from "react-use-websocket";

const PlotterConnection = () => {
  const socketUrl = config.websocket.address;
  const penplotterDispatch = usePenplotterDispatch();
  const { readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    onMessage: (message) => {
      const messageJson = JSON.parse(message.data);
      if (
        Object.keys(ActionTypes).includes(messageJson.type) &&
        messageJson.payload
      ) {
        penplotterDispatch({
          type: messageJson.type,
          payload: messageJson.payload,
        });
      } else {
        console.error("unknown message format for message", messageJson);
      }
    },
  });

  const isReady = readyState === 1 ? true : false;

  useEffect(() => {
    if (isReady === true) {
      penplotterDispatch({
        type: ActionTypes.SET_PLOTTER_CONNECTED,
        payload: true,
      });
    } else {
      penplotterDispatch({
        type: ActionTypes.SET_PLOTTER_CONNECTED,
        payload: false,
      });
    }
  }, [isReady]);

  return null;
};

export default PlotterConnection;
