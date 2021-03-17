const { Board, Stepper, Servo } = require("johnny-five");
const board = new Board();

const hardware = {
  pen: {
    pin: 11,
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
  const liftPen = () => {
    pen.to(0);
  };
  const attachPen = () => {
    pen.to(180);
  };

  liftPen();

  stepperRight
    .rpm(180)
    .cw()
    .step(1600, () => {
      attachPen();
    });

  stepperLeft
    .rpm(180)
    .ccw()
    .step(1600, () => {
      attachPen();
    });
});
