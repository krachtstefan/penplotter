import { PenPosition } from "../contexts/Penplotter/types";
import React from "react";
import config from "../config";
import moment from "moment";
import { usePenplotterContext } from "../contexts/Penplotter";
import useWebSocket from "react-use-websocket";

const ControlPanel: React.FC = () => {
  const { sendJsonMessage } = useWebSocket(config.websocket.address);
  const {
    connected,
    pen: { position: penPosition, isBusy: penIsBusy },
    drawing: {
      instructions,
      isBusy: plotterIsBusy,
      progress: { startedAtMs, etaMs, progress },
    },
  } = usePenplotterContext();

  const penPositionUnkown = penPosition === PenPosition.UNKNOWN;
  const penLifted = penPosition === PenPosition.UP;
  const penNotLifted = penPosition === PenPosition.DOWN;
  const disablePenButton =
    !connected || penPositionUnkown || penIsBusy || plotterIsBusy;
  const disableDrawButton =
    !connected ||
    plotterIsBusy ||
    disablePenButton ||
    instructions.length === 0;
  return (
    <div style={{ padding: 10, position: "absolute", zIndex: 1000 }}>
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
      <h2>Progress</h2>
      <strong>
        started at {startedAtMs ? moment(startedAtMs).format("LT") : "unknown"}
      </strong>
      <br />
      <strong>eta {etaMs ? moment(etaMs).format("LT") : "unknown"}</strong>
      <br />
      <strong>
        <div
          style={{
            width: 200,
            border: "1px solid green",
            padding: 1,
            position: "relative",
            height: 20,
            marginTop: 5,
            borderRadius: 2,
            display: "grid",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              fontFamily: "sans-serif",
              textAlign: "center",
              fontSize: 11,
              paddingTop: 3,
            }}
          ></div>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "green",
              transition: "width 1s",
            }}
          ></div>
        </div>
      </strong>
    </div>
  );
};

export default ControlPanel;
