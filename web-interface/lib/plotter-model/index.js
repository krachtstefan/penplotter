import BigDecimal from "decimal.js";
import { parse } from "svg-parser";

class PenPlotter {
  constructor(svg) {
    const svgObj = parse(svg);
    this.elements = this._getAllElements(svgObj);
  }

  returnElementsByTagName = function (tagName) {
    return this.elements.filter((e) => e.tagName === tagName);
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
    case "polyline":
      return translateSVGPoints(element.properties.points);
    case "polygon":
      /**
       * polygon is like polyline, except the path is closed,
       * we need to copy the first coordinates
       */
      return translateSVGPoints(
        `${element.properties.points} ${element.properties.points
          .split(" ")
          .slice(0, 2)
          .join(" ")}`
      );

    case "line":
      const { x1, x2, y1, y2 } = element.properties;
      return [
        [x1, y1],
        [x2, y2],
      ];
    default:
      return [];
  }
};

export const getDimensions = (arrOfPoints) => {
  const allX = arrOfPoints.map((p) => p[0]);
  const allY = arrOfPoints.map((p) => p[1]);
  return {
    width: Math.max(...allX) - Math.min(...allX),
    height: Math.max(...allY) - Math.min(...allY),
  };
};

export default PenPlotter;
