import * as THREE from "three";

import React, { useMemo } from "react";

import type { Vector3 } from "three";

type TriangleProps = {
  vertices: [Vector3, Vector3, Vector3];
};

const Triangle: React.FC<TriangleProps> = ({ vertices }) => {
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
        wireframe={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Triangle;
