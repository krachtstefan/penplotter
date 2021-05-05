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
import { PenState } from "./redux/penplotter/types";
import devices from "./devices";
import hardware from "./config";
import moment from "moment";
import store from "./redux";

const board = new Board();
board.on("ready", () => {});
