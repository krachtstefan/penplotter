import React, { useRef } from "react";
import { extend, useFrame, useThree } from "react-three-fiber";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

extend({ OrbitControls });

const Controls = () => {
  const orbitRef = useRef();
  const { camera, gl } = useThree();

  useFrame(() => {
    if (orbitRef && orbitRef.current) {
      orbitRef.current.update();
    }
  });
  return (
    <orbitControls
      ref={orbitRef}
      args={[camera, gl.domElement]}
      autoRotate={false}
      enableDamping
      dampingFactor={0.05}
      screenSpacePanning={false}
    />
  );
};

export default Controls;
