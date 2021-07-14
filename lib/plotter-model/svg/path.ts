import { Point2D, processArgs } from "../types";
import {
  arrayofNumberArrToPoint2D,
  convertPointsRelToAbs,
  createPoint2D,
  cubicBezier,
  quadraticBezier,
} from "../math";

import BigDecimal from "decimal.js";
import { chunk } from "lodash";

/**
 * current implementations:
 * M35,0.75 L34.09375,2.5625
 * M 382.49999 494.99999 L 384.55374 496.87223
 * M 0,0 Q 200,20 200,200
 * M 0,0L1.1,1.14L2.2,-0.37L3.3,-1.02
 */
export const splitPathString = (pathString: string): string[] =>
  /**
   * split before character and trim
   * "(?=(?<! )[a-z|A-Z])" set the cursor before all character with no whitespace before it
   * " (?=[a-z|A-Z])" find all whitespaces with a character behind them
   */
  pathString.split(/(?=(?<! )[a-z|A-Z])| (?=[a-z|A-Z])/);

/**
 * trim optional whitespace between commands and split at whitespaces, commas or at minus (when
 * negative numbers are used, a separator is not required to optimize file size
 *
 * current implementation: "l10,0.6" "l10 0.6" "l10,-0.6" "l10-0.6"
 */
export const processPathCommand = (
  commandString: string
): [string, string[]] => [
  commandString.slice(0, 1),
  commandString
    .slice(1)
    .trim()
    .split(/[,| ]|(?=[-])/)
    // support commands without arguments
    .filter((x) => x !== ""),
];

export const moveToCmd = {
  command: [
    "M", // create a new element
    "m", // relative version of M
  ],
  isValid: (args: string[]) => args.length === 2,
  process: ({ command, args, lines }: processArgs): Point2D[][] => {
    if (args && args.length === 2) {
      return [
        ...lines,
        command === "M"
          ? [createPoint2D([args[0], args[1]])]
          : convertPointsRelToAbs(lines.slice(-1)[0].slice(-1)[0], [
              createPoint2D([args[0], args[1]]),
            ]),
      ];
    } else {
      console.warn(`invalid args (${args}) for command ${command}.`);
      return lines;
    }
  },
};

export const closeCmd = {
  command: [
    "Z", // close path command
    "z", // both have the same behaviour
  ],
  isValid: (args: string[]) => args.length === 0,
  process: ({ command, lines }: processArgs): Point2D[][] => {
    const firstPoint = lines.slice(-1)[0][0];
    const lastPoint = lines.slice(-1)[0].slice(-1)[0];
    if (
      lines.slice(-1)[0].length >= 2 &&
      !firstPoint[0].eq(lastPoint[0]) &&
      !firstPoint[1].eq(lastPoint[1])
    ) {
      return [
        ...lines.slice(0, -1),
        [...lines.slice(-1)[0], createPoint2D(firstPoint)],
      ];
    } else {
      console.warn(
        `Noting to close, skipped ${command} command.`,
        lines.slice(-1)[0]
      );
      return lines;
    }
  },
};

export const lineToCmd = {
  command: [
    "L", // L (line) command draws to a new coordinate
    "l", // relative version of L
  ],
  isValid: (args: string[]) => args.length % 2 === 0,
  process: ({ command, args, lines }: processArgs): Point2D[][] => {
    if (args) {
      if (args.length % 2 === 0) {
        console.warn(`invalid args (${args}) for command ${command}.`);
      }
      let newLineSegment = arrayofNumberArrToPoint2D(
        chunk(args, 2)
          .filter((pair) => pair.length === 2)
          .map((x) => [x[0], x[1]])
      );
      if (command === "l") {
        newLineSegment = convertPointsRelToAbs(
          lines.slice(-1)[0].slice(-1)[0],
          newLineSegment
        );
      }
      return [
        ...lines.slice(0, -1),
        [...lines.slice(-1)[0], ...newLineSegment],
      ];
    } else {
      console.warn(`invalid args (${args}) for command ${command}. skipped.`);
      return lines;
    }
  },
};

