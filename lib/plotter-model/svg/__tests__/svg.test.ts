import { mapMatrixToString } from "../../math";
import { translateSVGPoints } from "../index";

describe("svg model", () => {
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
});
