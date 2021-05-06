import { RootState } from "../index";

export interface PenplotterState {
  connected: boolean;
  pen: {
    position: PenPosition;
    isBusy: boolean;
  };
  drawing: {
    isBusy: boolean;
    instructions: PenplotterInstruction[];
    progress: PenProgress;
  };
}

export interface PenProgress {
  startedAtMs?: number;
  etaMs?: number;
  progress: number;
}

export interface PenplotterInstruction {
  left: number;
  right: number;
  pen: PenPosition.UP | PenPosition.DOWN;
}

export enum PenPosition {
  UP = "UP",
  DOWN = "DOWN",
  UNKNOWN = "UNKNOWN",
}

export enum ActionTypes {
  START_PEN_MOVEMENT = "START_PEN_MOVEMENT",
  FINISH_PEN_MOVEMENT = "FINISH_PEN_MOVEMENT",
  ADD_DRAWING_JOB = "ADD_DRAWING_JOB",
  START_DRAWING = "START_DRAWING",
  STOP_DRAWING = "STOP_DRAWING",
  UPDATE_PROGRESS = "UPDATE_PROGRESS",
}

export interface UpdateMap {
  actions: ActionTypes[];
  path: string;
  state: (state: RootState) => unknown;
}

export interface PopulateStateAction {
  // 🚨 TODO: when types can be shared, use UpdatePlotterStateAction type here
  type: "UPDATE_PLOTTER_STATE";
  payload: {
    path: string;
    data: unknown;
  };
}

export interface StartPenMovementAction {
  type: ActionTypes.START_PEN_MOVEMENT;
  payload: PenPosition;
}

export interface FinishPenMovementAction {
  type: ActionTypes.FINISH_PEN_MOVEMENT;
  payload: PenPosition;
}

export interface AddDrawingJobAction {
  type: ActionTypes.ADD_DRAWING_JOB;
  payload: PenplotterInstruction[];
}

export interface StartDrawingAction {
  type: ActionTypes.START_DRAWING;
}

export interface StopDrawingAction {
  type: ActionTypes.STOP_DRAWING;
}

export interface UpdateProgressAction {
  type: ActionTypes.UPDATE_PROGRESS;
  payload: PenProgress;
}

export type PenplotterActions =
  | StartPenMovementAction
  | FinishPenMovementAction
  | AddDrawingJobAction
  | StartDrawingAction
  | StopDrawingAction
  | UpdateProgressAction;
