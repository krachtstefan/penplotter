import { ElementType, NestedArray, Point2D } from "./types";
import { Node, RootNode, parse } from "svg-parser";
import { chunk, flattenDeep } from "lodash";

import BigDecimal from "decimal.js";

const isNodeElement = (_: any): _ is Node => {
  return typeof _ !== "string";
};
const test: (Node | string)[] = []; // TODO: remove this line 🚨
[...test.filter(isNodeElement).map((x) => console.log(x))];

class PenPlotter {
  elements: (RootNode | Node)[];
  supportedTypes: ElementType[];
  constructor(svg: string) {
    const svgObj = parse(svg);
    this.elements = this._getAllElements(svgObj);
    this.supportedTypes = Object.values(ElementType);
  }

  returnElementsByTagName(tagnames: ElementType | ElementType[]) {
    const tagnamesArr = typeof tagnames === "string" ? [tagnames] : tagnames;
    return this.elements.filter((e) => tagnamesArr.includes(e.tagName));
  }

  returnSupportedElements() {
    return this.returnElementsByTagName(this.supportedTypes);
  }

  _getAllElements = (obj: RootNode | Node): (RootNode | Node)[] => {
    const getChildren = (o: RootNode | Node): NestedArray<RootNode | Node> =>
      o.type !== "text" && o.children
        ? [o, ...o.children.filter(isNodeElement).map((x) => getChildren(x))]
        : [o];

    return flattenDeep(getChildren(obj));
  };
}

/**
 *  Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
 */
export const getLenghtByPoints = (
  [x1, y1]: [number | BigDecimal, number | BigDecimal],
  [x2, y2]: [number | BigDecimal, number | BigDecimal]
) => {
  const a = new BigDecimal(x1).sub(x2).abs().pow(2);
  const b = new BigDecimal(y1).sub(y2).abs().pow(2);
  return a.add(b).sqrt();
};

export const translateSVGPoints = (pointString: string) =>
  pointString
    .split(" ")
    .map((string) => string.split(",").map((x) => new BigDecimal(x)));

/**
 * example:
 *
 * convertPointsRelToAbs([1,2], [[2,3], [4,5]])
 * returns
 * [[3,5], [7,10]]
 */
const convertPointsRelToAbs = (startPnt: Point2D, arrOfPoints: Point2D[]) =>
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

const numberArrToPoint2D = (arr: [number, number]): Point2D => [
  new BigDecimal(arr[0]),
  new BigDecimal(arr[1]),
];

const arrayofNumberArrToPoint2D = (arr: [number, number][]) =>
  arr.map((numericArr) => numberArrToPoint2D(numericArr));

// current implementations:
// M35,0.75 L34.09375,2.5625
// M 382.49999 494.99999 L 384.55374 496.87223
export const translatePathString = (pathString) =>
  pathString
    .split(/ (?=[a-z|A-Z])/) // split by whitespaces that are followed by a character
    .reduce((acc, curr) => {
      const command = curr.slice(0, 1);
      // trim optional whitespace between command and split at whitespaces or commas
      const args = curr.slice(1).trim().split(/[,| ]/);
      let result = acc;
      const currentLine = acc.slice(-1)[0];
      const previouseLines = acc.slice(0, -1);
      switch (`${command}`) {
        case "M": // create a new element
        case "m": // relative version of M
          const newStartingPoint =
            command === "M"
              ? [numberArrToPoint2D(args)]
              : convertPointsRelToAbs(currentLine.slice(-1)[0], [
                  numberArrToPoint2D(args),
                ]);

          result = [...acc, newStartingPoint];
          break;
        case "Z": // close path command
        case "z": // relative version of Z
          const fistPoint = currentLine[0];
          const lastPoint = currentLine.slice(-1)[0];
          if (
            currentLine.length > 2 &&
            !fistPoint[0].eq(lastPoint[0]) &&
            !fistPoint[1].eq(lastPoint[1])
          ) {
            result = [
              ...previouseLines,
              [...currentLine, numberArrToPoint2D(fistPoint)],
            ];
          } else {
            console.warn(
              `Path was already closed, skipped ${command} command.`
            );
          }
          break;
        case "L": // L (line) command draws to a new coordinate
        case "l": // relative version of L
          let newLineSegment = arrayofNumberArrToPoint2D(chunk(args, 2));
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

          let newHorLineSegment = [numberArrToPoint2D(targetCoordinate)];
          if (isRelative) {
            newHorLineSegment = convertPointsRelToAbs(
              currentLine.slice(-1)[0],
              newHorLineSegment
            );
          }

          result = [...previouseLines, [...currentLine, ...newHorLineSegment]];
          break;
        default:
          console.error(
            `path command ${command} not supported yet (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)`
          );
          result = acc;
          break;
      }

      return result;
    }, []);

export const returnPointsArrFromElement = (element) => {
  switch (element.tagName) {
    case ElementType.polyline:
      return [translateSVGPoints(element.properties.points)];
    case ElementType.polygon:
      /**
       * polygon is like polyline, except the path is closed,
       * we need to copy the first coordinates
       */
      return [
        translateSVGPoints(
          `${element.properties.points} ${element.properties.points
            .split(" ")
            .slice(0, 2)
            .join(" ")}`
        ),
      ];

    case ElementType.line:
      const { x1, x2, y1, y2 } = element.properties;
      return [
        [
          [new BigDecimal(x1), new BigDecimal(y1)],
          [new BigDecimal(x2), new BigDecimal(y2)],
        ],
      ];
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
      return translatePathString(element.properties.d);
    default:
      return [];
  }
};

export const getPosition = (arrOfPointArrays) => {
  const allX = arrOfPointArrays.flat().map((p) => p[0]);
  const allY = arrOfPointArrays.flat().map((p) => p[1]);
  return {
    top: Math.max(...allY),
    left: Math.min(...allX),
  };
};

export const getDimensions = (arrOfPointArrays) => {
  const allX = arrOfPointArrays.flat().map((p) => p[0]);
  const allY = arrOfPointArrays.flat().map((p) => p[1]);
  return {
    width: Math.max(...allX) - Math.min(...allX),
    height: Math.max(...allY) - Math.min(...allY),
  };
};

export const scale = (arrOfPointArrays, factor) =>
  arrOfPointArrays.map((pA) =>
    pA.map(([x, y]) => [
      new BigDecimal(x).times(factor || 0).toNumber(),
      new BigDecimal(y).times(factor || 0).toNumber(),
    ])
  );

export const mirrorX = (arrOfPointArrays) =>
  arrOfPointArrays.map((pA) => pA.map(([x, y]) => [-x, y]));

export const mirrorY = (arrOfPointArrays) =>
  arrOfPointArrays.map((pA) => pA.map(([x, y]) => [x, -y]));

export const move = (arrOfPointArrays, { top, left }) =>
  arrOfPointArrays.map((pA) =>
    pA.map(([x, y]) => [
      new BigDecimal(x).add(left || 0).toNumber(),
      new BigDecimal(y).add(top || 0).toNumber(),
    ])
  );

export default PenPlotter;
