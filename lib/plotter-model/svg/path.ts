import { Point2D, pathCommandImplementation } from "../types";
import {
  arrayofNumberArrToPoint2D,
  convertPointsRelToAbs,
  createPoint2D,
  cubicBezier,
  ellipse,
  getLenghtByPoints,
  getPointFromLineSegment,
  move,
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

export const moveToCmd: pathCommandImplementation = {
  command: [
    "M", // create a new element
    "m", // relative version of M
  ],
  process: ({ command, args, lines }) => {
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

export const closeCmd: pathCommandImplementation = {
  command: [
    "Z", // close path command
    "z", // both have the same behaviour
  ],
  process: ({ command, args, lines }) => {
    if (args && args.length > 0) {
      console.warn(
        `command ${command} was called with arguments ${args}. No arguments needed.`
      );
    }
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
      console.warn(`Noting to close, skipped ${command} command.`);
      return lines;
    }
  },
};

export const lineToCmd: pathCommandImplementation = {
  command: [
    "L", // L (line) command draws to a new coordinate
    "l", // relative version of L
  ],
  process: ({ command, args, lines }) => {
    if (args && args.length > 0) {
      if (args.length % 2 !== 0) {
        console.warn(
          `invalid args (${args}) for command ${command}. Last one will be ignored.`
        );
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

export const lineToHorVerCmd: pathCommandImplementation = {
  command: [
    "H", // H command draws a new horizontal line
    "h", // relative version of H
    "V", // V command draws a new vertical line
    "v", // relative version of V
  ],
  process: ({ command, args, lines }) => {
    if (args && args.length > 0) {
      if (args.length > 1) {
        console.warn(
          `more than one argument for command ${command}. Only using the last one.`
        );
      }
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

export const quadraticBezierCmd: pathCommandImplementation = {
  command: [
    "Q", // Q command draws quadratic bezier curve
    "q", // relative version of Q
  ],
  process: ({ command, args, lines }) => {
    if (args && args.length === 4) {
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
        ...lines.slice(0, -1),
        [...lines.slice(-1)[0], ...quadInterpolations, quadraticCurveCoords[1]],
      ];
    } else {
      console.warn(`invalid args (${args}) for command ${command}. skipped.`);
      return lines;
    }
  },
};

export const cubicBezierCmd: pathCommandImplementation = {
  command: [
    "C", // C command draws cubic bezier curve
    "c", // relative version of C
  ],
  process: ({ command, args, lines }) => {
    if (args && args.length === 6) {
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
        ...lines.slice(0, -1),
        [...lines.slice(-1)[0], ...cubicInterpolations, cubicCurveCoords[2]],
      ];
    } else {
      console.warn(`invalid args (${args}) for command ${command}. skipped.`);
      return lines;
    }
  },
};

export const arcCommand: pathCommandImplementation = {
  command: [
    "A", // A command draws an arc
    "a", // relative version of a
  ],
  process: ({ command, args, lines }) => {
    // this is how it works https://www.youtube.com/watch?v=cBw0bKNaoHw
    if (args && args.length === 7) {
      const [
        radiusXStr,
        radiusYStr,
        _xAxisRotationStr,
        largeArcFlag,
        sweepFlag,
        endXStr,
        endYStr,
      ] = args;
      if ([largeArcFlag, sweepFlag].every((x) => ["1", "0"].includes(x))) {
        const startPoint = lines.slice(-1)[0].slice(-1)[0];
        const endPoint: Point2D = [
          new BigDecimal(endXStr),
          new BigDecimal(endYStr),
        ];
        const radiusX = new BigDecimal(radiusXStr);
        const radiusY = new BigDecimal(radiusYStr);
        const center = getPointFromLineSegment(startPoint, endPoint, 0.5);
        const minRadius = getLenghtByPoints(startPoint, endPoint).div(2);

        const radiusXOverflow = radiusX.minus(minRadius);
        const radiusYOverflow = radiusY.minus(minRadius);
        // when radiusX and radiusY are smaller than the min radius, they are relative values (like 1:2 f.e.)
        const relativeRadius = radiusXOverflow.lte(0) && radiusYOverflow.lte(0);
        const radiusRatio = radiusX.div(radiusY);
        const usedRadiusX = relativeRadius ? minRadius : radiusX;
        const usedRadiusY = relativeRadius
          ? minRadius.times(radiusRatio)
          : radiusY;

        // when absolute radius, circle will not fit into start and endpoint, a scale of 0.5
        // means that the distance from start to finish is 0.5 times of the circles radius
        let scale = relativeRadius ? new BigDecimal(1) : minRadius.div(radiusX);
        let downshift = new BigDecimal(0);

        const sampleSize = 101;

        // get the first y coordinate
        downshift = relativeRadius
          ? new BigDecimal(0)
          : ellipse(
              [center, usedRadiusX, usedRadiusY],
              minRadius.times(scale),
              sweepFlag === "0"
            )[1].times(-1);

        const arcSamples = [...new Array(sampleSize)].map((_, i) => {
          const sample = relativeRadius
            ? new BigDecimal(i)
            : new BigDecimal(i).times(scale).plus(minRadius.times(scale));

          return move(
            [
              ellipse(
                [center, usedRadiusX, usedRadiusY],
                sample,
                sweepFlag === "0"
              ),
            ],
            {
              down: downshift,
            }
          )[0];
        });

        return [
          ...lines.slice(0, -1),
          [...lines.slice(-1)[0].slice(0, -1), ...arcSamples],
        ];
      }
      console.log(
        `invalid largeArcFlag (${largeArcFlag}) or sweepFlag (${sweepFlag}). Must be 1 or 0`
      );
      return lines;
    } else {
      console.warn(`invalid args (${args}) for command ${command}.`);
      return lines;
    }
  },
};

export const commandMapping = [
  moveToCmd,
  closeCmd,
  lineToCmd,
  lineToHorVerCmd,
  quadraticBezierCmd,
  cubicBezierCmd,
  arcCommand,
];

export const translatePathString = (pathString: string): Point2D[][] =>
  splitPathString(pathString).reduce((acc, curr) => {
    const [command, args] = processPathCommand(curr);
    const cmd = commandMapping.find((x) => x.command.includes(command));
    if (cmd) {
      return cmd.process({ command, args, lines: acc });
    } else {
      console.error(
        `path command ${command} with args ${args} not supported yet (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)`
      );
    }
    return acc;
  }, [] as Point2D[][]);
