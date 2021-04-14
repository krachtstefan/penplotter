import {
  usePenplotterContext,
  usePenplotterDispatch,
} from "../contexts/Penplotter";

import React from "react";

const ControlPanel = () => {
  const { connected, pen } = usePenplotterContext();
  const penplotterDispatch = usePenplotterDispatch();
  return (
    <div>
      <button
        disabled={!connected}
        onClick={() => {
          penplotterDispatch({ type: "1", payload: { payload: true } });
        }}
      >
        pen up
      </button>
      <button
        disabled={!connected}
        onClick={() => {
          penplotterDispatch({ type: "1", payload: { payload: true } });
        }}
      >
        pen down
      </button>
      Pen is up? {pen.isUp === true ? "YES" : ""}
      {pen.isUp === false ? "NO" : ""}
      {pen.isUp === null ? "unknown" : ""}
    </div>
  );
};

export default ControlPanel;
