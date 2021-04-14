const { combineReducers, configureStore } = require("@reduxjs/toolkit");

const { reducer: penplotter } = require("./penplotter");

const rootReducer = combineReducers({ penplotter });

const store = configureStore({
  reducer: rootReducer,
});

module.exports = store;
