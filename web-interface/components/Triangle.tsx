import * as THREE from "three";

import React, { useMemo } from "react";

const Triangle = ({ vertices }) => {
  const f32array = useMemo(
    () =>
      Float32Array.from(
        new Array(vertices.length)
          .fill(null)
          .flatMap((_, index) => vertices[index].toArray())
      ),
    [vertices]
  );

  return (
    <mesh position={[0, 0, 0]}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attachObject={["attributes", "position"]}
          args={[f32array, 3]}
        />
      </bufferGeometry>
      <meshBasicMaterial
        attach="material"
        color="#5243aa"
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Triangle;
