import React, { useRef } from "react";
import { extend, useFrame, useThree } from "react-three-fiber";

import type { Camera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ReactThreeFiber } from "react-three-fiber";

extend({ OrbitControls });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<
        OrbitControls,
        typeof OrbitControls
      >;
    }
  }
}

interface OrbitRef {
  update: Function;
}

const Controls: React.FC = () => {
  const ref = useRef<OrbitRef>();
  const { camera, gl } = useThree();

  useFrame(() => {
    if (ref && ref.current) {
      ref.current.update();
    }
  });
  return (
    <orbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      autoRotate={false}
      enableDamping
      dampingFactor={0.05}
      screenSpacePanning={false}
    />
  );
};

export default Controls;
