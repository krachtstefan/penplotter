import { ActionTypes } from "../contexts/Penplotter/types";
import config from "../config";
import { useEffect } from "react";
import { usePenplotterDispatch } from "../contexts/Penplotter";
import useWebSocket from "react-use-websocket";

const PlotterConnection: React.FC = () => {
  const penplotterDispatch = usePenplotterDispatch();
  const { readyState } = useWebSocket(config.websocket.address, {
    shouldReconnect: () => true,
    onMessage: (message) => {
      const messageJson = JSON.parse(message.data);
      if (
        Object.keys(ActionTypes).includes(messageJson.type) &&
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
        type: ActionTypes.NO_CONNECTION,
      });
    }
  }, [noConnection]);

  return null;
};

export default PlotterConnection;
