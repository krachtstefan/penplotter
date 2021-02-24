import * as THREE from "three";

import { animated, useSpring } from "react-spring/three.cjs";

import { Canvas } from "react-three-fiber";
import Grid from "../components/Grid";
import React from "react";
import config from "../config";
import dynamic from "next/dynamic";
import { parseSVG } from "../lib/plotter-model";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
console.log(parseSVG(svgFile));

const Controls = dynamic(() => import("../components/Controls"), {
  ssr: false,
});

const defaultUpperLeft: [number, number] = [-config.cylinder.distance / 2, 0];
const defaultUpperRight: [number, number] = [config.cylinder.distance / 2, 0];

const penPositions = [...Array(100)].map(() => [
  -config.pen.topDistance * Math.random() + config.pen.topDistance / 2,
  -config.pen.topDistance * Math.random(),
]);

const Home = () => {
  const { penPosition } = useSpring({
    from: {
      penPosition: [0, 0],
    },
    to: penPositions.map((penPosition) => ({ penPosition })),
  });

  return (
    <>
      <Canvas camera={{ position: [-20, 0, -75] }}>
        <group position={[0, 30, 0]}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <animated.line
            geometry={penPosition.interpolate((penX, penY) =>
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...defaultUpperLeft, 0),
                new THREE.Vector3(penX, penY, 0),
                new THREE.Vector3(...defaultUpperRight, 0),
              ])
            )}
          >
            <animated.lineBasicMaterial attach="material" color="pink" />
          </animated.line>
          <Grid />
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Home;