export const lineToHorVerCmd = {
  command: [
    "H", // H command draws a new horizontal line
    "h", // relative version of H
    "V", // V command draws a new vertical line
    "v", // relative version of V
  ],
  isValid: (args: string[]) => args.length === 1,
  process: ({ command, args, lines }: processArgs): Point2D[][] => {
    if (args) {
      const isRelative = ["h", "v"].includes(command);
      // the x or y of this coordinate will be adopted
      const refCoordinate: Point2D = isRelative
        ? [new BigDecimal(0), new BigDecimal(0)]
        : lines.slice(-1)[0].slice(-1)[0];

      const targetCoordinate =
        command.toLowerCase() === "h"
          ? [...args.slice(-1), refCoordinate[1]]
          : [refCoordinate[0], ...args.slice(-1)];
      let newHorLineSegment = [
        createPoint2D([targetCoordinate[0], targetCoordinate[1]]),
      ];
      if (isRelative) {
        newHorLineSegment = convertPointsRelToAbs(
          lines.slice(-1)[0].slice(-1)[0],
          newHorLineSegment
        );
      }
      return [
        ...lines.slice(0, -1),
        [...lines.slice(-1)[0], ...newHorLineSegment],
      ];
    } else {
      console.warn(`invalid args (${args}) for command ${command}. skipped.`);
      return lines;
    }
  },
};

export const quadraticBezierCmd = {
  command: [
    "Q", // Q command draws quadratic bezier curve
    "q", // relative version of Q
  ],
  isValid: (args: string[]) => args.length === 4,
  process: ({ command, args, lines }: processArgs): Point2D[][] => {
    let quadraticCurveCoords = arrayofNumberArrToPoint2D(
      chunk(args, 2).map((x) => [x[0], x[1]])
    );
    if (command === "q") {
      quadraticCurveCoords = quadraticCurveCoords.map(
        (b) => convertPointsRelToAbs(lines.slice(-1)[0].slice(-1)[0], [b])[0]
      );
    }
    const quadSampleSize = 100;
    const quadInterpolations = [...new Array(quadSampleSize)]
      .map((_, index, src) => {
        return index / src.length;
      })
      .slice(1)
      // for a sampleSize of 5, this array contains [0.2, 0.4, 0.6, 0.8] at this point
      .map((x) =>
        quadraticBezier(
          [
            lines.slice(-1)[0][0],
            quadraticCurveCoords[0],
            quadraticCurveCoords[1],
          ],
          x
        )
      );
    return [
      ...lines,
      [lines.slice(-1)[0][0], ...quadInterpolations, quadraticCurveCoords[1]],
    ];
  },
};
export const cubicBezierCmd = {
  command: [
    "C", // C command draws cubic bezier curve
    "c", // relative version of C
  ],
  isValid: (args: string[]) => args.length === 6,
  process: ({ command, args, lines }: processArgs): Point2D[][] => {
    let cubicCurveCoords = arrayofNumberArrToPoint2D(
      chunk(args, 2).map((x) => [x[0], x[1]])
    );
    if (command === "c") {
      cubicCurveCoords = cubicCurveCoords.map(
        (b) => convertPointsRelToAbs(lines.slice(-1)[0].slice(-1)[0], [b])[0]
      );
    }
    const cubicSampleSize = 100;
    const cubicInterpolations = [...new Array(cubicSampleSize)]
      .map((_, index, src) => {
        return index / src.length;
      })
      .slice(1)
      // for a sampleSize of 5, this array contains [0.2, 0.4, 0.6, 0.8] at this point
      .map((x) =>
        cubicBezier(
          [
            lines.slice(-1)[0][0],
            cubicCurveCoords[0],
            cubicCurveCoords[1],
            cubicCurveCoords[2],
          ],
          x
        )
      );
    return [
      ...lines,
      [lines.slice(-1)[0][0], ...cubicInterpolations, cubicCurveCoords[2]],
    ];
  },
};

export const commandMapping = [
  moveToCmd,
  closeCmd,
  lineToCmd,
  lineToHorVerCmd,
  quadraticBezierCmd,
  cubicBezierCmd,
];

export const translatePathString = (pathString: string): Point2D[][] =>
  splitPathString(pathString).reduce((acc, curr) => {
    const [command, args] = processPathCommand(curr);
    const cmd = commandMapping.find((x) => x.command.includes(command));
    if (cmd) {
      // TODO: remove this
      if (cmd.isValid(args) === true) {
        return cmd.process({ command, args, lines: acc });
      } else {
        console.error(`invalid command ${command} with arguments ${args}`);
      }
    } else {
      console.error(
        `path command ${command} with args ${args} not supported yet (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)`
      );
    }
    return acc;
  }, [] as Point2D[][]);
