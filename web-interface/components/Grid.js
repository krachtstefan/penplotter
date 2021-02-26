import React, { useEffect, useRef } from "react";

const Grid = () => {
  const gridRef = useRef();

  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.material.opacity = 0.25;
      gridRef.current.material.transparent = true;
      gridRef.current.rotateX(Math.PI / 2);
    }
  }, []);

  return <gridHelper ref={gridRef} args={[150, 50, "black", "grey"]} />;
};

export default Grid;
