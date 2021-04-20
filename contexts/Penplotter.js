import React, { createContext, useContext, useReducer } from "react";

const penPositions = {
  UP: "UP",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
};

const DEFAULT_PENPLOTTER_STATE = {
  connected: false, // TODO: 🚨 this must be part of penplotters hardware state too (or remove it)
  pen: {
    position: penPositions.UNKNOWN,
    isBusy: false,
  },
};

const PenplotterStateContext = createContext(DEFAULT_PENPLOTTER_STATE);
const PenplotterDispatchContext = createContext(null);

const actionTypes = {
  SET_PLOTTER_CONNECTED: "SET_PLOTTER_CONNECTED",
  UPDATE_PLOTTER_STATE: "UPDATE_PLOTTER_STATE",
};

const penplotterReducer = (state, action) => {
  console.log("received action", action);
  switch (action.type) {
    case actionTypes.SET_PLOTTER_CONNECTED: {
      return { ...state, connected: action.payload };
    }
    case actionTypes.UPDATE_PLOTTER_STATE: {
      const { path, data } = action.payload;
      switch (path) {
        case "penplotter":
          return { ...state, ...data };
        case "penplotter.pen":
          return { ...state, pen: { ...state.pen, ...data } };
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
