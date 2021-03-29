const { Board, Stepper, Servo } = require("johnny-five");

const BigDecimal = require("decimal.js");

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

const instructionSequence =
  /*generated at 26.3.2021, 18:54:17*/
  [
    [
      [24.12120833822624, -41.596675402622765],
      [269.9001972646717, -448.1000901481933],
      [-108.99476994512719, -296.65667445674995],
      [-7.680237651209931, -26.122429423300968],
      [36.319948275020835, -10.12360424882933],
      [417.7040193877735, -124.34138989409591],
      [384.50569929622594, -424.13533283407105],
      [34.4876584932197, -37.60217601560904],
      [-3.5059559473117416, 31.215766949897713],
      [-26.518324938761435, 357.12316290084703],
      [357.12316290084703, -26.518324938761427],
      [31.215766949897713, -3.5059559473117408],
      [-37.60217601560902, 34.48765849321972],
      [-424.13533283407105, 384.50569929622594],
      [-124.34138989409595, 417.7040193877734],
      [-10.123604248829285, 36.31994827502087],
      [-26.12242942330106, -7.680237651209998],
      [-296.65667445674995, -108.9947699451272],
      [-448.10009014819326, 269.90019726467176],
      [-41.596675402622765, 24.12120833822624],
    ],
    [
      [417.46744527931213, -251.01471258473717],
      [10.908896581255245, -6.5303735885232035],
      [6.485998086252956, 2.609286538870751],
      [275.71885398070657, 102.87620538895847],
      [118.22452898198608, -392.02836391681524],
      [3.597934424458984, -9.84636533909485],
      [9.712698619995209, -8.950441567663928],
      [397.16654144021675, -357.8313776112397],
      [-334.8041166304702, 23.68592571085932],
      [-7.816012790327747, 0.3674489959995867],
      [0.3674489959995868, -7.816012790327747],
      [23.68592571085933, -334.8041166304702],
      [-357.8313776112397, 397.16654144021675],
      [-8.950441567663963, 9.712698619995168],
      [-9.84636533909478, 3.5979344244590665],
      [-392.02836391681524, 118.22452898198604],
      [102.8762053889585, 275.71885398070657],
      [2.609286538870713, 6.4859980862529145],
      [-6.5303735885232035, 10.908896581255245],
      [-251.01471258473717, 417.46744527931213],
    ],
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
    (strokePromise, stroke) => {
      return strokePromise.then(() => {
        return stroke.reduce((movementPromise, coordinate, index, src) => {
          const stokeBeginns = index === 0;
          const strokeEnds = index === 0;
          return movementPromise.then(() => {
            const throttleRight =
              Math.abs(coordinate[1]) < Math.abs(coordinate[0]);
            const throttleLeft =
              Math.abs(coordinate[0]) < Math.abs(coordinate[1]);
            return (() =>
              stokeBeginns ? liftPen() : Promise.resolve())().then(() =>
              Promise.all([
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
              ]).then(() => (strokeEnds ? attachPen() : Promise.resolve()))
            );
          });
        }, Promise.resolve());
      });
    },

    Promise.resolve()
  );
});
