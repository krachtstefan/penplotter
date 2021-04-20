const { penPositions } = require("./redux/penplotter");

module.exports = {
  hardware: {
    pen: {
      pin: 11,
      positions: {
        [penPositions.UP]: {
          position: 90,
          duration: 1000,
        },
        [penPositions.DOWN]: {
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
