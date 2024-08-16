import { Reducer } from "react";
import { AppState, Config } from "../types/Config";
import { reduceData } from "./data";
import { CommitAction, PuckAction, SetAction } from "./actions";
import { reduceUi } from "./state";

export * from "./actions";
export * from "./data";

export type ActionType = "insert" | "reorder";

export type StateReducer<SupportedAction = PuckAction> = Reducer<
  AppState,
  SupportedAction
>;

function storeInterceptor<SupportedAction extends PuckAction = PuckAction>(
  reducer: StateReducer<SupportedAction>,
  record?: (appState: AppState) => void
) {
  return (state: AppState, action: SupportedAction) => {
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

export function createReducer<
  UserConfig extends Config = Config,
  SupportedAction extends PuckAction = PuckAction
>({
  config,
  record,
}: {
  config: UserConfig;
  record?: (appState: AppState) => void;
}): StateReducer<SupportedAction> {
  return storeInterceptor<SupportedAction>((state, action) => {
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
