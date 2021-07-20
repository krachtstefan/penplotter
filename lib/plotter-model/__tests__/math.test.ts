import {
  convertPointsRelToAbs,
  ellipse,
  getDimensions,
  getLenghtByPoints,
  getPointFromLineSegment,
  getPosition,
  mapMatrixToString,
  mirrorX,
  mirrorY,
  move,
  rotate,
  scale,
} from "../math";

import BD from "decimal.js";
import { Point2D } from "../types";

describe("math model", () => {
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

  describe("getPointFromLineSegment", () => {
    const start: Point2D = [new BD(-10), new BD(1)];
    const finish: Point2D = [new BD(9), new BD(0)];

    test.concurrent("returns start at fraction 0", () => {
      const res = getPointFromLineSegment(start, finish, 0);
      expect(res).toEqual(start);
    });
    test.concurrent("returns finish at fraction 1", () => {
      const res = getPointFromLineSegment(start, finish, 1);
      expect(res).toEqual(finish);
    });
    test.concurrent("returns midpoint at fraction 0.5", () => {
      const res = getPointFromLineSegment(start, finish, 0.5);
      expect(res).toEqual([new BD(-0.5), new BD(0.5)]);
    });
    test.concurrent("can handle identical start and finish", () => {
      const res = getPointFromLineSegment(
        [new BD(0), new BD(0)],
        [new BD(0), new BD(0)],
        1
      );
      expect(res).toEqual([new BD(0), new BD(0)]);
    });
  });

  describe("getPosition", () => {
    test.concurrent("returns upper left position", () => {
      const res = getPosition([
        [new BD(-10), new BD(1)],
        [new BD(-9), new BD(1)],
        [new BD(-5), new BD(1)],
        [new BD(10), new BD(2)],
      ]);
      expect(res).toEqual([new BD(-10), new BD(1)]);
    });
  });

  describe("getDimensions", () => {
    test.concurrent("calculates dimensions", () => {
      const res = getDimensions([
        [new BD(-10), new BD(1)],
        [new BD(-9), new BD(1)],
        [new BD(-5), new BD(1)],
        [new BD(10), new BD(2)],
      ]);
      expect(res).toEqual({ width: new BD(20), height: new BD(1) });
    });
  });

  describe("scale", () => {
    test.concurrent("scale by factor 2", () => {
      const res = scale(
        [
          [new BD(-1), new BD(1)],
          [new BD(1.5), new BD(1)],
        ],
        2
      );
      expect(mapMatrixToString(res)).toEqual([
        ["-2", "2"],
        ["3", "2"],
      ]);
    });
  });

  describe("mirrorX", () => {
    test.concurrent("mirror ", () => {
      const res = mirrorX([
        [new BD(1), new BD(1)],
        [new BD(1), new BD(1)],
      ]);
      expect(mapMatrixToString(res)).toEqual([
        ["-1", "1"],
        ["-1", "1"],
      ]);
    });

    test.concurrent("mirror at x = 2", () => {
      const res = mirrorX(
        [
          [new BD(1), new BD(1)],
          [new BD(10), new BD(1)],
        ],
        new BD(2)
      );
      expect(mapMatrixToString(res)).toEqual([
        ["3", "1"],
        ["-6", "1"],
      ]);
    });
  });

  describe("mirrorY", () => {
    test.concurrent("mirror", () => {
      const res = mirrorY([
        [new BD(1), new BD(1)],
        [new BD(1), new BD(1)],
      ]);
      expect(mapMatrixToString(res)).toEqual([
        ["1", "-1"],
        ["1", "-1"],
      ]);
    });

    test.concurrent("mirror at y = 2", () => {
      const res = mirrorY(
        [
          [new BD(1), new BD(1)],
          [new BD(1), new BD(10)],
        ],
        new BD(2)
      );
      expect(mapMatrixToString(res)).toEqual([
        ["1", "3"],
        ["1", "-6"],
      ]);
    });
  });

  describe("move", () => {
    test.concurrent("move down ", () => {
      const res = move(
        [
          [new BD(1), new BD(2)],
          [new BD(-3), new BD(0)],
        ],
        {
          down: new BD(10),
        }
      );
      expect(mapMatrixToString(res)).toEqual([
        ["1", "12"],
        ["-3", "10"],
      ]);
    });
    test.concurrent("move right", () => {
      const res = move(
        [
          [new BD(1), new BD(2)],
          [new BD(-3), new BD(0)],
        ],
        {
          right: new BD(10),
        }
      );
      expect(mapMatrixToString(res)).toEqual([
        ["11", "2"],
        ["7", "0"],
      ]);
    });
    test.concurrent("move down and right", () => {
      const res = move(
        [
          [new BD(1), new BD(2)],
          [new BD(-3), new BD(0)],
        ],
        {
          down: new BD(1),
          right: new BD(-10),
        }
      );
      expect(mapMatrixToString(res)).toEqual([
        ["-9", "3"],
        ["-13", "1"],
      ]);
    });
  });

  describe("rotate", () => {
    test.concurrent("rotate 180 degrees with default origin", () => {
      const res = rotate([new BD(5), new BD(10)], new BD(180));
      expect(res.map((x) => x.toFixed(2).toString())).toEqual([
        "-5.00",
        "-10.00",
      ]);
    });
    test.concurrent("rotate 90 degrees with custom origin", () => {
      const res = rotate([new BD(-5), new BD(-10)], new BD(90), [
        new BD(2),
        new BD(-3),
      ]);
      expect(res.map((x) => x.toFixed(2).toString())).toEqual([
        "-5.00",
        "4.00",
      ]);
    });
    test.concurrent("rotate 360 degrees with custom origin", () => {
      const res = rotate([new BD(-123.456), new BD(123.456)], new BD(360), [
        new BD(2),
        new BD(-3),
      ]);
      expect(res.map((x) => x.toFixed(2).toString())).toEqual([
        "-123.46",
        "123.46",
      ]);
    });
  });

  describe("ellipse", () => {
    test.concurrent("upper circle, radius of 10, at 0,0, fraction 70", () => {
      const res = ellipse(
        [[new BD(0), new BD(0)], new BD(10), new BD(10)],
        new BD(70)
      );
      expect(res.map((x) => x.toFixed(2).toString())).toEqual(["4.00", "9.17"]);
    });

    test.concurrent("lower circle, radius of 10, at 12,34, fraction 50", () => {
      const res = ellipse(
        [[new BD(12), new BD(34)], new BD(10), new BD(10)],
        new BD(50),
        false
      );
      expect(res.map((x) => x.toFixed(2).toString())).toEqual([
        "12.00",
        "24.00",
      ]);
    });

    test.concurrent(
      "upper ellipse, radius of 20/10, at 0,0, fraction 70",
      () => {
        const res = ellipse(
          [[new BD(0), new BD(0)], new BD(20), new BD(10)],
          new BD(70)
        );
        expect(res.map((x) => x.toFixed(2).toString())).toEqual([
          "8.00",
          "9.17",
        ]);
      }
    );
    test.concurrent(
      "lower ellipse, radius of 10/20, at 12,34, fraction 70",
      () => {
        const res = ellipse(
          [[new BD(12), new BD(34)], new BD(10), new BD(20)],
          new BD(70),
          false
        );
        expect(res.map((x) => x.toFixed(2).toString())).toEqual([
          "16.00",
          "15.67",
        ]);
      }
    );
    test.concurrent(
      "lower ellipse, radius of 10/20, at -12,-34, fraction 70",
      () => {
        const res = ellipse(
          [[new BD(-12), new BD(-34)], new BD(10), new BD(20)],
          new BD(70),
          false
        );
        expect(res.map((x) => x.toFixed(2).toString())).toEqual([
          "-8.00",
          "-52.33",
        ]);
      }
    );
    describe("fraction", () => {
      test.concurrent(
        "upper ellipse, radius of 20/20, at -12,34 fraction 0",
        () => {
          const res = ellipse(
            [[new BD(-12), new BD(34)], new BD(20), new BD(20)],
            new BD(0),
            false
          );
          expect(res.map((x) => x.toFixed(2).toString())).toEqual([
            "-32.00",
            "34.00",
          ]);
        }
      );
      test.concurrent(
        "upper ellipse, radius of 20/20, at -12,34 fraction 100",
        () => {
          const res = ellipse(
            [[new BD(-12), new BD(34)], new BD(20), new BD(20)],
            new BD(100),
            false
          );
          expect(res.map((x) => x.toFixed(2).toString())).toEqual([
            "8.00",
            "34.00",
          ]);
        }
      );
      test.concurrent(
        "upper ellipse, radius of 20/20, at -12,34 fraction 101",
        () => {
          const res = ellipse(
            [[new BD(-12), new BD(34)], new BD(20), new BD(20)],
            new BD(101),
            false
          );
          expect(res.map((x) => x.toFixed(2).toString())).toEqual([
            "8.40",
            "NaN",
          ]);
        }
      );
      test.concurrent(
        "upper ellipse, radius of 20/20, at -12,34 fraction -0.001",
        () => {
          const res = ellipse(
            [[new BD(-12), new BD(34)], new BD(20), new BD(20)],
            new BD(-0.001),
            false
          );
          expect(res.map((x) => x.toFixed(2).toString())).toEqual([
            "-32.00",
            "NaN",
          ]);
        }
      );
    });
  });

  describe("quadraticBezier", () => {
    it.todo("quadraticBezier");
    it.todo("change fraction to BigDecimal");
    it.todo("also for getPointFromLineSegment, (use 1-100 or 0-1)");
  });

  describe("cubicBezier", () => {
    it.todo("cubicBezier");
  });
});
