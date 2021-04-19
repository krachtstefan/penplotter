const actionTypes = {
  START_PEN_MOVEMENT: "START_PEN_MOVEMENT",
  FINISH_PEN_MOVEMENT: "FINISH_PEN_MOVEMENT",
};

const penPositions = {
  UP: "UP",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
};

const DEFAULT_PENPLOTTER_STATE = {
  pen: {
    position: penPositions.UNKNOWN,
    isBusy: false,
  },
};

const startPenMovement = (position) => ({
  type: actionTypes.START_PEN_MOVEMENT,
  payload: position,
});

const finishPenMovement = (position) => ({
  type: actionTypes.FINISH_PEN_MOVEMENT,
  payload: position,
});

const reducer = (state = DEFAULT_PENPLOTTER_STATE, action) => {
  console.log("penplotter reducer calles", action, state);
  switch (action.type) {
    case actionTypes.START_PEN_MOVEMENT:
    case actionTypes.FINISH_PEN_MOVEMENT: {
      return {
        ...state,
        pen: {
          ...state.pen,
          position: action.payload,
          isBusy: action.type === actionTypes.START_PEN_MOVEMENT ? true : false,
        },
      };
    }
  }
  return state;
};

module.exports = {
  reducer,
  penPositions,
  startPenMovement,
  finishPenMovement,
};
