import BigDecimal from "decimal.js";
import { parse } from "svg-parser";

const TYPES = {
  polyline: "polyline",
  polygon: "polygon",
  line: "line",
  rect: "rect",
  path: "path",
};

class PenPlotter {
  constructor(svg) {
    const svgObj = parse(svg);
    this.elements = this._getAllElements(svgObj);
    this.supportedTypes = [
      TYPES.polyline,
      TYPES.polygon,
      TYPES.line,
      TYPES.rect,
      TYPES.path,
    ];
  }

  returnElementsByTagName = function (tagnames) {
    const tagnamesArr = typeof tagnames === "string" ? [tagnames] : tagnames;
    return this.elements.filter((e) => tagnamesArr.includes(e.tagName));
  };

  returnSupportedElements = function () {
    return this.returnElementsByTagName(this.supportedTypes);
  };

  _getAllElements = (obj) => {
    const getChildren = (o) =>
      o.children
        ? [{ ...o, children: null }, ...o.children.map((x) => getChildren(x))]
        : o;
    return getChildren(obj).flat(99);
  };
}

/**
 *  Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
 */
export const getLenghtByPoints = ([x1, y1], [x2, y2]) => {
  const a = new BigDecimal(x1).sub(x2).abs().pow(2);
  const b = new BigDecimal(y1).sub(y2).abs().pow(2);
  return a.add(b).sqrt();
};

export const translateSVGPoints = (pointString) =>
  pointString
    .split(" ")
    .map((string) => new BigDecimal(string).toNumber())
    .reduce((acc, curr, i) => {
      const isX = i % 2 === 0;
      if (isX) {
        return [...acc, curr]; // [[x1,y1], x2]
      } else {
        return [...acc.slice(0, -1), [acc.slice(-1)[0], curr]]; // [[x1,y1], [x2, y2]]
      }
    }, []);

/**
 * example:
 *
 * convertPointsRelToAbs([1,2], [[2,3], [4,5]])
 * returns
 * [[3,5], [7,10]]
 */
const convertPointsRelToAbs = (startPnt, arrOfPoints) =>
  arrOfPoints
    .reduce(
      (acc, curr) => [
        ...acc,
        [
          new BigDecimal(acc.slice(-1)[0][0]).add(curr[0]),
          new BigDecimal(acc.slice(-1)[0][1]).add(curr[1]),
        ],
      ],
      [startPnt]
    )
    .slice(1);

const mapCoordinatesToBigDec = (arr) =>
  arr.map((numeric) => new BigDecimal(numeric));

const mapArrOfCoordinatesToBigDec = (arr) =>
  arr.map((numericArr) => mapCoordinatesToBigDec(numericArr));

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
          result = [...acc, [mapCoordinatesToBigDec(args)]];
          break;
        case "Z": // close path command
          const fistPoint = currentLine[0];
          const lastPoint = currentLine.slice(-1)[0];
          if (
            currentLine.length > 2 &&
            fistPoint[0] !== lastPoint[0] &&
            fistPoint[1] !== lastPoint[1]
          ) {
            result = [
              ...previouseLines,
              [...currentLine, mapCoordinatesToBigDec(fistPoint)],
            ];
          } else {
            console.warn(
              `Path was already closed, skipped ${command} command.`
            );
          }
          break;
        case "L": // L (line) command draws to a new coordinate
        case "l": // relative version of L
          let newLineSegment = mapArrOfCoordinatesToBigDec(chunk(args, 2));
          if (command === "l") {
            newLineSegment = convertPointsRelToAbs(
              currentLine.slice(-1)[0],
              newLineSegment
            );
          }
          result = [...previouseLines, [...currentLine, ...newLineSegment]];
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

  // console.log(test);
  return test;
};

export const returnPointsArrFromElement = (element) => {
  switch (element.tagName) {
    case TYPES.polyline:
      return [translateSVGPoints(element.properties.points)];
    case TYPES.polygon:
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

    case TYPES.line:
      const { x1, x2, y1, y2 } = element.properties;
      return [
        [
          [x1, y1],
          [x2, y2],
        ],
      ];
    case TYPES.rect:
      const { x, y, width, height } = element.properties;
      return [
        [
          [x, y],
          [x + width, y],
          [x + width, y + height],
          [x, y + height],
          [x, y],
        ],
      ];
    case TYPES.path:
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
