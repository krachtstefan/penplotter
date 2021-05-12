import React, { useEffect, useRef } from "react";

import { MeshProps } from "react-three-fiber";

const Cylinder = ({ diameter = 100, position = [0, 0, 0] }): React.FC => {
  const cylinderRef = useRef<MeshProps>();
  useEffect(() => {
    if (cylinderRef && cylinderRef.current && cylinderRef.current.rotateX) {
      cylinderRef.current.rotateX(Math.PI / 2);
    }
  }, []);
  return (
    <mesh position={position} ref={cylinderRef}>
      <cylinderBufferGeometry
        attach="geometry"
        args={[diameter, diameter, diameter, 100]}
      />
      <meshToonMaterial attach="material" color={"silver"} />
    </mesh>
  );
};

export default Cylinder;
