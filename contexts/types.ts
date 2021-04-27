export interface PenplotterState {
  connected: boolean;
  pen: {
    position: PenState;
    isBusy: boolean;
  };
  drawing: {
    isBusy: boolean;
    instructions: PenplotterInstruction[];
    progress: {
      startedAtMs?: number;
      etaMS?: number;
      progress: number;
    };
  };
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
  NO_CONNECTION = "UPDATE_PLOTTER_STATE",
  UPDATE_PLOTTER_STATE = "UPDATE_PLOTTER_STATE",
}

export interface NoConnectionAction {
  type: typeof ActionTypes.NO_CONNECTION;
}

// 🚨 check naming: PenplotterActionTypes and ActionTypes
export type PenplotterActionTypes = NoConnectionAction;
