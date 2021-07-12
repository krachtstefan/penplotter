const {
  translateSVGPoints,
  mapMatrixToString,
  convertPointsRelToAbs,
  splitPathString,
  processPathCommand,
  getLenghtByPoints,
} = require("./index");

import BD from "decimal.js";

describe("plotter model", () => {
  describe("getLenghtByPoints", () => {
    test.concurrent("horizontal line", () => {
      const res = getLenghtByPoints(
        [new BD(12), new BD(0)],
        [new BD(24), new BD(0)]
      );
      expect(res.toString()).toEqual("12");
    });
    test.concurrent("vertical line", () => {
      const res = getLenghtByPoints(
        [new BD(0), new BD(2)],
        [new BD(0), new BD(12)]
      );

      expect(res.toString()).toEqual("10");
    });
    test.concurrent("diagonal line", () => {
      const res = getLenghtByPoints(
        [new BD(1), new BD(1)],
        [new BD(2), new BD(2)]
      );
      expect(res.toString()).toEqual("1.4142135623730950488");
    });
    test.concurrent("negative valued points", () => {
      const res = getLenghtByPoints(
        [new BD(0), new BD(2)],
        [new BD(0), new BD(-12)]
      );

      expect(res.toString()).toEqual("14");
    });
    test.concurrent("length of 0", () => {
      const res = getLenghtByPoints(
        [new BD(0), new BD(0)],
        [new BD(0), new BD(0)]
      );
      expect(res.toString()).toEqual("0");
    });
  });

  describe("translateSVGPoints", () => {
    test.concurrent("comma as delimter", () => {
      const res = mapMatrixToString(translateSVGPoints("20,20 40,25 60,40.5"));
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test.concurrent("spaces as delimter", () => {
      const res = mapMatrixToString(translateSVGPoints("20 20 40 25 60 40.5"));
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test.concurrent("nl as delimiter", () => {
      const res = mapMatrixToString(
        translateSVGPoints("20,20\n40,25\n60\n40.5")
      );
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test.concurrent("mixed as delimiter", () => {
      const res = mapMatrixToString(
        translateSVGPoints("20 20 40,25\n60\n40.5")
      );
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
  });

  describe("convertPointsRelToAbs", () => {
    test.concurrent("translates relative points to absolute ", () => {
      const res = mapMatrixToString(
        convertPointsRelToAbs(
          [new BD(1), new BD(2)],
          [
            [new BD(2), new BD(3)],
            [new BD(4), new BD(5)],
            [new BD(4), new BD(5)],
          ]
        )
      );
      expect(res).toEqual([
        ["3", "5"],
        ["7", "10"],
        ["11", "15"],
      ]);
    });
  });

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

  describe("splitArgs", () => {
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

  describe("getPointFromLineSegment", () => {});

  describe("quadraticBezier", () => {});

  describe("cubicBezier", () => {});

  describe("getPosition", () => {});

  describe("getDimensions", () => {});

  describe("scale", () => {});

  describe("mirrorX", () => {});

  describe("mirrorY", () => {});

  describe("move", () => {});
});

export {};
