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

// https://www.geogebra.org/graphing/h7sktqg2
export const rotate = (
  point: Point2D, // p
  degree: BigDecimal,
  origin: Point2D = [new BigDecimal(0), new BigDecimal(0)] // o
): Point2D => {
  // α = radian version of degree = (degree * -2 * pi) / 360
  const angle = degree.times(Math.PI).times(-2).div(360);

  // x = cos(α) * (px-ox) - sin(α) * (py-oy) + ox
  const x = angle
    .cos()
    .times(point[0].minus(origin[0]))
    .minus(angle.sin().times(point[1].minus(origin[1])))
    .plus(origin[0]);

  // y = sind(α) * (px-ox) + cos(α) * (py-oy) + oy
  const y = angle
    .sin()
    .times(point[0].minus(origin[0]))
    .plus(angle.cos().times(point[1].minus(origin[1])))
    .plus(origin[1]);

  return [x, y];
};

// https://www.geogebra.org/graphing/axnnmxsp
export const ellipse = (
  [center, xRadius, yRadius]: [Point2D, BigDecimal, BigDecimal], // [c, xr, yr]
  fraction: BigDecimal,
  upper: Boolean = true
): Point2D => {
  // get x value
  const left = move([center], { right: xRadius.times(-1) });
  const right = move([center], { right: xRadius });
  const x = getPointFromLineSegment(
    left[0],
    right[0],
    fraction.div(100).toNumber()
  );
  const scale = yRadius.div(xRadius);

  // function for upper and lower ellipse, plus is upper, minus is lower
  // f(x) = +-scale * sqrt(xr^(2)-(x-cx))^(2))+cy

  const circle = xRadius.toPower(2).minus(x[0].minus(center[0]).toPower(2));
  const y = scale
    .times(circle.squareRoot())
    .plus(center[1])
    .times(upper ? 1 : -1);

  return [x[0], y];
};

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
): Point2D =>
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
