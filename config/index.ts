const config = {
  cylinder: {
    distance: 747,
    circumference: 40,
  },
  paper: {
    width: 210,
    height: 297,
    topDistance: 700 - 20,
    presets: {
      "a4 portrait": { width: 210, height: 297 },
      "a4 landscape": { width: 297, height: 210 },
      "a3 portrait": { width: 420, height: 594 },
      "a3 landscape": { width: 594, height: 420 },
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
    topDistance: 300 - 20,
  },
  websocket: {
    address: "ws://localhost:8080",
  },
};

export default config;
