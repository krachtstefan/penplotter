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
  addDrawingJob,
  startDrawing,
  updateProgress,
  stopDrawing,
} = require("./redux/penplotter");

const board = new Board();

board.on("ready", () => {
  const stepperLeft = new Stepper(devices.stepperLeft);
  const stepperRight = new Stepper(devices.stepperRight);
  const pen = new Servo(devices.pen);

  const movePen = (direction) => {
    let targetValue = 0;
    let movementDuration = 0;

    switch (direction) {
      case penPositions.UP: {
        targetValue = hardware.pen.positions[penPositions.UP].position;
        movementDuration = hardware.pen.positions[penPositions.UP].duration;
        break;
      }
      case penPositions.DOWN: {
        targetValue = hardware.pen.positions[penPositions.DOWN].position;
        movementDuration = hardware.pen.positions[penPositions.DOWN].duration;
        break;
      }
      default: {
        console.error(`unsupported pen direction ${direction}`);
        return Promise.resolve();
      }
    }

    return new Promise((resolve) => {
      store.dispatch(startPenMovement(direction));
      if (pen.value !== targetValue) {
        pen.to(targetValue, movementDuration);
        setTimeout(resolve, movementDuration + 100);
      } else {
        resolve();
      }
    }).then(() => {
      store.dispatch(finishPenMovement(direction));
      return Promise.resolve();
    });
  };

  const readPenPosition = () => {
    const position = Object.keys(hardware.pen.positions).find(
      (p) => hardware.pen.positions[p].position === pen.value
    );
    if (position) {
      store.dispatch(finishPenMovement(position));
    } else {
      console.error(`no matching pen position with value ${pen.value}`);
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

  const draw = () => {
    const startDate = moment();
    const { instructions } = store.getState().penplotter.drawing;

    movePen(penPositions.UP)
      .then(() =>
        instructions.reduce(
          (promise, instruction, index, srcArray) =>
            promise.then((_) => {
              const progress = new BigDecimal(index + 1)
                .div(srcArray.length)
                .times(100);
              const secondsGone = new BigDecimal(
                moment().diff(startDate, "seconds")
              );
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

              store.dispatch(
                updateProgress({
                  startedAtMs: startDate.valueOf(),
                  etaMs: eta.valueOf(),
                  progress: progress.toNumber(),
                })
              );

              const throttleRight =
                Math.abs(instruction.right) < Math.abs(instruction.left);
              const throttleLeft =
                Math.abs(instruction.left) < Math.abs(instruction.right);
              return (() =>
                instruction.pen === "up"
                  ? movePen(penPositions.UP)
                  : movePen(penPositions.DOWN))().then(() =>
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
        )
      )
      .then(() => {
        store.dispatch(stopDrawing());
      });
  };

  websockets.server.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      const { type, payload } = JSON.parse(message);
      console.log(message);
      if (type) {
        switch (type) {
          case "MOVE_PEN": {
            if ([penPositions.DOWN, penPositions.UP].includes(payload)) {
              movePen(payload);
              return;
            }
            console.error("unsupported pen movement", payload);
            return;
          }
          case "SEND_DRAW_JOB": {
            store.dispatch(addDrawingJob(payload));
            return;
          }
          case "START_DRAWING": {
            store.dispatch(startDrawing());
            draw();
            return;
          }
          default: {
            console.error("unsupported action", type);
            return;
          }
        }
      }
    });
    console.log("new client connected");
    websockets.populate({
      type: "UPDATE_PLOTTER_STATE",
      payload: {
        path: "penplotter",
        data: store.getState().penplotter,
      },
    });
  });
  readPenPosition();
});
