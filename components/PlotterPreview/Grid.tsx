import React, { useEffect, useRef } from "react";

import { GridHelperProps } from "react-three-fiber";

const Grid: React.FC = () => {
  const gridRef = useRef<GridHelperProps>();

  useEffect(() => {
    if (
      gridRef &&
      gridRef.current &&
      gridRef.current.material &&
      !Array.isArray(gridRef.current.material) &&
      gridRef.current.rotateX
    ) {
      gridRef.current.material.opacity = 0.1;
      gridRef.current.material.transparent = true;
      gridRef.current.rotateX(Math.PI / 2);
    }
  }, []);

  return <gridHelper ref={gridRef} args={[5000, 5000 / 20, "black", "grey"]} />;
};

export default Grid;
