import { ElementNode, Node, RootNode, parse } from "svg-parser";
import { ElementType, NestedArray, Point2D, isElementNode } from "./types";
import {
  arrayofNumberArrToPoint2D,
  convertPointsRelToAbs,
  createPoint2D,
  cubicBezier,
  quadraticBezier,
} from "./math";
import { chunk, flattenDeep } from "lodash";

import BigDecimal from "decimal.js";

class SvgParser {
  elements: ElementNode[];
  supportedTypes: ElementType[];
  constructor(svg: string) {
    const svgObj = parse(svg);
    this.elements = this._getAllElements(svgObj);
    this.supportedTypes = Object.values(ElementType);
  }

  returnElementsByTagName(tagnames: ElementType | ElementType[]) {
    const tagnamesArr = typeof tagnames === "string" ? [tagnames] : tagnames;
    return this.elements.filter((e) =>
      tagnamesArr.some((x) => x === e.tagName)
    );
  }

  returnSupportedElements() {
    return this.returnElementsByTagName(this.supportedTypes);
  }

  _getAllElements = (obj: RootNode | Node): ElementNode[] => {
    const getChildren = (
      o: RootNode | Node | string
    ): NestedArray<RootNode | Node> => {
      if (typeof o === "string") {
        return [];
      }
      return o.type !== "text" && o.children
        ? [o, ...o.children.filter(isElementNode).map((x) => getChildren(x))]
        : [o];
    };

    return flattenDeep(getChildren(obj))
      .filter(isElementNode)
      .map((x) => x);
  };
}

// current implementations:
// 20,20 40,25 60,40 80,120 120,140 200,180
// 20 20 40 25 60 40 80 120 120 140 200 180
export const translateSVGPoints = (pointString: string): Point2D[] => {
  const allPoints = pointString.split(/,| |\n/);
  if (allPoints.length % 2 !== 0) {
    console.error("detected uneven pair of points", allPoints);
  }
  return chunk(allPoints, 2).map((x) => [
    new BigDecimal(x[0]),
    new BigDecimal(x[1]),
  ]);
};

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
    .split(/[,| ]|(?=[-])/),
];

const commandMapping = [
  {
    command: [
      "M", // create a new element
      "m", // relative version of M
    ],
    isValid: (args: string[]) => args.length === 2,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => [
      ...previousLines,
      command === "M"
        ? [createPoint2D([args[0], args[1]])]
        : convertPointsRelToAbs(currentLine.slice(-1)[0], [
            createPoint2D([args[0], args[1]]),
          ]),
    ],
  },
  {
    command: [
      "Z", // close path command
      "z", // relative version of Z
    ],
    isValid: (args: string[]) => args.length === 0,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => {
      const firstPoint = currentLine[0];
      const lastPoint = currentLine.slice(-1)[0];
      if (
        currentLine.length > 2 &&
        !firstPoint[0].eq(lastPoint[0]) &&
        !firstPoint[1].eq(lastPoint[1])
      ) {
        return [...previousLines, [...currentLine, createPoint2D(firstPoint)]];
      } else {
        console.warn(`Path was already closed, skipped ${command} command.`);
        return previousLines;
      }
    },
  },
  {
    command: [
      "L", // L (line) command draws to a new coordinate
      "l", // relative version of L
    ],
    isValid: (args: string[]) => args.length % 2 === 0,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => {
      let newLineSegment = arrayofNumberArrToPoint2D(
        chunk(args, 2).map((x) => [x[0], x[1]])
      );
      if (command === "l") {
        newLineSegment = convertPointsRelToAbs(
          currentLine.slice(-1)[0],
          newLineSegment
        );
      }
      return [...previousLines, [...currentLine, ...newLineSegment]];
    },
  },
  {
    command: [
      "H", // H command draws a new horizontal line
      "h", // relative version of H
      "V", // V command draws a new vertical line
      "v", // relative version of V
    ],
    isValid: (args: string[]) => args.length === 1,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => {
      const isRelative = ["h", "v"].includes(command);
      // the x or y of this coordinate will be adopted
      const refCoordinate = isRelative ? [0, 0] : currentLine.slice(-1)[0];

      const targetCoordinate =
        command.toLowerCase() === "h"
          ? [...args, refCoordinate[1]]
          : [refCoordinate[0], ...args];
      let newHorLineSegment = [
        createPoint2D([targetCoordinate[0], targetCoordinate[1]]),
      ];
      if (isRelative) {
        newHorLineSegment = convertPointsRelToAbs(
          currentLine.slice(-1)[0],
          newHorLineSegment
        );
      }

      return [...previousLines, [...currentLine, ...newHorLineSegment]];
    },
  },
  {
    command: [
      "Q", // Q command draws quadratic bezier curve
      "q", // relative version of Q
    ],
    isValid: (args: string[]) => args.length === 4,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => {
      let quadraticCurveCoords = arrayofNumberArrToPoint2D(
        chunk(args, 2).map((x) => [x[0], x[1]])
      );
      if (command === "q") {
        quadraticCurveCoords = quadraticCurveCoords.map(
          (b) => convertPointsRelToAbs(currentLine.slice(-1)[0], [b])[0]
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
            [currentLine[0], quadraticCurveCoords[0], quadraticCurveCoords[1]],
            x
          )
        );
      return [
        ...previousLines,
        [currentLine[0], ...quadInterpolations, quadraticCurveCoords[1]],
      ];
    },
  },
  {
    command: [
      "C", // C command draws cubic bezier curve
      "c", // relative version of C
    ],
    isValid: (args: string[]) => args.length === 6,
    process: (
      command: string,
      args: string[],
      previousLines: Point2D[][],
      currentLine: Point2D[]
    ) => {
      let cubicCurveCoords = arrayofNumberArrToPoint2D(
        chunk(args, 2).map((x) => [x[0], x[1]])
      );
      if (command === "c") {
        cubicCurveCoords = cubicCurveCoords.map(
          (b) => convertPointsRelToAbs(currentLine.slice(-1)[0], [b])[0]
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
              currentLine[0],
              cubicCurveCoords[0],
              cubicCurveCoords[1],
              cubicCurveCoords[2],
            ],
            x
          )
        );
      return [
        ...previousLines,
        [currentLine[0], ...cubicInterpolations, cubicCurveCoords[2]],
      ];
    },
  },
];

