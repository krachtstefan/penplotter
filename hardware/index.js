const { Board, Stepper, Servo } = require("johnny-five");

const BigDecimal = require("decimal.js");
const instructionSequence = require("./instrucions.js");
const board = new Board();

const hardware = {
  pen: {
    pin: 11,
    duration: 1000,
  },
  stepper: {
    stepsPerRotation: 1600,
    pauseBetweenInstructions: 500,
  },
};

board.on("ready", () => {
  const stepperLeft = new Stepper({
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 2,
      dir: 5,
    },
  });
  const stepperRight = new Stepper({
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 3,
      dir: 6,
    },
  });

  const pen = new Servo({
    pin: hardware.pen.pin,
    range: [0, 180],
    startAt: 0,
  });

  const liftPen = () =>
    new Promise((resolve) => {
      pen.to(90, hardware.pen.duration);
      setTimeout(resolve, hardware.pen.duration + 100);
    });

  const attachPen = () =>
    new Promise((resolve) => {
      pen.to(0, hardware.pen.duration);
      setTimeout(resolve, hardware.pen.duration + 100);
    });

  const rotate = ({ name, motor, rotation, throttle }) =>
    new Promise((resolve, reject) => {
      console.time(`${name} ${rotation}° (${throttle})`);
      const steps = Math.round(
        new BigDecimal(rotation)
          .abs()
          .div(new BigDecimal(360))
          .times(hardware.stepper.stepsPerRotation)
          .toNumber()
      );
      motor.step(
        {
          rpm: 90 * throttle,
          steps,
          direction: rotation > 0 ? 1 : 0,
        },
        () => {
          console.timeEnd(`${name} ${rotation}° (${throttle})`);
          setTimeout(resolve, hardware.stepper.pauseBetweenInstructions);
        }
      );
    });

  instructionSequence.reduce(
    (promise, coordinate) =>
      promise.then((_) => {
        const throttleRight = Math.abs(coordinate[1]) < Math.abs(coordinate[0]);
        const throttleLeft = Math.abs(coordinate[0]) < Math.abs(coordinate[1]);

        return Promise.all([
          rotate({
            name: "stepper left",
            motor: stepperLeft,
            rotation: coordinate[0],
            throttle: throttleLeft
              ? new BigDecimal(Math.abs(coordinate[0]))
                  .div(Math.abs(coordinate[1]))
                  .toNumber()
              : 1,
          }),
          rotate({
            name: "stepper right",
            motor: stepperRight,
            rotation: coordinate[1],
            throttle: throttleRight
              ? new BigDecimal(Math.abs(coordinate[1]))
                  .div(Math.abs(coordinate[0]))
                  .toNumber()
              : 1,
          }),
        ]);
      }),
    Promise.resolve()
  );
});
