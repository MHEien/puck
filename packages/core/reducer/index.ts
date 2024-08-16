import { Reducer } from "react";
import { AppState, Config } from "../types/Config";
import { reduceData } from "./data";
import { PuckAction, SetAction } from "./actions";
import { reduceUi } from "./state";

export * from "./actions";
export * from "./data";

export type ActionType = "insert" | "reorder";

export type StateReducer = Reducer<AppState, PuckAction>;

function storeInterceptor(
  reducer: StateReducer,
  record?: (appState: AppState) => void
) {
  return (state: AppState, action: PuckAction) => {
    const newAppState = reducer(state, action);

    const isValidType = ![
      "registerZone",
      "unregisterZone",
      "setData",
      "setUi",
      "set",
    ].includes(action.type);

    if (
      typeof action.recordHistory !== "undefined"
        ? action.recordHistory
        : isValidType
    ) {
      if (record) record(newAppState);
    }

    return newAppState;
  };
}

export const setAction = (state: AppState, action: SetAction) => {
  if (typeof action.state === "object") {
    return {
      ...state,
      ...action.state,
    };
  }

  return { ...state, ...action.state(state) };
};

export function createReducer<UserConfig extends Config = Config>({
  config,
  record,
}: {
  config: UserConfig;
  record?: (appState: AppState) => void;
}): StateReducer {
  return storeInterceptor((state, action) => {
    const currentState = state;

    let newState = {
      data: reduceData(currentState.data, action, config),
      ui: reduceUi(currentState.ui, action),
    };

    if (action.type === "set") {
      newState = setAction(currentState, action);
    }

    console.log(action, state, newState);

    return newState;
  }, record);
}
