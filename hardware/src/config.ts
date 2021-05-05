import { PenState } from "./redux/penplotter/types";

const config = {
  hardware: {
    pen: {
      pin: 11,
      positions: {
        [PenState.UP]: {
          position: 90,
          duration: 1000,
        },
        [PenState.DOWN]: {
          position: 0,
          duration: 2000,
        },
      },
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
