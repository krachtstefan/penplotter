const websockets = require("../../websockets");
const { updateMapping } = require("../penplotter");

module.exports = (store) => (next) => (action) => {
  next(action);

  const updateRequired = updateMapping.find((map) =>
    map.actions.some((a) => a === action.type)
  );

  if (updateRequired) {
    websockets.populate({
      type: "UPDATE_PLOTTER_STATE",
      payload: {
        path: updateRequired.path,
        data: updateRequired.state(store.getState()),
      },
    });
  }
};
