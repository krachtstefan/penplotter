import { penPositions, usePenplotterContext } from "../contexts/Penplotter";

import React from "react";
import config from "../config";
import useWebSocket from "react-use-websocket";

const ControlPanel = () => {
  const { sendJsonMessage } = useWebSocket(config.websocket.address);
  const {
    connected,
    pen: { position: penPosition, isBusy: penIsBusy },
    drawing: { instructions, isBusy: plotterIsBusy },
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
      <h2>Pen</h2>
      <strong>Pen is busy? {penIsBusy === true ? "👍" : "👎"}</strong>
      <br />
      <strong>
        Current pen position? {penLifted ? "👆" : ""} {penNotLifted ? "👇" : ""}{" "}
        {penPositionUnkown ? "🤷‍♂️" : ""}
      </strong>
      <h2>Plotter</h2>
      <strong>Plotter is online? {connected === true ? "👍" : "👎"}</strong>
      <br />
      <strong>Plotter is busy? {plotterIsBusy === true ? "👍" : "👎"}</strong>
      <br />
      <strong>Drawing instructions? {instructions.length}</strong>
    </div>
  );
};

export default ControlPanel;
