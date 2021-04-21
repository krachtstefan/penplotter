const actionTypes = {
  START_PEN_MOVEMENT: "START_PEN_MOVEMENT",
  FINISH_PEN_MOVEMENT: "FINISH_PEN_MOVEMENT",
  ADD_DRAWING_JOB: "ADD_DRAWING_JOB",
  START_DRAWING: "START_DRAWING",
  STOP_DRAWING: "STOP_DRAWING",
};

const penPositions = {
  UP: "UP",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
};

const updateMapping = [
  {
    actions: [actionTypes.START_PEN_MOVEMENT, actionTypes.FINISH_PEN_MOVEMENT],
    path: "penplotter.pen",
    state: (state) => state.penplotter.pen,
  },
  {
    actions: [actionTypes.ADD_DRAWING_JOB],
    path: "penplotter.drawing.instructions",
    state: (state) => state.penplotter.drawing.instructions,
  },
  {
    actions: [actionTypes.START_DRAWING, actionTypes.STOP_DRAWING],
    path: "penplotter.drawing.isBusy",
    state: (state) => state.penplotter.drawing.isBusy,
  },
];

const DEFAULT_PENPLOTTER_STATE = {
  connected: true,
  pen: {
    position: penPositions.UNKNOWN,
    isBusy: false,
  },
  drawing: {
    isBusy: false,
    instructions: [],
    progress: {},
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

const addDrawingJob = (instructions) => ({
  type: actionTypes.ADD_DRAWING_JOB,
  payload: instructions,
});

const startDrawing = () => ({
  type: actionTypes.START_DRAWING,
});

const stopDrawing = () => ({
  type: actionTypes.STOP_DRAWING,
});

const reducer = (state = DEFAULT_PENPLOTTER_STATE, action) => {
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
    case actionTypes.ADD_DRAWING_JOB: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          instructions: action.payload,
        },
      };
    }
    case actionTypes.START_DRAWING: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          isBusy: true,
        },
      };
    }
    case actionTypes.STOP_DRAWING: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          isBusy: false,
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
  addDrawingJob,
  startDrawing,
  stopDrawing,
  updateMapping,
};
