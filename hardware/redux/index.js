const wsMiddlewre = require("./websocketsMiddleware");
const { combineReducers, configureStore } = require("@reduxjs/toolkit");

const { reducer: penplotter } = require("./penplotter");
const rootReducer = combineReducers({ penplotter });

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(wsMiddlewre),
});

module.exports = store;
