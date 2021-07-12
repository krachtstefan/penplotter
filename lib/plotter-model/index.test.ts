const {
  translateSVGPoints,
  mapMatrixToString,
  convertPointsRelToAbs,
} = require("./index");

import BD from "decimal.js";

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
