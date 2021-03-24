import React from "react";
import dynamic from "next/dynamic";

const PenPlotter = dynamic(() => import("../components/PenPlotter"), {
  ssr: false,
});

const Home = () => (
  <>
    <PenPlotter />
  </>
);

export default Home;
