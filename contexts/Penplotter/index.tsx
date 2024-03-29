import {
  ActionTypes,
  PenPosition,
  PenplotterActions,
  PenplotterState,
} from "./types";
import React, { createContext, useContext, useReducer } from "react";

const DEFAULT_PENPLOTTER_STATE: PenplotterState = {
  connected: false, // will be set with the initial update from the plotter
  pen: {
    position: PenPosition.UNKNOWN,
    isBusy: false,
  },
  drawing: {
    isBusy: false,
    instructions: [],
    progress: {
      startedAtMs: undefined,
      etaMs: undefined,
      progress: 0,
    },
  },
};

const PenplotterStateContext = createContext<PenplotterState>(
  DEFAULT_PENPLOTTER_STATE
);
const PenplotterDispatchContext = createContext<React.Dispatch<PenplotterActions> | null>(
  null
);

const penplotterReducer = (
  state: PenplotterState,
  action: PenplotterActions
): PenplotterState => {
  console.log("received action", action);
  switch (action.type) {
    case ActionTypes.NO_CONNECTION: {
      return { ...state, connected: false };
    }
    case ActionTypes.UPDATE_PLOTTER_STATE: {
      const payload = action.payload;
      switch (payload.path) {
        case "penplotter":
          return { ...state, ...payload.data };
        case "penplotter.pen":
          return { ...state, pen: { ...state.pen, ...payload.data } };
        case "penplotter.drawing.isBusy":
          return {
            ...state,
            drawing: { ...state.drawing, isBusy: payload.data },
          };
        case "penplotter.drawing.instructions":
          return {
            ...state,
            drawing: { ...state.drawing, instructions: payload.data },
          };
        case "penplotter.drawing.progress":
          return {
            ...state,
            drawing: { ...state.drawing, progress: payload.data },
          };
        default:
          console.error(`path not implemented. ${payload}`);
          return state;
      }
    }
    default: {
      throw new Error(`Unhandled action type. ${action}`);
    }
  }
};

const usePenplotterContext = () => {
  const context = useContext(PenplotterStateContext);
  if (context === undefined) {
    throw new Error(
      "usePenplotterContext must be used within a PenplotterStateContext"
    );
  }
  return context;
};

const usePenplotterDispatch = () => {
  const context = useContext(PenplotterDispatchContext);
  if (!context) {
    throw new Error(
      "usePenplotterDispatch must be used within a PenplotterDispatchContext"
    );
  }
  return context;
};

const PenplotterProvider: React.FC = ({ children }) => {
  const [penplotterState, dispatch] = useReducer(
    penplotterReducer,
    DEFAULT_PENPLOTTER_STATE
  );
  return (
    <PenplotterStateContext.Provider value={penplotterState}>
      <PenplotterDispatchContext.Provider value={dispatch}>
        {children}
      </PenplotterDispatchContext.Provider>
    </PenplotterStateContext.Provider>
  );
};

export { PenplotterProvider, usePenplotterContext, usePenplotterDispatch };
