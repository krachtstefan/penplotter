import {
  ActionTypes,
  AddDrawingJobAction,
  FinishPenMovementAction,
  PenPosition,
  PenProgress,
  PenplotterActions,
  PenplotterInstruction,
  PenplotterState,
  StartDrawingAction,
  StartPenMovementAction,
  StopDrawingAction,
  UpdateMap,
  UpdateProgressAction,
} from "./types";

export const updateMapping: UpdateMap[] = [
  {
    actions: [ActionTypes.START_PEN_MOVEMENT, ActionTypes.FINISH_PEN_MOVEMENT],
    path: "penplotter.pen",
    state: (state) => state.penplotter.pen,
  },
  {
    actions: [ActionTypes.ADD_DRAWING_JOB],
    path: "penplotter.drawing.instructions",
    state: (state) => state.penplotter.drawing.instructions,
  },
  {
    actions: [ActionTypes.START_DRAWING, ActionTypes.STOP_DRAWING],
    path: "penplotter.drawing.isBusy",
    state: (state) => state.penplotter.drawing.isBusy,
  },
  {
    actions: [ActionTypes.UPDATE_PROGRESS],
    path: "penplotter.drawing.progress",
    state: (state) => state.penplotter.drawing.progress,
  },
];

const DEFAULT_PENPLOTTER_STATE: PenplotterState = {
  connected: true,
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

export const startPenMovement = (
  position: PenPosition
): StartPenMovementAction => ({
  type: ActionTypes.START_PEN_MOVEMENT,
  payload: position,
});

export const finishPenMovement = (
  position: PenPosition
): FinishPenMovementAction => ({
  type: ActionTypes.FINISH_PEN_MOVEMENT,
  payload: position,
});

export const addDrawingJob = (
  instructions: PenplotterInstruction[]
): AddDrawingJobAction => ({
  type: ActionTypes.ADD_DRAWING_JOB,
  payload: instructions,
});

export const startDrawing = (): StartDrawingAction => ({
  type: ActionTypes.START_DRAWING,
});

export const stopDrawing = (): StopDrawingAction => ({
  type: ActionTypes.STOP_DRAWING,
});

export const updateProgress = (payload: PenProgress): UpdateProgressAction => ({
  type: ActionTypes.UPDATE_PROGRESS,
  payload,
});

export const reducer = (
  state: PenplotterState = DEFAULT_PENPLOTTER_STATE,
  action: PenplotterActions
): PenplotterState => {
  switch (action.type) {
    case ActionTypes.START_PEN_MOVEMENT:
    case ActionTypes.FINISH_PEN_MOVEMENT: {
      return {
        ...state,
        pen: {
          ...state.pen,
          position: action.payload,
          isBusy: action.type === ActionTypes.START_PEN_MOVEMENT ? true : false,
        },
      };
    }
    case ActionTypes.ADD_DRAWING_JOB: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          instructions: action.payload,
        },
      };
    }
    case ActionTypes.START_DRAWING: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          isBusy: true,
        },
      };
    }
    case ActionTypes.STOP_DRAWING: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          isBusy: false,
        },
      };
    }
    case ActionTypes.UPDATE_PROGRESS: {
      return {
        ...state,
        drawing: {
          ...state.drawing,
          progress: {
            ...action.payload,
          },
        },
      };
    }
    default:
      return state;
  }
};
