import React from "react";

const Material = ({
  width = 20,
  height = 20,
  center = [0, 0, 0],
  color = "white",
}): React.FC => {
  return (
    <mesh position={center}>
      <planeBufferGeometry attach="geometry" args={[width, height]} />
      <meshToonMaterial attach="material" color={color} />
    </mesh>
  );
};

export default Material;
