import { ActionTypes, usePenplotterDispatch } from "../contexts/Penplotter";
import React, { useEffect } from "react";

import config from "../config";
import useWebSocket from "react-use-websocket";

const PlotterConnection = ({ children }) => {
  const socketUrl = config.websocket.address;
  const penplotterDispatch = usePenplotterDispatch();
  const { readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
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

  return <>{children}</>;
};

export default PlotterConnection;
