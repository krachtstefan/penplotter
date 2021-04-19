const websockets = require("../../websockets");
module.exports = (store) => (next) => (action) => {
  next(action);
  websockets.populate({
    type: "MIDDLEWARE CALLED",
    payload: { cool: 1 },
  });
  console.log("middleware", action);
};
