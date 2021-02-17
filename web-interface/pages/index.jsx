import * as THREE from "three";

import React, {
  createRef,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

import { Canvas } from "react-three-fiber";
import Grid from "../components/Grid";
import Triangle from "../components/Triangle";
import config from "../config";
import dynamic from "next/dynamic";

const Controls = dynamic(() => import("../components/Controls"), {
  ssr: false,
});

const Home = () => {
  const [upperLeft, setUpperLeft] = useState([
    -config.cylinder.distance / 2,
    0,
    0,
  ]);
  const [upperRight, setUpperRight] = useState([
    config.cylinder.distance / 2,
    0,
    0,
  ]);

  const [penPosition, setPenPosition] = useState([
    0,
    -config.pen.topDistance,
    0,
  ]);
  return (
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
  );
};

export default Home;
