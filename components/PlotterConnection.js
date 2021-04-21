import { actionTypes, usePenplotterDispatch } from "../contexts/Penplotter";

import config from "../config";
import { useEffect } from "react";
import useWebSocket from "react-use-websocket";

const PlotterConnection = () => {
  const penplotterDispatch = usePenplotterDispatch();
  const { readyState } = useWebSocket(config.websocket.address, {
    shouldReconnect: () => true,
    onMessage: (message) => {
      const messageJson = JSON.parse(message.data);
      if (
        Object.keys(actionTypes).includes(messageJson.type) &&
        messageJson.payload !== undefined
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

  const noConnection = readyState !== 1 ? true : false;

  useEffect(() => {
    if (noConnection === true) {
      penplotterDispatch({
        type: actionTypes.NO_CONNECTION,
      });
    }
  }, [noConnection]);

  return null;
};

export default PlotterConnection;
