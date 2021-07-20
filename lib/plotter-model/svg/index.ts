import { ElementNode, Node, RootNode, parse } from "svg-parser";
import { ElementType, NestedArray, Point2D, isElementNode } from "../types";
import { chunk, flattenDeep } from "lodash";

import BigDecimal from "decimal.js";
import { ellipse } from "../math";
import { translatePathString } from "./path";

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
      case ElementType.circle:
        const { cx, cy, r } = element.properties;
        if (cx && cy && r) {
          const sampleSize = 101;
          const center: Point2D = [new BigDecimal(cx), new BigDecimal(cy)];
          const radius = new BigDecimal(r);
          return [
            [...new Array(sampleSize)].map((x, i) =>
              ellipse([center, radius, radius], new BigDecimal(i), false)
            ),
            [...new Array(sampleSize)].map((x, i) =>
              ellipse([center, radius, radius], new BigDecimal(i))
            ),
          ];
        }
        console.error(`${ElementType.circle} has missing properties`);
        return [];
      default:
        return [];
    }
  }
  console.error(`properties are missing for ${element.tagName}`);
  return [];
};

export default SvgParser;
