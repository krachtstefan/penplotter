export interface PenplotterState {
  connected: boolean;
  pen: {
    position: PenPosition;
    isBusy: boolean;
  };
  drawing: {
    isBusy: boolean;
    instructions: PenplotterInstruction[];
    progress: {
      startedAtMs?: number;
      etaMs?: number;
      progress: number;
    };
  };
}

export interface PenplotterInstruction {
  left: number;
  right: number;
  leftThrottle: number;
  rightThrottle: number;
  pen: PenPosition.UP | PenPosition.DOWN;
}

export enum PenPosition {
  UP = "UP",
  DOWN = "DOWN",
  UNKNOWN = "UNKNOWN",
}

export enum ActionTypes {
  NO_CONNECTION = "NO_CONNECTION",
  UPDATE_PLOTTER_STATE = "UPDATE_PLOTTER_STATE",
}

export interface NoConnectionAction {
  type: typeof ActionTypes.NO_CONNECTION;
}

export interface UpdatePlotterStateAction {
  type: typeof ActionTypes.UPDATE_PLOTTER_STATE;
  payload:
    | UpdatePpPayload
    | UpdatePpPenPayload
    | UpdatePpDrawingBusyPayload
    | UpdatePpDrawingInstructionsPayload
    | UpdatePpDrawingProgressPayload;
}

export interface UpdatePpPayload {
  path: "penplotter";
  data: PenplotterState;
}

export interface UpdatePpPenPayload {
  path: "penplotter.pen";
  data: PenplotterState["pen"];
}

export interface UpdatePpDrawingBusyPayload {
  path: "penplotter.drawing.isBusy";
  data: PenplotterState["drawing"]["isBusy"];
}

export interface UpdatePpDrawingInstructionsPayload {
  path: "penplotter.drawing.instructions";
  data: PenplotterState["drawing"]["instructions"];
}
export interface UpdatePpDrawingProgressPayload {
  path: "penplotter.drawing.progress";
  data: PenplotterState["drawing"]["progress"];
}

export type PenplotterActions = UpdatePlotterStateAction | NoConnectionAction;
