import React from "react";

const ControlPanel = () => (
  <div>
    <button
      onClick={() => {
        console.log("cool");
        // sendJsonMessage({ cool: "message" });
      }}
    >
      Send Message
    </button>
  </div>
);

export default ControlPanel;
