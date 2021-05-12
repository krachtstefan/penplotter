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
import { WakeLock } from "wake-lock";
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
        const upPosition = hardware.pen.positions.find(
          (x) => x.name === PenPosition.UP
        );
        targetValue = upPosition?.position || 0;
        movementDuration = upPosition?.duration || 0;
        break;
      }
      case PenPosition.DOWN: {
        const downPosition = hardware.pen.positions.find(
          (x) => x.name === PenPosition.DOWN
        );
        targetValue = downPosition?.position || 0;
        movementDuration = downPosition?.duration || 0;
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
    const possiblePositions = hardware.pen.positions.find(
      (p) => p.position === pen.value
    );
    if (possiblePositions) {
      store.dispatch(finishPenMovement(possiblePositions.name));
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
      console.log(`${name} ${rotation}° (${throttle})`);
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

    let wakeLock: any;
    try {
      wakeLock = new WakeLock("polotter plotting");
    } catch (e) {
      console.warn(
        "Couldn't acquire wake lock. Ensure your machine does not sleep during plotting"
      );
    }

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

            const { pen, left, leftThrottle, right, rightThrottle } =
              instruction;
            return (() =>
              pen === PenPosition.UP
                ? movePen(PenPosition.UP)
                : movePen(PenPosition.DOWN))().then(() =>
              Promise.all([
                rotate({
                  name: "stepper left",
                  motor: stepperLeft,
                  rotation: left,
                  throttle: leftThrottle,
                }),
                rotate({
                  name: "stepper right",
                  motor: stepperRight,
                  rotation: right,
                  throttle: rightThrottle,
                }),
              ]).then(() => Promise.resolve())
            );
          });
        }, Promise.resolve())
      )
      .then(() => {
        console.log("🥳 done drawing");
        if (wakeLock) {
          wakeLock.release();
        }
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
