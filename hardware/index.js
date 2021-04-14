const { Board, Stepper, Servo } = require("johnny-five");
const BigDecimal = require("decimal.js");
const moment = require("moment");
const WebSocket = require("ws");
const config = require("./config");
const { hardware, websocket } = config;

const board = new Board();
const wss = new WebSocket.Server({ port: websocket.port });

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
      pen.to(90, hardware.pen.durationUp);
      setTimeout(resolve, hardware.pen.durationUp + 100);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "SET_PEN_IS_UP",
              payload: true,
            })
          );
        }
      });
    });

  const attachPen = () =>
    new Promise((resolve) => {
      pen.to(0, hardware.pen.durationDown);
      setTimeout(resolve, hardware.pen.durationDown + 100);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "SET_PEN_IS_UP",
              payload: false,
            })
          );
        }
      });
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

  const startDate = moment();

  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      console.log("received: %s", JSON.parse(message));
      ws.send(JSON.stringify({ something: "cool" }));
    });

    console.log("client connected");
    liftPen();
  });

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

        return (() =>
          instruction.pen === "up" ? liftPen() : attachPen())().then(() =>
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
