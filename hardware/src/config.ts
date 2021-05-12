import { PenPosition } from "./redux/penplotter/types";

const config = {
  hardware: {
    pen: {
      pin: 11,
      positions: [
        {
          name: PenPosition.UP,
          position: 90,
          duration: 1000,
        },
        {
          name: PenPosition.DOWN,
          position: 0,
          duration: 2000,
        },
      ],
    },
    stepper: {
      stepsPerRotation: 1600,
      pauseBetweenInstructions: 0,
    },
  },
  websocket: {
    port: 8080,
  },
};

export default config;
