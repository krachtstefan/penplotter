import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { PenplotterActions } from "./penplotter/types";
import { reducer as penplotter } from "./penplotter";
import wsMiddlewre from "./websocketsMiddleware";

const rootReducer = combineReducers({ penplotter });

export type RootState = ReturnType<typeof rootReducer>;
export type AppActions = PenplotterActions;

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(wsMiddlewre),
});

export default store;
