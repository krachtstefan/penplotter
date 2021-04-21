import React, { createContext, useContext, useReducer } from "react";

const penPositions = {
  UP: "UP",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
};

const DEFAULT_PENPLOTTER_STATE = {
  connected: false, // will be set with the initial update from the plotter
  pen: {
    position: penPositions.UNKNOWN,
    isBusy: false,
  },
  drawing: {
    isBusy: false,
    instructions: [],
    progress: {
      startedAtMs: null,
      etaMS: null,
      progress: 0,
    },
  },
};

const PenplotterStateContext = createContext(DEFAULT_PENPLOTTER_STATE);
const PenplotterDispatchContext = createContext(null);

const actionTypes = {
  NO_CONNECTION: "NO_CONNECTION",
  UPDATE_PLOTTER_STATE: "UPDATE_PLOTTER_STATE",
};

const penplotterReducer = (state, action) => {
  console.log("received action", action);
  switch (action.type) {
    case actionTypes.NO_CONNECTION: {
      return { ...state, connected: false };
    }
    case actionTypes.UPDATE_PLOTTER_STATE: {
      const { path, data } = action.payload;
      switch (path) {
        case "penplotter":
          return { ...state, ...data };
        case "penplotter.pen":
          return { ...state, pen: { ...state.pen, ...data } };
        case "penplotter.drawing.isBusy":
          return {
            ...state,
            drawing: { ...state.drawing, isBusy: data },
          };
        case "penplotter.drawing.instructions":
          return {
            ...state,
            drawing: { ...state.drawing, instructions: data },
          };
        case "penplotter.drawing.progress":
          return {
            ...state,
            drawing: { ...state.drawing, progress: data },
          };
        default:
          console.error(`path ${path} not implemented in ${action.type}`);
          return state;
      }
    }
    default: {
      throw new Error(`Unhandled action type ${action.type}`);
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

const PenplotterProvider = ({ children }) => {
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

export {
  actionTypes,
  penPositions,
  PenplotterProvider,
  usePenplotterContext,
  usePenplotterDispatch,
};
