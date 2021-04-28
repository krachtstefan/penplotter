import * as THREE from "three";

import React, { useMemo } from "react";

const Paper = ({
  width = 20,
  height = 20,
  center = [0, 0, 0],
  zPosition = 0,
  color = "white",
}): React.FC => {
  const f32array = useMemo(() => {
    const vertices = [
      new THREE.Vector3(-width / 2, -height / 2, zPosition),
      new THREE.Vector3(width / 2, -height / 2, zPosition),
      new THREE.Vector3(width / 2, height / 2, zPosition),
      new THREE.Vector3(width / 2, height / 2, zPosition),
      new THREE.Vector3(-width / 2, height / 2, zPosition),
      new THREE.Vector3(-width / 2, -height / 2, zPosition),
    ];

    return Float32Array.from(
      new Array(vertices.length).fill().flatMap((_, i) => vertices[i].toArray())
    );
  }, [width, height]);

  return (
    <mesh position={center}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attachObject={["attributes", "position"]}
          args={[f32array, 3]}
        />
      </bufferGeometry>
      <meshBasicMaterial
        attach="material"
        color={color}
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Paper;
