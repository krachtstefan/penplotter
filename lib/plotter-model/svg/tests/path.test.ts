const { splitPathString, processPathCommand } = require("../path");

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
  });

  describe("processPathCommand", () => {
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
    /**
     * test every command, make sure older coordinates are adopted
     * expand isValid with more arguments to make much deeper tests
     * make relative commands support input from older elements
     */
    it.todo("moveToCmd");
    it.todo("closeCmd");
    it.todo("lineToCmd");
    it.todo("lineToHorVerCmd");
    it.todo("quadraticBezierCmd");
    it.todo("cubicBezierCmd");
  });
});

export {};
