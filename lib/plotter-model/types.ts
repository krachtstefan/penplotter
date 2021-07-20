import { ElementNode, Node, RootNode } from "svg-parser";

import BigDecimal from "decimal.js";

export interface NestedArray<T> extends Array<T | NestedArray<T>> {}

export type Point2D = [BigDecimal, BigDecimal];
export type RotationSeq = [BigDecimal, BigDecimal];

export enum ElementType {
  polyline = "polyline",
  polygon = "polygon",
  line = "line",
  rect = "rect",
  path = "path",
  circle = "circle",
  ellipse = "ellipse",
}

export const isElementNode = (
  node: string | RootNode | Node
): node is ElementNode => typeof node !== "string" && node.type === "element";

export type processArgs = {
  command: string;
  args?: string[];
  lines: Point2D[][];
};

export type pathCommandImplementation = {
  command: string[];
  process: ({ command, args, lines }: processArgs) => Point2D[][];
};
