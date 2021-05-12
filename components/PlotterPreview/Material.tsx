import { Color, Vector3 } from "react-three-fiber";

import React from "react";

const Material: React.FC<{
  width: number;
  height: number;
  center: Vector3;
  color: Color;
}> = ({ width = 20, height = 20, center = [0, 0, 0], color = "white" }) => {
  return (
    <mesh position={center}>
      <planeBufferGeometry attach="geometry" args={[width, height]} />
      <meshToonMaterial attach="material" color={color} />
    </mesh>
  );
};

export default Material;
