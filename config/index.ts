const cylinderCircumference = 40;
const cylinderDiameter = cylinderCircumference / (2 * Math.PI);
const config = {
  cylinder: {
    distance: 747,
    circumference: cylinderCircumference,
    diameter: cylinderDiameter,
  },
  paper: {
    width: 210,
    height: 297,
    topDistance: 500 - 30,
    presets: {
      "a4 portrait": { width: 210, height: 297 },
      "a4 landscape": { width: 297, height: 210 },
      "a3 portrait": { width: 420, height: 594 },
      "a3 landscape": { width: 594, height: 420 },
      "color paper (240 x 340)": { width: 240, height: 340 },
    },
  },
  board: {
    width: 800,
    height: 1170,
    range: {
      width: { min: 300, max: 2000 },
      height: { min: 300, max: 2000 },
    },
  },
  pen: {
    topDistance: 300 - 30,
  },
  websocket: {
    address: "ws://localhost:8080",
  },
};

export default config;
