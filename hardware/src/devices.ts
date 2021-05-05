import { Stepper } from "johnny-five";
import config from "./config";

const devices = {
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
    pin: config.hardware.pen.pin,
    range: [0, 180],
    startAt: 0,
  },
};
export default devices;
