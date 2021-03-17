import BigDecimal from "decimal.js";
import { parse } from "svg-parser";

const TYPES = {
  polyline: "polyline",
  polygon: "polygon",
  line: "line",
  rect: "rect",
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

export const returnPointsFromElement = (element) => {
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
      return translatePathPoints(element.properties.d);
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
