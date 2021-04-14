import { PenplotterProvider } from "../contexts/Penplotter";
import React from "react";
import config from "../config";
import dynamic from "next/dynamic";
import useWebSocket from "react-use-websocket";

const PlotterPreview = dynamic(() => import("../components/PlotterPreview"), {
  ssr: false,
});

const Home = () => {
  const socketUrl = config.websocket.address;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    socketUrl,
    {
      onOpen: () => console.log("opened"),
      onClose: () => console.log("closed"),
      onError: () => console.log("error"),
      shouldReconnect: () => true,
    }
  );

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
    <PenplotterProvider>
      <button
        onClick={() => {
          sendJsonMessage({ cool: "message" });
        }}
      >
        Send Message
      </button>
      <PlotterPreview />
    </PenplotterProvider>
  );
};

export default Home;
