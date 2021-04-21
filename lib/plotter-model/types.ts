import BigDecimal from "decimal.js";

export interface NestedArray<T> extends Array<T | NestedArray<T>> {}

export type Point2D = [BigDecimal, BigDecimal];

export enum ElementType {
  polyline = "polyline",
  polygon = "polygon",
  line = "line",
  rect = "rect",
  path = "path",
}
