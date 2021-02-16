import React, { useEffect, useRef } from "react";

import { GridHelperProps } from "react-three-fiber";

const Grid: React.FC = () => {
  const gridRef = useRef<GridHelperProps>();

  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.material.opacity = 0.25;
      gridRef.current.material.transparent = true;
      gridRef.current.rotateX(Math.PI / 2);
    }
  }, []);

  return <gridHelper ref={gridRef} args={[150, 150, "black", "grey"]} />;
};

export default Grid;
