import {
  closeCmd,
  moveToCmd,
  processPathCommand,
  splitPathString,
  translatePathString,
} from "../path";

import BD from "decimal.js";
import { Point2D } from "../../types";
import { mapMatrixToString } from "../../math";

describe("svg model (path)", () => {
  describe("splitPathString", () => {
    test.concurrent("translates relative points to absolute", () => {
      const res = splitPathString("M35,0.75 L34.09375,2.5625");
      expect(res).toEqual(["M35,0.75", "L34.09375,2.5625"]);
    });

    test.concurrent("whitespaces after each command and argument", () => {
      const res = splitPathString(
        "M 382.49999 494.99999 L 384.55374 496.87223"
      );
      expect(res).toEqual(["M 382.49999 494.99999", "L 384.55374 496.87223"]);
    });

    test.concurrent(
      "whitespaces after and before each command, comma between arguments",
      () => {
        const res = splitPathString("M 0,0 Q 200.12,20 200,200");
        expect(res).toEqual(["M 0,0", "Q 200.12,20 200,200"]);
      }
    );

    test.concurrent("no whitespaces except after the first command", () => {
      const res = splitPathString(
        "M 0,0L1.1,1.14L2.2,-0.37L3.3,-1.02L4.4,0.71L5.5,0.79L6.6,-0.96L7.7"
      );
      expect(res).toEqual([
        "M 0,0",
        "L1.1,1.14",
        "L2.2,-0.37",
        "L3.3,-1.02",
        "L4.4,0.71",
        "L5.5,0.79",
        "L6.6,-0.96",
        "L7.7",
      ]);
    });
  });

  describe("processPathCommand", () => {
    test.concurrent("splits command from arguments", () => {
      const res = processPathCommand("M35,0.75");
      expect(res).toEqual(["M", ["35", "0.75"]]);
    });
    test.concurrent("trims whitespace", () => {
      const res = processPathCommand("M35,0.75 ");
      expect(res).toEqual(["M", ["35", "0.75"]]);
    });

    test.concurrent("supports commandss without arguments", () => {
      const res = processPathCommand("Z");
      expect(res).toEqual(["Z", []]);
    });

    test.concurrent("comma", () => {
      const res = processPathCommand("l10,0.6");
      expect(res).toEqual(["l", ["10", "0.6"]]);
    });
    test.concurrent("whitespace", () => {
      const res = processPathCommand("l10 0.6");
      expect(res).toEqual(["l", ["10", "0.6"]]);
    });
    test.concurrent("negative value with comma", () => {
      const res = processPathCommand("l10,-0.6");
      expect(res).toEqual(["l", ["10", "-0.6"]]);
    });
    test.concurrent("negative value without comma", () => {
      const res = processPathCommand("l10-0.6");
      expect(res).toEqual(["l", ["10", "-0.6"]]);
    });
  });

  describe("path command", () => {
    const previousLines: Point2D[][] = [
      [
        [new BD("12"), new BD("34")],
        [new BD("56"), new BD("78")],
      ],
    ];
    const currentLine1Pnt: Point2D[] = [[new BD("5"), new BD("5")]];
    const currentLine2Pnts: Point2D[] = [
      [new BD("5"), new BD("5")],
      [new BD("10"), new BD("10")],
    ];

    describe("moveToCmd", () => {
      test.concurrent("absolute ", () => {
        const res = moveToCmd.process({
          command: "M",
          args: ["50", "60"],
          previousLines,
          currentLine: currentLine1Pnt,
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["12", "34"],
            ["56", "78"],
          ],
          [["50", "60"]],
        ]);
      });
      test.concurrent("relative ", () => {
        const res = moveToCmd.process({
          command: "m",
          args: ["50", "60"],
          previousLines,
          currentLine: currentLine1Pnt,
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["12", "34"],
            ["56", "78"],
          ],
          [["55", "65"]],
        ]);
      });
    });

    describe("closeCmd", () => {
      test.concurrent("uppercase", () => {
        const res = closeCmd.process({
          command: "Z",
          previousLines,
          currentLine: currentLine2Pnts,
        });
        console.log("absolute", res);
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["5", "5"],
            ["10", "10"],
            ["5", "5"],
          ],
        ]);
      });
      test.concurrent("lowercase has identical behaviour", () => {
        const res = closeCmd.process({
          command: "z",
          previousLines,
          currentLine: currentLine2Pnts,
        });
        console.log("absolute", res);
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["5", "5"],
            ["10", "10"],
            ["5", "5"],
          ],
        ]);
      });
      test.concurrent("skippes when nothing to close", () => {
        const res = closeCmd.process({
          command: "Z",
          previousLines,
          currentLine: currentLine1Pnt,
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["12", "34"],
            ["56", "78"],
          ],
          [["5", "5"]],
        ]);
      });
    });
    describe("lineToCmd", () => {
      it.todo("lineToCmd");
    });
    describe("lineToHorVerCmd", () => {
      it.todo("lineToHorVerCmd");
    });
    describe("quadraticBezierCmd", () => {
      it.todo("quadraticBezierCmd");
    });
    describe("cubicBezierCmd", () => {
      it.todo("cubicBezierCmd");
    });
  });

  describe("translatePathString", () => {
    test.concurrent(
      "multiple move to and line commands with close command",
      () => {
        const res = translatePathString(
          "M 100 100 L 300 100 l 200 300 M 10 10 L 20 30 L 100 100 Z"
        );

        expect(res.map((matrix) => mapMatrixToString(matrix))).toEqual([
          [
            ["100", "100"],
            ["300", "100"],
            ["500", "400"],
          ],
          [
            ["10", "10"],
            ["20", "30"],
            ["100", "100"],
            ["10", "10"],
          ],
        ]);
      }
    );
  });
});

/**
 * test every command, make sure older coordinates are adopted
 * expand isValid with more arguments to make much deeper tests
 * make relative commands support input from older elements
 */