export const translatePathString = (pathString: string): Point2D[][] =>
  splitPathString(pathString).reduce((acc, curr) => {
    const [command, args] = processPathCommand(curr);
    const currentLine = acc.slice(-1)[0];
    const previousLines = acc.slice(0, -1);
    const cmd = commandMapping.find((x) => x.command.includes(command));
    if (cmd) {
      if (cmd.isValid(args) === true) {
        return cmd.process(command, args, previousLines, currentLine);
      } else {
        console.log(`invalid command ${command} with arguments ${args}`);
      }
    } else {
      console.error(
        `path command ${command} with args ${args} not supported yet (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)`
      );
    }
    return acc;
  }, [] as Point2D[][]);

export const returnPointsArrFromElement = (
  element: ElementNode
): Point2D[][] => {
  if (element.properties) {
    switch (element.tagName) {
      case ElementType.polyline:
      case ElementType.polygon:
        if (element.properties && element.properties.points) {
          return element.tagName === ElementType.polyline
            ? [translateSVGPoints(`${element.properties.points}`)]
            : /**
               * polygon is like polyline, except the path is closed,
               * we need to copy the first coordinates
               */
              [
                translateSVGPoints(
                  `${element.properties.points} ${element.properties.points
                    .toString()
                    .split(" ")
                    .slice(0, 2)
                    .join(" ")}`
                ),
              ];
        }
        console.error(`points are missing for ${element.tagName}`);
        return [];
      case ElementType.line:
        const { x1, x2, y1, y2 } = element.properties;
        if (
          x1 !== undefined &&
          x2 !== undefined &&
          y1 !== undefined &&
          y2 !== undefined
        ) {
          return [
            [
              [new BigDecimal(x1), new BigDecimal(y1)],
              [new BigDecimal(x2), new BigDecimal(y2)],
            ],
          ];
        }
        console.error(`coordinates are missing for ${element.tagName}`);
        return [];
      case ElementType.rect:
        const { x: xAttr, y: yAttr, width, height } = element.properties;
        const x = new BigDecimal(xAttr ? xAttr : 0);
        const y = new BigDecimal(yAttr ? yAttr : 0);
        return [
          [
            [x, y],
            [x.add(width), y],
            [x.add(width), y.add(height)],
            [x, y.add(height)],
            [x, y],
          ],
        ];
      case ElementType.path:
        return translatePathString(`${element.properties.d}`);
      default:
        return [];
    }
  }
  console.error(`properties are missing for ${element.tagName}`);
  return [];
};

export default SvgParser;
