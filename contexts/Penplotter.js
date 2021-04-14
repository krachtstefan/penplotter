import React, { createContext, useContext, useReducer } from "react";

const defaultState = {
  connected: false,
};

const PenplotterStateContext = createContext(defaultState);
const PenplotterDispatchContext = createContext(null);

const ActionTypes = {
  SEND_PLOTTER_JOB: "SEND_PLOTTER_JOB",
};

const penplotterReducer = (state, action) => {
  switch (action.type) {
    default: {
      throw new Error(`Unhandled action type`);
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
    defaultState
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
  ActionTypes,
  PenplotterProvider,
  usePenplotterContext,
  usePenplotterDispatch,
};
