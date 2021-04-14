import React, { useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import config from "../config";
import dynamic from "next/dynamic";

const PenPlotter = dynamic(() => import("../components/PenPlotter"), {
  ssr: false,
});

const Home = () => {
  const socketUrl = config.websocket.address;

  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => console.log("opened"),
    onClose: () => console.log("closed"),
    onError: () => console.log("error"),
    shouldReconnect: () => true,
  });

  const connectionStatus = {
    [0]: "Connecting",
    [1]: "Open",
    [2]: "Closing",
    [3]: "Closed",
    [-1]: "Uninstantiated",
  }[readyState];

  console.log(
    "connectionStatus",
    connectionStatus,
    "lastJsonMessage",
    lastJsonMessage
  );

  return (
    <>
      <button
        onClick={() => {
          sendJsonMessage({ cool: "message" });
        }}
      >
        Send Message
      </button>
      <PenPlotter />
    </>
  );
};

export default Home;
