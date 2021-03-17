import * as THREE from "three";

import PenPlotter, {
  getDimensions,
  getPosition,
  mirrorY,
  move,
  returnPointsArrFromElement,
  scale,
} from "../lib/plotter-model";
import { animated, useSpring } from "react-spring/three.cjs";

import BigDecimal from "decimal.js";
import { Canvas } from "react-three-fiber";
import Grid from "./Grid";
import Material from "./Material";
import React from "react";
import config from "../config";
import dynamic from "next/dynamic";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
const parsedSvg = new PenPlotter(svgFile);

const Controls = dynamic(() => import("./Controls"), { ssr: false });

const elementsToDraw = parsedSvg
  .returnSupportedElements()
  .map((pl) => returnPointsArrFromElement(pl))
  .flat();

const { width, height } = getDimensions(elementsToDraw);
const scaling = Math.min(
  ...[
    new BigDecimal(config.paper.width).div(new BigDecimal(width)).toNumber(),
    new BigDecimal(config.paper.height).div(new BigDecimal(height)).toNumber(),
  ]
);

// add projection
const mirroredY = mirrorY(elementsToDraw);
const scaled = scale(mirroredY, scaling);
const { top, left } = getPosition(scaled);
const { width: scaledWidth, height: scaledHeight } = getDimensions(scaled);

const moved = move(scaled, {
  top:
    -top - config.paper.topDistance - (config.paper.height - scaledHeight) / 2,
  left: -left - config.paper.width / 2 + (config.paper.width - scaledWidth) / 2,
});

const defaultUpperLeft = [-config.cylinder.distance / 2, 0];
const defaultUpperRight = [config.cylinder.distance / 2, 0];

const penPositions = moved.flat();

const Penplotter = () => {
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
  });

  return (
    <>
      <Canvas
        camera={{ position: [20 * 10, 0, 75 * 10] }}
        onCreated={({ gl }) => gl.setClearColor("white")}
      >
        <group position={[0, config.paper.height, 0]}>
          <Material
            width={config.board.width}
            height={config.board.height}
            center={[0, -config.board.height / 2, 0]}
            zPosition={-2}
            color={"#e1e4e8"}
          />
          <Material
            width={config.paper.width}
            height={config.paper.height}
            center={[0, -config.paper.height / 2 - config.paper.topDistance, 0]}
            zPosition={-1}
            color={"white"}
          />

          {moved.map((el, i) => (
            <line
              key={i}
              geometry={new THREE.BufferGeometry().setFromPoints(
                el.map((point) => new THREE.Vector3(point[0], point[1], 2))
              )}
            >
              <lineBasicMaterial attach="material" color="#444c56" />
            </line>
          ))}
          <animated.line
            geometry={penPositionX.interpolate((penX) =>
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...defaultUpperLeft, 3),
                new THREE.Vector3(penX, penPositionY.payload[0].value, 3),
                new THREE.Vector3(...defaultUpperRight, 3),
              ])
            )}
          >
            <lineBasicMaterial attach="material" color="#444c56" />
          </animated.line>

          <Grid />
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Penplotter;
