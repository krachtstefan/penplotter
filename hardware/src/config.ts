import { PenState, PenplotterInstruction } from "./redux/penplotter/types";

const positions: {
  [key in PenplotterInstruction["pen"]]: {
    position: number;
    duration: number;
  };
} = {
  [PenState.UP]: {
    position: 90,
    duration: 1000,
  },
  [PenState.DOWN]: {
    position: 0,
    duration: 2000,
  },
};

const config = {
  hardware: {
    pen: {
      pin: 11,
      positions,
    },
    stepper: {
      stepsPerRotation: 1600,
      pauseBetweenInstructions: 500,
    },
  },
  websocket: {
    port: 8080,
  },
};

export default config;
