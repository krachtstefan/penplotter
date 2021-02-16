import React, { useEffect, useRef } from "react";

import type { Material } from "three";

interface OrbitRef {
  material: Material;
}

const Grid: React.FC = () => {
  const gridRef = useRef<OrbitRef>();

  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.material.opacity = 0.25;
      gridRef.current.material.transparent = true;
    }
  }, []);

  return <gridHelper ref={gridRef} args={[200, 40]} />;
};

export default Grid;
