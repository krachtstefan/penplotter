const { translateSVGPoints, mapMatrixToString } = require("./index");

describe("plotter model", () => {
  describe("getLenghtByPoints", () => {});

  describe("translateSVGPoints", () => {
    test("spaces as delimter", () => {
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
  });

  describe("convertPointsRelToAbs", () => {});

  describe("splitPathString", () => {});

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
