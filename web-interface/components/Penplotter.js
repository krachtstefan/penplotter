import * as THREE from "three";

import { Canvas, useResource } from "react-three-fiber";
import { animated, useSpring } from "react-spring/three.cjs";

import Grid from "./Grid";
import React from "react";
import chunk from "lodash.chunk";
import config from "../config";
import dynamic from "next/dynamic";
import { parseSVG } from "../lib/plotter-model";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
console.log(parseSVG(svgFile));

const Controls = dynamic(() => import("./Controls"), {
  ssr: false,
});

const defaultUpperLeft = [-config.cylinder.distance / 2, 0];
const defaultUpperRight = [config.cylinder.distance / 2, 0];

const penPositions = [...Array(100)].map(() => [
  -config.pen.topDistance * Math.random() + config.pen.topDistance / 2,
  -config.pen.topDistance * Math.random(),
]);

const Penplotter = () => {
  const ref = useResource();
  const { penPositionX, penPositionY } = useSpring({
    from: {
      penPositionX: [0],
      penPositionY: [0],
    },
    to: penPositions.map((penPosition) => ({
      penPositionX: penPosition[0],
      penPositionY: penPosition[1],
    })),
  });

  return (
    <>
      <Canvas camera={{ position: [-20, 0, -75] }}>
        <group position={[0, 30, 0]}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

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
            <lineBasicMaterial
              linewidth={200}
              attach="material"
              color="black"
            />
          </animated.line>

          <line ref={ref}>
            <lineBasicMaterial attach="material" color="green" />
          </line>

          <Grid />
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Penplotter;
