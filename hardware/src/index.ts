import { Board, Servo, Stepper } from "johnny-five";
import {
  addDrawingJob,
  finishPenMovement,
  startDrawing,
  startPenMovement,
  stopDrawing,
  updateProgress,
} from "./redux/penplotter";
import { populate, wss } from "./websockets";

import BigDecimal from "decimal.js";
import { PenPosition } from "./redux/penplotter/types";
import config from "./config";
import devices from "./devices";
import moment from "moment";
import store from "./redux";

const board = new Board();
const { hardware } = config;

board.on("ready", () => {
  const stepperLeft = new Stepper(devices.stepperLeft);
  const stepperRight = new Stepper(devices.stepperRight);
  const pen = new Servo(devices.pen);

  const movePen = (direction: PenPosition) => {
    let targetValue = 0;
    let movementDuration = 0;

    switch (direction) {
      case PenPosition.UP: {
        targetValue = hardware.pen.positions[PenPosition.UP].position;
        movementDuration = hardware.pen.positions[PenPosition.UP].duration;
        break;
      }
      case PenPosition.DOWN: {
        targetValue = hardware.pen.positions[PenPosition.DOWN].position;
        movementDuration = hardware.pen.positions[PenPosition.DOWN].duration;
        break;
      }
      default: {
        console.error(`unsupported pen direction ${direction}`);
        return Promise.resolve();
      }
    }

    return new Promise<void>((resolve) => {
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
    const position = Object.keys(hardware.pen.positions).find((p) =>
      p === PenPosition.UP || p === PenPosition.DOWN
        ? hardware.pen.positions[p].position === pen.value
        : false
    );
    if (position === PenPosition.UP || position === PenPosition.DOWN) {
      store.dispatch(finishPenMovement(position));
    } else {
      console.error(`no matching pen position with value ${pen.value}`);
    }
  };

  const rotate = ({
    name,
    motor,
    rotation,
    throttle,
  }: {
    name: string;
    motor: Stepper;
    rotation: number;
    throttle: number;
  }) =>
    new Promise<void>((resolve) => {
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

    movePen(PenPosition.UP)
      .then(() =>
        instructions.reduce((promise, instruction, index, srcArray) => {
          return promise.then((_) => {
            const progress = new BigDecimal(index + 1)
              .div(srcArray.length)
              .times(100);
            const secondsGone = new BigDecimal(
              moment().diff(startDate, "seconds")
            );
            const durationTotalSec = new BigDecimal(100)
              .div(progress)
              .times(secondsGone);
            const eta = startDate
              .clone()
              .add(durationTotalSec.toNumber(), "seconds");
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
              instruction.pen === PenPosition.UP
                ? movePen(PenPosition.UP)
                : movePen(PenPosition.DOWN))().then(() =>
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
              ]).then(() => Promise.resolve())
            );
          });
        }, Promise.resolve())
      )
      .then(() => {
        store.dispatch(stopDrawing());
      });
  };

  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      const { type, payload } = JSON.parse(message.toString());
      console.log(message);
      if (type) {
        switch (type) {
          case "MOVE_PEN": {
            if ([PenPosition.DOWN, PenPosition.UP].includes(payload)) {
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
    populate({
      type: "UPDATE_PLOTTER_STATE",
      payload: {
        path: "penplotter",
        data: store.getState().penplotter,
      },
    });
  });
  readPenPosition();
});
