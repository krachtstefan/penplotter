import {
  arcCommand,
  closeCmd,
  cubicBezierCmd,
  lineToCmd,
  lineToHorVerCmd,
  moveToCmd,
  processPathCommand,
  quadraticBezierCmd,
  splitPathString,
  translatePathString,
} from "../path";

import BD from "decimal.js";
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

    test.concurrent("gets z command at the end", () => {
      const res = splitPathString("M 10,10 L 90,90 z");
      expect(res).toEqual(["M 10,10", "L 90,90", "z"]);
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

    test.concurrent("supports commands without arguments", () => {
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
    describe("moveToCmd", () => {
      test.concurrent("absolute ", () => {
        const res = moveToCmd.process({
          command: "M",
          args: ["50", "60"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["5", "5"],
            ["10", "10"],
          ],

          [["50", "60"]],
        ]);
      });
      test.concurrent("relative ", () => {
        const res = moveToCmd.process({
          command: "m",
          args: ["50", "60"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["5", "5"],
            ["10", "10"],
          ],
          [["60", "70"]],
        ]);
      });
    });

    describe("closeCmd", () => {
      test.concurrent("uppercase", () => {
        const res = closeCmd.process({
          command: "Z",
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });
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
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });
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
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
              [new BD("5"), new BD("5")],
            ],
          ],
        });
        expect(res.map((x) => mapMatrixToString(x))).toEqual([
          [
            ["5", "5"],
            ["10", "10"],
            ["5", "5"],
          ],
        ]);
      });
    });

    describe("lineToCmd", () => {
      describe("absolute", () => {
        test.concurrent("two arguments", () => {
          const res = lineToCmd.process({
            command: "L",
            args: ["50", "60"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["50", "60"],
            ],
          ]);
        });
        test.concurrent("four arguments", () => {
          const res = lineToCmd.process({
            command: "L",
            args: ["50", "60", "150", "160"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["50", "60"],
              ["150", "160"],
            ],
          ]);
        });
        test.concurrent("one argument (invalid)", () => {
          const res = lineToCmd.process({
            command: "L",
            args: ["50"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
            ],
          ]);
        });
        test.concurrent("three argument (invalid)", () => {
          const res = lineToCmd.process({
            command: "L",
            args: ["50", "60", "150"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["50", "60"],
            ],
          ]);
        });
      });

      describe("relative", () => {
        test.concurrent("two arguments", () => {
          const res = lineToCmd.process({
            command: "l",
            args: ["50", "60"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["60", "70"],
            ],
          ]);
        });
        test.concurrent("four arguments", () => {
          const res = lineToCmd.process({
            command: "l",
            args: ["50", "60", "150", "160"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["60", "70"],
              ["210", "230"],
            ],
          ]);
        });
        test.concurrent("one argument (invalid)", () => {
          const res = lineToCmd.process({
            command: "l",
            args: ["50"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
            ],
          ]);
        });
        test.concurrent("three argument (invalid)", () => {
          const res = lineToCmd.process({
            command: "l",
            args: ["50", "60", "150"],
            lines: [
              [
                [new BD("5"), new BD("5")],
                [new BD("10"), new BD("10")],
              ],
            ],
          });
          expect(res.map((x) => mapMatrixToString(x))).toEqual([
            [
              ["5", "5"],
              ["10", "10"],
              ["60", "70"],
            ],
          ]);
        });
      });
    });

    describe("lineToHorVerCmd", () => {
      describe("horizontal", () => {
        describe("absolute", () => {
          test.concurrent("one arguments", () => {
            const res = lineToHorVerCmd.process({
              command: "H",
              args: ["12"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["12", "10"],
              ],
            ]);
          });
          test.concurrent("two arguments uses the last", () => {
            const res = lineToHorVerCmd.process({
              command: "H",
              args: ["10", "15"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["15", "10"],
              ],
            ]);
          });
        });
        describe("relative", () => {
          test.concurrent("one arguments", () => {
            const res = lineToHorVerCmd.process({
              command: "h",
              args: ["12"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["22", "10"],
              ],
            ]);
          });
          test.concurrent("two arguments uses the last", () => {
            const res = lineToHorVerCmd.process({
              command: "h",
              args: ["10", "15"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["25", "10"],
              ],
            ]);
          });
        });
      });
      describe("vertical", () => {
        describe("absolute", () => {
          test.concurrent("one arguments", () => {
            const res = lineToHorVerCmd.process({
              command: "V",
              args: ["12"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["10", "12"],
              ],
            ]);
          });
          test.concurrent("two arguments uses the last", () => {
            const res = lineToHorVerCmd.process({
              command: "V",
              args: ["10", "15"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["10", "15"],
              ],
            ]);
          });
        });
        describe("relative", () => {
          test.concurrent("one arguments", () => {
            const res = lineToHorVerCmd.process({
              command: "v",
              args: ["12"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["10", "22"],
              ],
            ]);
          });
          test.concurrent("two arguments uses the last", () => {
            const res = lineToHorVerCmd.process({
              command: "v",
              args: ["10", "15"],
              lines: [
                [
                  [new BD("5"), new BD("5")],
                  [new BD("10"), new BD("10")],
                ],
              ],
            });
            expect(res.map((x) => mapMatrixToString(x))).toEqual([
              [
                ["5", "5"],
                ["10", "10"],
                ["10", "25"],
              ],
            ]);
          });
        });
      });
    });

    describe("quadraticBezierCmd", () => {
      test.concurrent("absolute", () => {
        const res = quadraticBezierCmd.process({
          command: "Q",
          args: ["400", "20", "200", "200"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });

        expect(res[0].length).toEqual(102); // first point, start of the bezier and 100 bezier samples
        expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
          ["5", "5"],
          ["10", "10"],
        ]); // bezier start
        expect(mapMatrixToString(res[0].slice(-1))).toEqual([["200", "200"]]); // bezier end
      });
      test.concurrent("relative", () => {
        const res = quadraticBezierCmd.process({
          command: "q",
          args: ["400", "20", "200", "200"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });

        expect(res[0].length).toEqual(102); // first point, start of the bezier and 100 bezier samples
        expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
          ["5", "5"],
          ["10", "10"],
        ]); // bezier start
        expect(mapMatrixToString(res[0].slice(-1))).toEqual([["210", "210"]]); // bezier end
      });
    });

    describe("cubicBezierCmd", () => {
      test.concurrent("absolute", () => {
        const res = cubicBezierCmd.process({
          command: "C",
          args: ["30", "90", "25", "10", "50", "10"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });

        expect(res[0].length).toEqual(102); // first point, start of the bezier and 100 bezier samples
        expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
          ["5", "5"],
          ["10", "10"],
        ]); // bezier start
        expect(mapMatrixToString(res[0].slice(-1))).toEqual([["50", "10"]]); // bezier end
      });

      test.concurrent("relative", () => {
        const res = cubicBezierCmd.process({
          command: "c",
          args: ["30", "90", "25", "10", "50", "10"],
          lines: [
            [
              [new BD("5"), new BD("5")],
              [new BD("10"), new BD("10")],
            ],
          ],
        });

        expect(res[0].length).toEqual(102); // first point, start of the bezier and 100 bezier samples
        expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
          ["5", "5"],
          ["10", "10"],
        ]); // bezier start
        expect(mapMatrixToString(res[0].slice(-1))).toEqual([["60", "20"]]); // bezier end
      });
    });
  });

  describe("arcCommand", () => {
    it.todo("swapping start and endpoint, swappes sweep flag too");
    it.todo("diagonal, circle and ellipse");
    it.todo("rotated, circle and ellipse");
    describe("circle", () => {
      describe("no croping", () => {
        const res = arcCommand.process({
          command: "c",
          args: ["1", "1", "0", "0", "0", "250", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("0"), new BD("0")],
            ],
          ],
        });

        const resLargeArc = arcCommand.process({
          command: "c",
          args: ["1", "1", "0", "1", "0", "250", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("0"), new BD("0")],
            ],
          ],
        });

        const resSweep = arcCommand.process({
          command: "c",
          args: ["1", "1", "0", "0", "1", "250", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("0"), new BD("0")],
            ],
          ],
        });

        test.concurrent("lower", () => {
          expect(res[0].length).toEqual(102); // first point, and 101 circle samples
          expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
            ["-5", "-5"],
            ["0", "0"],
          ]); // first point and circle start

          expect(mapMatrixToString(res[0].slice(-51, -50))).toEqual([
            ["125", "125"],
          ]); // highes circle point
          expect(mapMatrixToString(res[0].slice(-1))).toEqual([["250", "0"]]); // circle end
        });

        test.concurrent("same result with large arc flag", () => {
          expect(res).toEqual(resLargeArc);
        });

        test.concurrent("upper", () => {
          expect(resSweep[0].length).toEqual(102); // first point, and 101 circle samples
          expect(mapMatrixToString(resSweep[0].slice(0, 2))).toEqual([
            ["-5", "-5"],
            ["0", "0"],
          ]); // first point and circle start

          expect(mapMatrixToString(resSweep[0].slice(-51, -50))).toEqual([
            ["125", "-125"],
          ]); // highes circle point
          expect(mapMatrixToString(resSweep[0].slice(-1))).toEqual([
            ["250", "0"],
          ]); // circle end
        });
      });

      describe("cropped (big radius)", () => {
        const res = arcCommand.process({
          command: "c",
          args: ["150", "150", "0", "0", "0", "600", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("500"), new BD("0")],
            ],
          ],
        });

        const resLargeArc = arcCommand.process({
          command: "c",
          args: ["150", "150", "0", "1", "0", "600", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("500"), new BD("0")],
            ],
          ],
        });

        const resSweep = arcCommand.process({
          command: "c",
          args: ["150", "150", "0", "0", "1", "600", "0"],
          lines: [
            [
              [new BD("-5"), new BD("-5")],
              [new BD("500"), new BD("0")],
            ],
          ],
        });

        test.concurrent("lower", () => {
          expect(res[0].length).toEqual(102); // first point, and 101 circle samples
          expect(mapMatrixToString(res[0].slice(0, 2))).toEqual([
            ["-5", "-5"],
            ["500", "0"],
          ]); // first point and circle start

          expect(mapMatrixToString(res[0].slice(-51, -50))).toEqual([
            ["550", "8.58"],
          ]); // highes circle point

          expect(mapMatrixToString(res[0].slice(-1))).toEqual([["600", "0"]]); // circle end
        });

        test.concurrent("large arc flag", () => {
          expect(resLargeArc[0].length).toEqual(304); // first point, and 3 times 101 circle samples (3 circle segments)

          expect(mapMatrixToString(resLargeArc[0].slice(0, 2))).toEqual([
            ["-5", "-5"],
            ["500", "0"],
          ]); // first point and circle start

          expect(mapMatrixToString(resLargeArc[0].slice(-152, -151))).toEqual([
            ["550", "291.42"],
          ]); // highes circle point

          expect(mapMatrixToString(resLargeArc[0].slice(-1))).toEqual([
            ["600", "0"],
          ]); // circle end
        });

        test.concurrent("upper", () => {
          expect(resSweep[0].length).toEqual(102); // first point, and 101 circle samples
          expect(mapMatrixToString(resSweep[0].slice(0, 2))).toEqual([
            ["-5", "-5"],
            ["500", "0"],
          ]); // first point and circle start

          expect(mapMatrixToString(resSweep[0].slice(-51, -50))).toEqual([
            ["550", "-8.58"],
          ]); // highes circle point

          expect(mapMatrixToString(resSweep[0].slice(-1))).toEqual([
            ["600", "0"],
          ]); // circle end
        });
      });
    });

    describe("ellipse", () => {
      describe("no cropping", () => {
        describe("2:1", () => {
          const res2to1 = arcCommand.process({
            command: "c",
            args: ["2", "1", "0", "0", "0", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });

          const res2to1LargeArc = arcCommand.process({
            command: "c",
            args: ["2", "1", "0", "1", "0", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });

          const res2to1Sweep = arcCommand.process({
            command: "c",
            args: ["2", "1", "0", "0", "1", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });
          test.concurrent("lower", () => {
            expect(res2to1[0].length).toEqual(102); // first point, and 101 circle samples
            expect(mapMatrixToString(res2to1[0].slice(0, 2))).toEqual([
              ["-5", "-5"],
              ["0", "0"],
            ]); // first point and circle start

            expect(mapMatrixToString(res2to1[0].slice(-51, -50))).toEqual([
              ["125", "250"],
            ]); // highes circle point
            expect(mapMatrixToString(res2to1[0].slice(-1))).toEqual([
              ["250", "0"],
            ]); // circle end
          });

          test.concurrent("same result with large arc flag", () => {
            expect(res2to1).toEqual(res2to1LargeArc);
          });

          test.concurrent("upper", () => {
            expect(res2to1Sweep[0].length).toEqual(102); // first point, and 101 circle samples
            expect(mapMatrixToString(res2to1Sweep[0].slice(0, 2))).toEqual([
              ["-5", "-5"],
              ["0", "0"],
            ]); // first point and circle start
            expect(mapMatrixToString(res2to1Sweep[0].slice(-51, -50))).toEqual([
              ["125", "-250"],
            ]); // highes circle point
            expect(mapMatrixToString(res2to1Sweep[0].slice(-1))).toEqual([
              ["250", "0"],
            ]); // circle end
          });
        });

        describe("1:2", () => {
          const res1to2 = arcCommand.process({
            command: "c",
            args: ["1", "2", "0", "0", "0", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });

          const res1to2LargeArc = arcCommand.process({
            command: "c",
            args: ["1", "2", "0", "1", "0", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });

          const res1to2Sweep = arcCommand.process({
            command: "c",
            args: ["1", "2", "0", "0", "1", "250", "0"],
            lines: [
              [
                [new BD("-5"), new BD("-5")],
                [new BD("0"), new BD("0")],
              ],
            ],
          });
          test.concurrent("basic", () => {
            expect(res1to2[0].length).toEqual(102); // first point, and 101 circle samples
            expect(mapMatrixToString(res1to2[0].slice(0, 2))).toEqual([
              ["-5", "-5"],
              ["0", "0"],
            ]); // first point and circle start

            expect(mapMatrixToString(res1to2[0].slice(-51, -50))).toEqual([
              ["125", "62.5"],
            ]); // highes circle point
            expect(mapMatrixToString(res1to2[0].slice(-1))).toEqual([
              ["250", "0"],
            ]); // circle end
          });

          test.concurrent("same result with large arc flag", () => {
            expect(res1to2).toEqual(res1to2LargeArc);
          });

          test.concurrent("upper", () => {
            expect(res1to2Sweep[0].length).toEqual(102); // first point, and 101 circle samples
            expect(mapMatrixToString(res1to2Sweep[0].slice(0, 2))).toEqual([
              ["-5", "-5"],
              ["0", "0"],
            ]); // first point and circle start
            expect(mapMatrixToString(res1to2Sweep[0].slice(-51, -50))).toEqual([
              ["125", "-62.5"],
            ]); // highes circle point
            expect(mapMatrixToString(res1to2Sweep[0].slice(-1))).toEqual([
              ["250", "0"],
            ]); // circle end
          });
        });
      });
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
    test.concurrent("multiple line commands and a redundant close", () => {
      const res = translatePathString(
        "M 10,10 L 90,90 V 10 H 50 v10 h10 v-10 h-50 z"
      );
      expect(res.map((matrix) => mapMatrixToString(matrix))).toEqual([
        [
          ["10", "10"],
          ["90", "90"],
          ["90", "10"],
          ["50", "10"],
          ["50", "20"],
          ["60", "20"],
          ["60", "10"],
          ["10", "10"],
        ],
      ]);
    });
    test.concurrent("basic quadratic bezier", () => {
      const res = translatePathString("M 0,0 L 20,20 M 10,10 Q 400,20 200,200");
      expect(res.length).toEqual(2); // two lines
      expect(res[1].length).toEqual(101); // second line has start point and 100 bezier samples
      expect(mapMatrixToString(res[1])[0]).toEqual(["10", "10"]); // start point
      expect(mapMatrixToString(res[1].slice(-1))[0]).toEqual(["200", "200"]); // the last point is the finish point
    });

    test.concurrent("one line with basic cubic bezier", () => {
      const res = translatePathString("M 10,90 L 20,20 C 30,90 25,10 50,10");
      expect(res.length).toEqual(1); // one line
      expect(res[0].length).toEqual(102); // start point, second point and 100 bezier samples
      expect(mapMatrixToString(res[0])[0]).toEqual(["10", "90"]); // start point
      expect(mapMatrixToString(res[0])[1]).toEqual(["20", "20"]); // second point
      expect(mapMatrixToString(res[0].slice(-1))[0]).toEqual(["50", "10"]); // the last point is the finish point
    });

    test.concurrent("very simple arc inside a line segment", () => {
      const res = translatePathString(
        "M 10 20 L 100 200 A 1 1 0 0 0 250 200 L400 0"
      );
      expect(res.length).toEqual(1); // one line
      expect(res[0].length).toEqual(103); // 101 samples and 2 points
      expect(mapMatrixToString(res[0])[0]).toEqual(["10", "20"]); // first point
      expect(mapMatrixToString(res[0])[1]).toEqual(["100", "200"]); // start point of circle
      expect(mapMatrixToString(res[0])[2]).not.toEqual(["100", "200"]); // first sample
      expect(mapMatrixToString(res[0]).slice(-3)[0]).not.toEqual([
        "250",
        "200",
      ]); // last sample
      expect(mapMatrixToString(res[0]).slice(-2)[0]).toEqual(["250", "200"]); // end point of circle
      expect(mapMatrixToString(res[0]).slice(-1)[0]).toEqual(["400", "0"]); // end point of line
    });
  });
});
