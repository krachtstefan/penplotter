import { ElementNode, Node, RootNode, parse } from "svg-parser";
import { ElementType, NestedArray, Point2D, isElementNode } from "./types";
import { chunk, flattenDeep } from "lodash";

import BigDecimal from "decimal.js";

class PenPlotter {
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

/**
 *  Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
 */
export const getLenghtByPoints = (
  [x1, y1]: Point2D,
  [x2, y2]: Point2D
): BigDecimal => {
  const a = x1.sub(x2).abs().pow(2);
  const b = y1.sub(y2).abs().pow(2);
  return a.add(b).sqrt();
};

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
 * example:
 *
 * convertPointsRelToAbs([1,2], [[2,3], [4,5]])
 * returns
 * [[3,5], [7,10]]
 */
export const convertPointsRelToAbs = (
  startPnt: Point2D,
  arrOfPoints: Point2D[]
) =>
  arrOfPoints
    .reduce(
      (acc, curr) => {
        const add: Point2D = [
          new BigDecimal(acc.slice(-1)[0][0]).add(curr[0]),
          new BigDecimal(acc.slice(-1)[0][1]).add(curr[1]),
        ];

        return [...acc, add];
      },
      [startPnt]
    )
    .slice(1);

const createPoint2D = (arr: [any, any]): Point2D => [
  new BigDecimal(arr[0]),
  new BigDecimal(arr[1]),
];

const arrayofNumberArrToPoint2D = (arr: [any, any][]) =>
  arr.map((numericArr) => createPoint2D(numericArr));

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
 * trim optional whitespace between command and split at whitespaces or commas (or )
 * current implementation: "l10-0.6" "l10,0.6" "l10 0.6" "l10,-0.6"
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

export const translatePathString = (pathString: string): Point2D[][] =>
  splitPathString(pathString).reduce((acc, curr) => {
    const [command, args] = processPathCommand(curr);

    let result = [...acc];
    const currentLine = acc.slice(-1)[0];
    const previouseLines = acc.slice(0, -1);
    switch (`${command}`) {
      case "M": // create a new element
      case "m": // relative version of M
        const newStartingPoint =
          command === "M"
            ? [createPoint2D([args[0], args[1]])]
            : convertPointsRelToAbs(currentLine.slice(-1)[0], [
                createPoint2D([args[0], args[1]]),
              ]);

        result = [...acc, newStartingPoint];
        break;
      case "Z": // close path command
      case "z": // relative version of Z
        const firstPoint = currentLine[0];
        const lastPoint = currentLine.slice(-1)[0];
        if (
          currentLine.length > 2 &&
          !firstPoint[0].eq(lastPoint[0]) &&
          !firstPoint[1].eq(lastPoint[1])
        ) {
          result = [
            ...previouseLines,
            [...currentLine, createPoint2D(firstPoint)],
          ];
        } else {
          console.warn(`Path was already closed, skipped ${command} command.`);
        }
        break;
      case "L": // L (line) command draws to a new coordinate
      case "l": // relative version of L
        let newLineSegment = arrayofNumberArrToPoint2D(
          chunk(args, 2).map((x) => [x[0], x[1]])
        );
        if (command === "l") {
          newLineSegment = convertPointsRelToAbs(
            currentLine.slice(-1)[0],
            newLineSegment
          );
        }
        result = [...previouseLines, [...currentLine, ...newLineSegment]];
        break;

      case "H": // H command draws a new horizontal line
      case "V": // V command draws a new vertical line
      case "h": // relative version of H
      case "v": // relative version of V
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

        result = [...previouseLines, [...currentLine, ...newHorLineSegment]];
        break;

      case "Q": // Q command draws quadratic bezier curve
      case "q": // relative version of Q
        if (args.length !== 4) {
          console.warn(
            `quadratic bezier curve had an unexpected amount of args (${args.length}), skipped`
          );
          break;
        }
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
              [
                currentLine[0],
                quadraticCurveCoords[0],
                quadraticCurveCoords[1],
              ],
              x
            )
          );
        result = [
          ...previouseLines,
          [currentLine[0], ...quadInterpolations, quadraticCurveCoords[1]],
        ];
        break;
      case "C": // C command draws cubic bezier curve
      case "c": // relative version of C
        if (args.length !== 6) {
          console.warn(
            `quadratic bezier curve had an unexpected amount of args (${args.length}), skipped`
          );
          break;
        }
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
        result = [
          ...previouseLines,
          [currentLine[0], ...cubicInterpolations, cubicCurveCoords[2]],
        ];
        break;
      default:
        console.error(
          `path command ${command} with args ${args} not supported yet (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)`
        );
        result = acc;
        break;
    }
    return result;
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

/**
 * returns a point from the line segment between start and finish
 * at the given fraction. A fraction of 0.5 f.e returns the midpoint
 */
export const getPointFromLineSegment = (
  start: Point2D,
  finish: Point2D,
  fraction: number
): Point2D => [
  start[0].minus(finish[0]).times(-fraction).plus(start[0]),
  start[1].minus(finish[1]).times(-fraction).plus(start[1]),
];

/**
 *
 * The quadratic bezier curve has three points, a start, finish and a control point
 * there a three interploations done at the same time, to get a point (C) on that curve
 * 1: a point (A) on the line from the start to the control point
 * 2: a point (B) on the line from the control point to the finish
 * 3: a point (C) on the line from point A to B
 *
 * It's much simpler as it sounds: https://youtu.be/pnYccz1Ha34
 */
const quadraticBezier = (
  [start, controlPoint, finish]: [Point2D, Point2D, Point2D],
  fraction: number
) =>
  getPointFromLineSegment(
    getPointFromLineSegment(start, controlPoint, fraction),
    getPointFromLineSegment(controlPoint, finish, fraction),
    fraction
  );

/**
 *
 * The cubic bezier curve has four points, a start, finish and control point a and b
 * it is basically an interpolation between two quadratic bezier curves one with start,
 * control point a and control point b and one with control point a, control point b
 * and the finish point
 *
 * Again, it's not that complicated: https://youtu.be/pnYccz1Ha34
 */
const cubicBezier = (
  [start, controlPointA, controlPointB, finish]: [
    Point2D,
    Point2D,
    Point2D,
    Point2D
  ],
  fraction: number
) =>
  getPointFromLineSegment(
    quadraticBezier([start, controlPointA, controlPointB], fraction),
    quadraticBezier([controlPointA, controlPointB, finish], fraction),
    fraction
  );

export const getPosition = (arrOfPoints: Point2D[]): Point2D => {
  const allX = arrOfPoints.map((p) => p[0].toNumber());
  const allY = arrOfPoints.map((p) => p[1].toNumber());
  return [new BigDecimal(Math.min(...allX)), new BigDecimal(Math.min(...allY))];
};

export const getDimensions = (
  arrOfPoints: Point2D[]
): { width: BigDecimal; height: BigDecimal } => {
  const allX = arrOfPoints.map((p) => p[0].toNumber());
  const allY = arrOfPoints.map((p) => p[1].toNumber());
  return {
    width: new BigDecimal(Math.max(...allX)).minus(Math.min(...allX)),
    height: new BigDecimal(Math.max(...allY)).minus(Math.min(...allY)),
  };
};

export const mapMatrixToString = (arr: Point2D[][]): string[][] =>
  arr.map((x) => x.map((y) => y.toString()));

export const scale = (arrOfPoints: Point2D[], factor: number): Point2D[] =>
  arrOfPoints.map(([x, y]) => [
    new BigDecimal(x).times(factor || 0),
    new BigDecimal(y).times(factor || 0),
  ]);

export const mirrorX = (
  arrOfPoints: Point2D[],
  xAxis = new BigDecimal(0)
): Point2D[] => arrOfPoints.map(([x, y]) => [xAxis.minus(x.minus(xAxis)), y]);

export const mirrorY = (
  arrOfPoints: Point2D[],
  yAxis = new BigDecimal(0)
): Point2D[] => arrOfPoints.map(([x, y]) => [x, yAxis.minus(y.minus(yAxis))]);

export const move = (
  arrOfPoints: Point2D[],
  {
    down = new BigDecimal(0),
    right = new BigDecimal(0),
  }: { down: BigDecimal; right: BigDecimal }
): Point2D[] =>
  arrOfPoints.map(([x, y]) => [
    new BigDecimal(x).add(right || 0),
    new BigDecimal(y).add(down || 0),
  ]);

export default PenPlotter;
