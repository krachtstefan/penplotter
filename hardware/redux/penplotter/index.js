module.exports = {
  reducer: (state = { default: 1 }, action) => {
    console.log("penplotter reducer calles", action);
    return state;
  },
};
