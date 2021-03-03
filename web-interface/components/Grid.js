import React, { useEffect, useRef } from "react";

const Grid = ({ size }) => {
  const gridRef = useRef();

  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.material.opacity = 0.2;
      gridRef.current.material.transparent = true;
      gridRef.current.rotateX(Math.PI / 2);
    }
  }, []);

  return <gridHelper ref={gridRef} args={[5000, 5000 / 20, "black", "grey"]} />;
};

export default Grid;
