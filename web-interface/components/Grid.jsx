import React, { useEffect, useRef } from "react";

const Grid = () => {
  const gridRef = useRef();

  useEffect(() => {
    if (gridRef && gridRef.current) {
      gridRef.current.material.opacity = 0.25;
      gridRef.current.material.transparent = true;
    }
  }, []);

  return <gridHelper ref={gridRef} args={[200, 40]} />;
};

export default Grid;
