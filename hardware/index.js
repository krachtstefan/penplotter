const { Board, Stepper, Servo } = require("johnny-five");

const BigDecimal = require("decimal.js");

const board = new Board();

const hardware = {
  pen: {
    pin: 11,
  },
  stepper: {
    stepsPerRotation: 1600,
    pauseBetweenInstructions: 500,
  },
};

const instructionSequence =
  /*generated at 24.3.2021, 16:25:21*/
  [
    [0, 0],
    [23.552978081281847, -40.55797491477938],
    [263.2639212775462, -436.9098819301495],
    [-106.77653426098713, -288.6852553968734],
    [-7.565653984086516, -25.406428272998088],
    [35.443161939448935, -9.949850039844765],
    [407.5523264228077, -121.82907314978928],
    [374.5232349986475, -413.60336052381285],
    [33.58776643302519, -36.66572211410851],
    [-3.3435478811751413, 30.429510062324884],
    [-25.30263622415054, 348.24301947767276],
    [348.24301947767276, -25.302636224150557],
    [30.429510062324884, -3.343547881175143],
    [-36.665722114108476, 33.58776643302522],
    [-413.6033605238129, 374.5232349986475],
    [-121.82907314978922, 407.55232642280777],
    [-9.949850039844948, 35.4431619394488],
    [-25.40642827299795, -7.565653984086415],
    [-288.68525539687346, -106.77653426098713],
    [-436.9098819301495, 263.2639212775463],
    [-40.55797491477938, 23.552978081281847],
    [0, 0],
    [79.61559109530538, -79.61559109530538],
    [407.0382907555361, -244.84681246315384],
    [10.636115332717559, -6.364736356380983],
    [6.31684474943197, 2.5471279736558556],
    [268.35271375003396, 100.75411770979584],
    [115.78501607330669, -382.4694485462389],
    [3.514284072329557, -9.604305257053923],
    [9.472099344428125, -8.720557794228144],
    [387.2919445232784, -348.56649247953646],
    [-326.4664173496295, 22.6010868376116],
    [-7.623808693897722, 0.3529378179938322],
    [0.3529378179938317, -7.623808693897722],
    [22.601086837611586, -326.4664173496295],
    [-348.5664924795365, 387.29194452327835],
    [-8.72055779422811, 9.472099344428166],
    [-9.604305257053959, 3.5142840723295157],
    [-382.4694485462388, 115.78501607330679],
    [100.75411770979584, 268.3527137500339],
    [2.5471279736558023, 6.316844749431911],
    [-6.364736356380906, 10.636115332717642],
    [-244.84681246315387, 407.0382907555361],
    [0, 0],
  ];

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

  liftPen();

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
