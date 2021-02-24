import * as THREE from "three";

import React, { useState } from "react";
import { getLenghtByPoints, parseSVG } from "../lib/plotter-model";

import { Canvas } from "react-three-fiber";
import Grid from "../components/Grid";
import Triangle from "../components/Triangle";
import config from "../config";
import dynamic from "next/dynamic";
import { useSpring } from "react-spring/three.cjs";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/example.svg", "utf8")`;
console.log(parseSVG(svgFile));

const Controls = dynamic(() => import("../components/Controls"), {
  ssr: false,
});

const defaultUpperLeft: [number, number] = [-config.cylinder.distance / 2, 0];
const defaultUpperRight: [number, number] = [config.cylinder.distance / 2, 0];
const defaultPenPosition: [number, number] = [0, -config.pen.topDistance];

const Home = () => {
  const [upperLeft, setUpperLeft] = useState(defaultUpperLeft);
  const [upperRight, setUpperRight] = useState(defaultUpperRight);

  const [penPosition, setPenPosition] = useState(defaultPenPosition);

  getLenghtByPoints(upperLeft, penPosition);

  useSpring({
    from: {
      z: [0, 0],
    },
    z: defaultPenPosition,
    config: {
      duration: 1000,
    },
    onFrame: ({ z }) => {
      setPenPosition(z);
    },
  });

  return (
    <>
      <Canvas camera={{ position: [-20, 0, -75] }}>
        <group position={[0, 30, 0]}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Triangle
            vertices={[
              new THREE.Vector3(...upperLeft, 0),
              new THREE.Vector3(...upperRight, 0),
              new THREE.Vector3(...penPosition, 0),
            ]}
          />

          <Grid />
        </group>
        <Controls />
      </Canvas>
    </>
  );
};

export default Home;
