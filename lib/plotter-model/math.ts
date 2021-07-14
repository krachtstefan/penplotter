import BigDecimal from "decimal.js";
import { Point2D } from "./types";

export const createPoint2D = (arr: [any, any]): Point2D => [
  new BigDecimal(arr[0]),
  new BigDecimal(arr[1]),
];

export const arrayofNumberArrToPoint2D = (arr: [any, any][]) =>
  arr.map((numericArr) => createPoint2D(numericArr));

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

export const mapMatrixToString = (arr: Point2D[]): [string, string][] =>
  arr.map((point) => [point[0].toString(), point[1].toString()]);

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
  }: { down?: BigDecimal; right?: BigDecimal }
): Point2D[] =>
  arrOfPoints.map(([x, y]) => [
    new BigDecimal(x).add(right || 0),
    new BigDecimal(y).add(down || 0),
  ]);

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
export const quadraticBezier = (
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
export const cubicBezier = (
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
