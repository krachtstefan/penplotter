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
  const disablePenButton =
    !connected || penPositionUnkown || penIsBusy || plotterIsBusy;
  const disableDrawButton =
    !connected ||
    plotterIsBusy ||
    disablePenButton ||
    instructions.length === 0;
  return (
    <div>
      <h2>Pen</h2>
      <strong>Pen is busy? {penIsBusy === true ? "👍" : "👎"}</strong>
      <br />
      <strong>
        Current pen position? {penLifted ? "👆" : ""} {penNotLifted ? "👇" : ""}{" "}
        {penPositionUnkown ? "🤷‍♂️" : ""}
      </strong>
      <br />
      <button
        disabled={disablePenButton || penLifted}
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
        disabled={disablePenButton || penNotLifted}
        onClick={() => {
          sendJsonMessage({
            type: "MOVE_PEN",
            payload: "DOWN",
          });
        }}
      >
        🖊 👇
      </button>
      <h2>Plotter</h2>
      <strong>Plotter is online? {connected === true ? "👍" : "👎"}</strong>
      <br />
      <strong>Drawing instructions? {instructions.length}</strong>
      <br />
      <button
        disabled={disableDrawButton}
        onClick={() => {
          sendJsonMessage({ type: "START_DRAWING" });
        }}
      >
        {plotterIsBusy === false ? "Start drawing" : "Plotter is drawing"}
      </button>
    </div>
  );
};

export default ControlPanel;
