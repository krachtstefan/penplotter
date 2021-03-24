import * as THREE from "three";

import PenPlotter, {
  getDimensions,
  getLenghtByPoints,
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
import { useControls } from "leva";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
const parsedSvg = new PenPlotter(svgFile);

const Controls = dynamic(() => import("./Controls"), { ssr: false });

const elementsToDraw = parsedSvg
  .returnSupportedElements()
  .map((pl) => returnPointsArrFromElement(pl))
  .flat();

const { width, height } = getDimensions(elementsToDraw);

const Penplotter = () => {
  const { gridEnabled } = useControls("Settings", {
    gridEnabled: {
      value: true,
      label: "grid",
    },
  });
  const { boardWidth, boardHeight } = useControls("Board", {
    boardWidth: {
      value: config.board.width,
      min: 0,
      max: 1500,
      label: "width",
    },
    boardHeight: {
      value: config.board.height,
      min: 0,
      max: 1500,
      label: "height",
    },
  });
  const { cylinderDistance } = useControls("Cylinder", {
    cylinderDistance: {
      value: config.cylinder.distance,
      min: 0,
      max: 1000,
      label: "distance",
    },
  });
  const { paperWidth, paperHeight, paperTopDistance } = useControls("Paper", {
    paperWidth: {
      value: config.paper.width,
      min: 0,
      max: 500,
      label: "width",
    },
    paperHeight: {
      value: config.paper.height,
      min: 0,
      max: 500,
      label: "height",
    },
    paperTopDistance: {
      value: config.paper.topDistance,
      min: 0,
      max: 500,
      label: "distance",
    },
  });

  const scaling = Math.min(
    ...[
      new BigDecimal(paperWidth).div(new BigDecimal(width)).toNumber(),
      new BigDecimal(paperHeight).div(new BigDecimal(height)).toNumber(),
    ]
  );

  // add projection
  const mirroredY = mirrorY(elementsToDraw);
  const scaled = scale(mirroredY, scaling);
  const { top, left } = getPosition(scaled);
  const { width: scaledWidth, height: scaledHeight } = getDimensions(scaled);

  const moved = move(scaled, {
    top: -top - paperTopDistance - (paperHeight - scaledHeight) / 2,
    left: -left - paperWidth / 2 + (paperWidth - scaledWidth) / 2,
  });

  const upperLeft = [-cylinderDistance / 2, 0];
  const upperRight = [cylinderDistance / 2, 0];

  const penPositions = moved.flat();

  const lengthSequence = penPositions.map((pos) => [
    getLenghtByPoints(upperLeft, pos),
    getLenghtByPoints(upperRight, pos),
  ]);

  const lengthChangeSequence = lengthSequence.map((co, i, srcArr) =>
    i > 0
      ? [srcArr[i - 1][0].minus(co[0]), srcArr[i - 1][1].minus(co[1])]
      : [new BigDecimal(0), new BigDecimal(0)]
  );

  const rotationDegSequence = lengthChangeSequence.map((x) => [
    x[0].div(config.cylinder.circumference).times(360).toNumber(),
    x[1].div(config.cylinder.circumference).times(360).toNumber(),
  ]);

  console.log(rotationDegSequence);

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
        <group position={[0, paperHeight, 0]}>
          <Material
            width={boardWidth}
            height={boardHeight}
            center={[0, -boardHeight / 2, 0]}
            zPosition={-2}
            color={"#e1e4e8"}
          />
          <Material
            width={paperWidth}
            height={paperHeight}
            center={[0, -paperHeight / 2 - paperTopDistance, 0]}
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
                new THREE.Vector3(...upperLeft, 3),
                new THREE.Vector3(penX, penPositionY.payload[0].value, 3),
                new THREE.Vector3(...upperRight, 3),
              ])
            )}
          >
            <lineBasicMaterial attach="material" color="#444c56" />
          </animated.line>

          {gridEnabled ? <Grid /> : null}
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Penplotter;
