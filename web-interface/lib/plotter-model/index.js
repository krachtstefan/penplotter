import BigDecimal from "decimal.js";
import { parse } from "svg-parser";

// /**
//  *  Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
//  */
// export const getLenghtByPoints = ([x1, y1], [x2, y2]) => {
//   const a = new BigDecimal(x1).sub(x2).abs().pow(2);
//   const b = new BigDecimal(y1).sub(y2).abs().pow(2);
//   return a.add(b).sqrt();
// };

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

export default PenPlotter;
