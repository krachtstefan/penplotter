import React from "react";
import config from "../config";
import { usePenplotterContext } from "../contexts/Penplotter";
import useWebSocket from "react-use-websocket";

const ControlPanel = () => {
  const { sendJsonMessage } = useWebSocket(config.websocket.address);
  const {
    connected,
    pen: { isUp: penIsUp },
  } = usePenplotterContext();

  const penPositionUnkown = penIsUp === null;
  const penLifted = penIsUp === true;
  const penNotLifted = penIsUp === false;
  return (
    <div>
      <button
        disabled={!connected || penPositionUnkown}
        onClick={() => {
          sendJsonMessage({
            type: "MOVE_PEN",
            payload: penLifted === true ? "DOWN" : "UP",
          });
        }}
      >
        {penPositionUnkown === true ? "pen position unknown" : ""}
        {penLifted === true ? "attach pen" : ""}
        {penNotLifted === true ? "lift pen" : ""}
      </button>
    </div>
  );
};

export default ControlPanel;
