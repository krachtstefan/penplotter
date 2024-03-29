import ControlPanel from "../components/ControlPanel";
import { PenplotterProvider } from "../contexts/Penplotter";
import PlotterConnection from "../components/PlotterConnection";
import React from "react";
import dynamic from "next/dynamic";

const PlotterPreview = dynamic(() => import("../components/PlotterPreview"), {
  ssr: false,
});

const Home: React.FC = () => (
  <PenplotterProvider>
    <PlotterConnection />
    <ControlPanel />
    <PlotterPreview />
  </PenplotterProvider>
);

export default Home;
