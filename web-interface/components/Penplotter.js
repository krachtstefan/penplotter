import * as THREE from "three";

import { Canvas, useResource } from "react-three-fiber";
import PenPlotter, {
  getDimensions,
  getPosition,
  move,
  returnPointsFromElement,
  scale,
} from "../lib/plotter-model";
import { animated, useSpring } from "react-spring/three.cjs";

import BigDecimal from "decimal.js";
import Grid from "./Grid";
import Paper from "./Paper";
import React from "react";
import chunk from "lodash.chunk";
import config from "../config";
import dynamic from "next/dynamic";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
const parsedSvg = new PenPlotter(svgFile);

const Controls = dynamic(() => import("./Controls"), {
  ssr: false,
});

const allElements = parsedSvg
  .returnSupportedElements()
  .map((pl) => returnPointsFromElement(pl));

const { width, height } = getDimensions(allElements);
const scaling = Math.min(
  ...[
    new BigDecimal(config.paper.width).div(new BigDecimal(width)).toNumber(),
    new BigDecimal(config.paper.height).div(new BigDecimal(height)).toNumber(),
  ]
);

const allElementsScaled = scale(allElements, scaling);
const { top, left } = getPosition(allElementsScaled);
const { width: scaledWidth, height: scaledHeight } = getDimensions(
  allElementsScaled
);

const allElementsMoved = move(allElementsScaled, {
  top:
    -top - config.paper.topDistance - (config.paper.height - scaledHeight) / 2,
  left: -left - scaledWidth / 2,
});

const defaultUpperLeft = [-config.cylinder.distance / 2, 0];
const defaultUpperRight = [config.cylinder.distance / 2, 0];

const penPositions = allElementsMoved.flat();

const Penplotter = () => {
  const ref = useResource();
  const { penPositionX, penPositionY } = useSpring({
    from: {
      penPositionX: [penPositions[0][0]],
      penPositionY: [penPositions[0][1]],
    },
    to: penPositions.slice(1).map((penPosition) => {
      return {
        penPositionX: penPosition[0],
        penPositionY: penPosition[1],
      };
    }),
    delay: 1000,
    config: { duration: 150 },
  });

  return (
    <>
      <Canvas camera={{ position: [20 * 10, 0, 75 * 10] }}>
        <group position={[0, 0, 0]}>
          <Paper
            width={config.paper.width}
            height={config.paper.height}
            center={[0, -config.paper.height / 2 - config.paper.topDistance, 0]}
          />
          {allElements.map((el, i) => {
            return (
              <line
                key={i}
                geometry={new THREE.BufferGeometry().setFromPoints(
                  el.map((point) => new THREE.Vector3(point[0], point[1], 0))
                )}
              >
                <lineBasicMaterial attach="material" color="black" />
              </line>
            );
          })}
          <animated.line
            geometry={penPositionX.interpolate((penX) => {
              if (ref.current) {
                let points = [];
                if (
                  ref.current.geometry.attributes &&
                  ref.current.geometry.attributes.position
                ) {
                  points = chunk(
                    ref.current.geometry.attributes.position.array,
                    3
                  ).map(([x, y, z]) => new THREE.Vector3(x, y, z));
                }
                points.push(
                  new THREE.Vector3(penX, penPositionY.payload[0].value, 0)
                );
                ref.current.geometry.setFromPoints(points);
              }

              return new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...defaultUpperLeft, 0),
                new THREE.Vector3(penX, penPositionY.payload[0].value, 0),
                new THREE.Vector3(...defaultUpperRight, 0),
              ]);
            })}
          >
            <lineBasicMaterial attach="material" color="grey" />
          </animated.line>
          {/* <line ref={ref}>
            <lineBasicMaterial attach="material" color="green" />
          </line> */}
          <Grid />
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Penplotter;
