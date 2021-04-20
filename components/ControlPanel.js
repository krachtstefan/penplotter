import { penPositions, usePenplotterContext } from "../contexts/Penplotter";

import React from "react";
import config from "../config";
import useWebSocket from "react-use-websocket";

const ControlPanel = () => {
  const { sendJsonMessage } = useWebSocket(config.websocket.address);
  const {
    connected,
    pen: { position: penPosition, isBusy: penIsBusy },
  } = usePenplotterContext();

  const penPositionUnkown = penPosition === penPositions.UNKNOWN;
  const penLifted = penPosition === penPositions.UP;
  const penNotLifted = penPosition === penPositions.DOWN;
  const disableButton = !connected || penPositionUnkown || penIsBusy;
  return (
    <div>
      <button
        disabled={disableButton || penLifted}
        onClick={() => {
          sendJsonMessage({
            type: "MOVE_PEN",
            payload: "UP",
          });
        }}
      >
        🖊 👆
      </button>{" "}
      <button
        disabled={disableButton || penNotLifted}
        onClick={() => {
          sendJsonMessage({
            type: "MOVE_PEN",
            payload: "DOWN",
          });
        }}
      >
        🖊 👇
      </button>
      <br />
      <strong>Pen is busy? {penIsBusy === true ? 1 : 0}</strong>
      <br />
      <strong>
        Current pen position? {penLifted ? "👆" : ""} {penNotLifted ? "👇" : ""}{" "}
        {penPositionUnkown ? "🤷‍♂️" : ""}
      </strong>
    </div>
  );
};

export default ControlPanel;
