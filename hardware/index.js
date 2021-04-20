const { Board, Stepper, Servo } = require("johnny-five");
const BigDecimal = require("decimal.js");
const moment = require("moment");
const { hardware } = require("./config");
const devices = require("./devices");
const websockets = require("./websockets");
const store = require("./redux");
const {
  penPositions,
  finishPenMovement,
  startPenMovement,
} = require("./redux/penplotter");

const board = new Board();

board.on("ready", () => {
  const stepperLeft = new Stepper(devices.stepperLeft);
  const stepperRight = new Stepper(devices.stepperRight);
  const pen = new Servo(devices.pen);

  const penUp = () =>
    new Promise((resolve) => {
      store.dispatch(startPenMovement(penPositions.UP));
      pen.to(90, hardware.pen.durationUp);
      setTimeout(resolve, hardware.pen.durationUp + 100);
    }).then(() => {
      store.dispatch(finishPenMovement(penPositions.UP));
      return Promise.resolve();
    });

  const penDown = () =>
    new Promise((resolve) => {
      store.dispatch(startPenMovement(penPositions.DOWN));
      pen.to(0, hardware.pen.durationDown);
      setTimeout(resolve, hardware.pen.durationDown + 100);
    }).then(() => {
      store.dispatch(finishPenMovement(penPositions.DOWN));
      return Promise.resolve();
    });

  const readPenPosition = () => {
    if (pen.value === 0) {
      store.dispatch(finishPenMovement(penPositions.DOWN));
    }
    if (pen.value === 90) {
      store.dispatch(finishPenMovement(penPositions.DOWN));
    }
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

  const startDate = moment();

  websockets.server.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      const { type, payload } = JSON.parse(message);
      console.log(message);
      if (type && payload) {
        console.log(type, payload);
        switch (type) {
          case "MOVE_PEN": {
            if (payload === "DOWN") {
              penDown();
              return;
            }
            if (payload === "UP") {
              penUp();
              return;
            }
            console.error("unsupported pen movement", payload);
            return;
          }
          default: {
            console.error("unsupported action", type);
          }
        }
      }
    });
    console.log("client connected");
    websockets.populate({
      type: "UPDATE_PLOTTER_STATE",
      payload: {
        path: "penplotter",
        data: store.getState().penplotter,
      },
    });
  });

  readPenPosition();

  [].reduce(
    (promise, instruction, index, srcArray) =>
      promise.then((_) => {
        const progress = new BigDecimal(index + 1)
          .div(srcArray.length)
          .times(100);
        const secondsGone = new BigDecimal(moment().diff(startDate, "seconds"));
        const durationTotalSec = new BigDecimal(100)
          .div(progress)
          .times(secondsGone);
        const eta = startDate.clone().add(durationTotalSec, "seconds");
        console.log({
          startedAt: startDate.format("LT"),
          eta: eta.format("LT"),
          progress: progress.toFixed(2),
          formNow: eta.fromNow(),
        });

        const throttleRight =
          Math.abs(instruction.right) < Math.abs(instruction.left);
        const throttleLeft =
          Math.abs(instruction.left) < Math.abs(instruction.right);

        return (() => (instruction.pen === "up" ? penUp() : penDown()))().then(
          () =>
            Promise.all([
              rotate({
                name: "stepper left",
                motor: stepperLeft,
                rotation: instruction.left,
                throttle: throttleLeft
                  ? new BigDecimal(Math.abs(instruction.left))
                      .div(Math.abs(instruction.right))
                      .toNumber()
                  : 1,
              }),
              rotate({
                name: "stepper right",
                motor: stepperRight,
                rotation: instruction.right,
                throttle: throttleRight
                  ? new BigDecimal(Math.abs(instruction.right))
                      .div(Math.abs(instruction.left))
                      .toNumber()
                  : 1,
              }),
            ])
        );
      }),
    Promise.resolve()
  );
});
