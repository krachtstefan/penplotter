const { hardware } = require("./config");
const { Stepper } = require("johnny-five");

module.exports = {
  stepperLeft: {
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 2,
      dir: 5,
    },
  },
  stepperRight: {
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 3,
      dir: 6,
    },
  },
  pen: {
    pin: hardware.pen.pin,
    range: [0, 180],
    startAt: 0,
  },
};
