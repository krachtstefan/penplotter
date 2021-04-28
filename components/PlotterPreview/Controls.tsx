import React, { useRef } from "react";
import { ReactThreeFiber, extend, useFrame, useThree } from "react-three-fiber";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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

const Controls: React.FC = () => {
  const ref = useRef<OrbitControls>();
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
