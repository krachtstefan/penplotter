const { Board, Stepper, Servo } = require("johnny-five");
const board = new Board();

const hardware = {
  pen: {
    pin: 11,
  },
};

board.on("ready", () => {
  const stepper = new Stepper({
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 2,
      dir: 5,
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

  // Set stepper to 180 RPM, counter-clockwise with acceleration and deceleration
  stepper.rpm(180).ccw().accel(1600).decel(1600);
  stepper
    .rpm(180)
    .ccw()
    .step(1600, () => {
      attachPen();
    });
});
