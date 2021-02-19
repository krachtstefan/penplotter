import * as THREE from "three";

import React, { useState } from "react";

import { Canvas } from "react-three-fiber";
import Grid from "../components/Grid";
import Triangle from "../components/Triangle";
import config from "../config";
import dynamic from "next/dynamic";
import { getLenghtByPoints } from "../../lib/plotter-model";
import { useSpring } from "react-spring/three.cjs";

const Controls = dynamic(() => import("../components/Controls"), {
  ssr: false,
});

const defaultUpperLeft = [-config.cylinder.distance / 2, 0, 0];
const defaultUpperRight = [config.cylinder.distance / 2, 0, 0];
const defaultPenPosition = [0, -config.pen.topDistance, 0];

const Home = () => {
  const [upperLeft, setUpperLeft] = useState(defaultUpperLeft);
  const [upperRight, setUpperRight] = useState(defaultUpperRight);

  const [penPosition, setPenPosition] = useState(defaultPenPosition);

  getLenghtByPoints(upperLeft, penPosition);

  useSpring({
    from: {
      z: [0, 0, 0],
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
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Triangle
          vertices={[
            new THREE.Vector3(...upperLeft),
            new THREE.Vector3(...upperRight),
            new THREE.Vector3(...penPosition),
          ]}
        />
        <Grid rotation={{ z: -90 }} />
        <Controls />
      </Canvas>
    </>
  );
};

export default Home;
