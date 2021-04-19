import React, { createContext, useContext, useReducer } from "react";

const defaultState = {
  connected: false,
  pen: {
    isUp: null,
  },
};

const PenplotterStateContext = createContext(defaultState);
const PenplotterDispatchContext = createContext(null);

const actionTypes = {
  SET_PLOTTER_CONNECTED: "SET_PLOTTER_CONNECTED",
  SET_PEN_IS_UP: "SET_PEN_IS_UP",
};

const penplotterReducer = (state, action) => {
  console.log("received action", action);
  switch (action.type) {
    case actionTypes.SET_PLOTTER_CONNECTED: {
      return { ...state, connected: action.payload };
    }
    case actionTypes.SET_PEN_IS_UP: {
      return { ...state, pen: { ...state.pen, isUp: action.payload } };
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
  actionTypes,
  PenplotterProvider,
  usePenplotterContext,
  usePenplotterDispatch,
};
