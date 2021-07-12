const {
  translateSVGPoints,
  mapMatrixToString,
  convertPointsRelToAbs,
  splitPathString,
} = require("./index");

import BD from "decimal.js";

describe("plotter model", () => {
  describe("getLenghtByPoints", () => {});

  describe("translateSVGPoints", () => {
    test("comma as delimter", () => {
      const res = mapMatrixToString(translateSVGPoints("20,20 40,25 60,40.5"));
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test("spaces as delimter", () => {
      const res = mapMatrixToString(translateSVGPoints("20 20 40 25 60 40.5"));
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test("nl as delimiter", () => {
      const res = mapMatrixToString(
        translateSVGPoints("20,20\n40,25\n60\n40.5")
      );
      expect(res).toEqual([
        ["20", "20"],
        ["40", "25"],
        ["60", "40.5"],
      ]);
    });
    test("mixed as delimiter", () => {
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
    test("translates relative points to absolute ", () => {
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
    test("translates relative points to absolute", () => {
      const res = splitPathString("M35,0.75 L34.09375,2.5625");
      expect(res).toEqual(["M35,0.75", "L34.09375,2.5625"]);
    });

    test("whitespaces after each command and argument", () => {
      const res = splitPathString(
        "M 382.49999 494.99999 L 384.55374 496.87223"
      );
      expect(res).toEqual(["M 382.49999 494.99999", "L 384.55374 496.87223"]);
    });

    test("whitespaces after and before each command, comma between arguments", () => {
      const res = splitPathString("M 0,0 Q 200.12,20 200,200");
      expect(res).toEqual(["M 0,0", "Q 200.12,20 200,200"]);
    });

    test("no whitespaces except after the first command", () => {
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

  describe("splitArgs", () => {});

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
