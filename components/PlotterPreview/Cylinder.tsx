import { MeshProps, Vector3 } from "react-three-fiber";
import React, { useEffect, useRef } from "react";

const Cylinder: React.FC<{ diameter: number; center: Vector3 }> = ({
  diameter = 100,
  center = [0, 0, 0],
}) => {
  const cylinderRef = useRef<MeshProps>();
  useEffect(() => {
    if (cylinderRef && cylinderRef.current && cylinderRef.current.rotateX) {
      cylinderRef.current.rotateX(Math.PI / 2);
    }
  }, []);
  return (
    <mesh position={center} ref={cylinderRef}>
      <cylinderBufferGeometry
        attach="geometry"
        args={[diameter, diameter, diameter, 100]}
      />
      <meshToonMaterial attach="material" color={"silver"} />
    </mesh>
  );
};

export default Cylinder;
