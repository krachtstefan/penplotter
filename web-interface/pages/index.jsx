import * as THREE from "three";

import React, { useRef } from "react";

import { Canvas } from "react-three-fiber";
import Grid from "../components/Grid";
import Triangle from "../components/Triangle";
import dynamic from "next/dynamic";

const Controls = dynamic(() => import("../components/Controls"), {
  ssr: false,
});


const Home = () => (
  <Canvas
    camera={{ position: [100, 100, -100] }}
    onCreated={({ gl }) => gl.setClearColor("#f0f0f0")}
  >
    <ambientLight intensity={0.5} />
    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
    <pointLight position={[-10, -10, -10]} />
    <Triangle
      vertices={[
        new THREE.Vector3(-20, 0, 0),
        new THREE.Vector3(20, 0, 0),
        new THREE.Vector3(0, -50, 0),
      ]}
    />
    <Grid rotation={{ z: -90 }} />
    <Controls />
  </Canvas>
);

export default Home;
