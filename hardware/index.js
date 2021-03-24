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
  /*generated at 24.3.2021, 13:46:59*/
  [
    [0, 0],
    [-32.95797134078299, -54.61620392011786],
    [-370.48178647581807, -588.348899964701],
    [114.65834567395551, -379.059556783171],
    [7.2367124789571236, -33.67079812599481],
    [-46.470478277641725, -14.065875474675918],
    [-535.7390390991083, -175.54574527271345],
    [-518.4375162109603, -561.5981981784788],
    [-46.47353545736297, -49.79764758455875],
    [7.130674415407794, 40.03792538702647],
    [60.76287381405727, 455.8932794380885],
    [-455.89327943808854, -60.762873814057244],
    [-40.037925387026434, -7.130674415407823],
    [49.79764758455879, 46.47353545736294],
    [561.5981981784788, 518.4375162109603],
    [175.54574527271345, 535.7390390991083],
    [14.065875474675918, 46.470478277641725],
    [33.67079812599485, -7.236712478957152],
    [379.05955678317093, -114.65834567395548],
    [588.348899964701, 370.48178647581807],
    [54.61620392011786, 32.95797134078299],
    [0, 0],
    [-108.74785972566886, -108.74785972566886],
    [-548.0274297377424, -344.4255564223227],
    [-14.30980260762372, -9.013510713087086],
    [-8.20768965896212, 2.8987513631346924],
    [-351.6475584387855, 108.90418163677144],
    [-167.27516946735096, -503.35514195445546],
    [-5.07971806844215, -12.70244776976887],
    [-12.874276584873908, -12.044040656206983],
    [-525.9464019058324, -482.3807158444645],
    [427.5234862813899, 55.23323439235488],
    [9.939782910931017, 0.98046869075231],
    [-0.98046869075231, -9.939782910931017],
    [-55.23323439235488, -427.5234862813899],
    [482.38071584446453, 525.9464019058324],
    [12.044040656206983, 12.874276584873908],
    [12.70244776976887, 5.07971806844215],
    [503.3551419544554, 167.2751694673511],
    [-108.90418163677134, 351.6475584387853],
    [-2.8987513631346222, 8.207689658962043],
    [9.01351071308705, 14.309802607623759],
    [344.4255564223226, 548.0274297377425],
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

  const rotate = ({ name, motor, rotation }) =>
    new Promise((resolve, reject) => {
      console.time(`${name} ${rotation}°`);
      const steps = Math.round(
        new BigDecimal(rotation)
          .abs()
          .div(new BigDecimal(360))
          .times(hardware.stepper.stepsPerRotation)
          .toNumber()
      );
      motor.step(
        {
          rpm: 90,
          steps,
          direction: rotation > 0 ? 1 : 0,
        },
        () => {
          console.timeEnd(`${name} ${rotation}°`);
          setTimeout(resolve, hardware.stepper.pauseBetweenInstructions);
        }
      );
    });

  liftPen();

  instructionSequence.reduce(
    (promise, coordinate) =>
      promise.then((_) =>
        Promise.all([
          rotate({
            name: "stepper left",
            motor: stepperLeft,
            rotation: coordinate[0],
          }),
          rotate({
            name: "stepper right",
            motor: stepperRight,
            rotation: coordinate[1],
          }),
        ])
      ),
    Promise.resolve()
  );
});
