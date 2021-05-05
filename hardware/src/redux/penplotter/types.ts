import { RootState } from "../index";

export interface PenplotterState {
  connected: boolean;
  pen: {
    position: PenState; // 🚨 TODO: rename PenState to PenPosition
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
  pen: PenState.UP | PenState.DOWN;
}

export enum PenState {
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
  state: (state: RootState) => unknown; // 🚨 TODO: kepp this? or can it be typed
}

export interface PopulateStateAction {
  // 🚨 TODO: kepp this? or can it be typed
  type: "UPDATE_PLOTTER_STATE";
  payload: {
    path: string;
    data: unknown;
  };
}

export interface StartPenMovementAction {
  type: ActionTypes.START_PEN_MOVEMENT;
  payload: PenState;
}

export interface FinishPenMovementAction {
  type: ActionTypes.FINISH_PEN_MOVEMENT;
  payload: PenState;
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
