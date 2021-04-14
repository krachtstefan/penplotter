import ControlPanel from "../components/ControlPanel";
import { PenplotterProvider } from "../contexts/Penplotter";
import React from "react";
import dynamic from "next/dynamic";

const PlotterPreview = dynamic(() => import("../components/PlotterPreview"), {
  ssr: false,
});

const Home = () => (
  <PenplotterProvider>
    <ControlPanel />
    <PlotterPreview />
  </PenplotterProvider>
);

export default Home;
