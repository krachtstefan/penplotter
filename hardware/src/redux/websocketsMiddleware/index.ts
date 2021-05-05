import { AppActions, RootState } from "../index";
import { Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";

import { populate } from "../../websockets";
import { updateMapping } from "../penplotter";

const wsMiddleware = (store: MiddlewareAPI<Dispatch, RootState>) => (
  next: Dispatch<AppActions>
) => (action: AppActions) => {
  next(action);

  const updateRequired = updateMapping.find((map) =>
    map.actions.some((a) => a === action.type)
  );

  if (updateRequired) {
    populate({
      type: "UPDATE_PLOTTER_STATE",
      payload: {
        path: updateRequired.path,
        data: updateRequired.state(store.getState()),
      },
    });
  }
};
export default wsMiddleware;
