import { AppState, Config } from "../types/Config";
import {
  createReducer,
  InsertAction,
  MoveAction,
  PuckAction,
  SetAction,
  StateReducer,
} from "../reducer";
import { useReducer, useState } from "react";
import { mergeActions } from "./merge-actions";

type SupportedAction = SetAction | InsertAction | MoveAction;

/**
 * useDeferred creates a clone of the appState, applying certain actions (insert, move) to the clone
 * and merging them on commit()
 *
 * This allows for multiple actions to occur during the dragging phase against a temporary clone, wait
 * for the dragging phase to be committed, and finally merge the actions into a single action
 *
 * This prevents appState changes during the dragging phase
 *
 * TODO remove this if not used
 *
 * @param appState
 * @param config
 * @param dispatch
 * @returns
 */
export function useDeferred<UserConfig extends Config = Config>(
  appState: AppState,
  config: UserConfig,
  dispatch: React.Dispatch<PuckAction>
) {
  // Used for making deferred data changes
  const [deferredReducer] = useState(() =>
    createReducer<UserConfig, SupportedAction>({ config })
  );

  const [isDeferred, setIsDeferring] = useState(false);
  const [deferredActions, setDeferredActions] = useState<PuckAction[]>([]);
  const [state, deferredDispatch] = useReducer<StateReducer<SupportedAction>>(
    deferredReducer,
    appState
  );

  const commit = () => {
    const action = mergeActions(deferredActions);

    if (action) {
      dispatch(action);
    }

    setIsDeferring(false);
    setDeferredActions([]);

    console.debug("Committed deferred actions");
  };

  return {
    isDeferred,
    start: () => {
      console.debug("Starting deferred actions");

      deferredDispatch({ type: "set", state: appState });
      setIsDeferring(true);
    },
    commit,
    state,
    dispatch: (action: PuckAction) => {
      if (!isDeferred) {
        throw new Error(
          `Deferred state not active. Use deferStart() to begin state deferral.`
        );
      }

      if (action.type !== "insert" && action.type !== "move") {
        throw new Error(
          `Deferred state only supports "insert" and "move" actions, but you attempted to dispatch a "${action.type}" action. Commit your deferred actions before injecting an action of this type.`
        );
      }

      console.debug("Triggered deferred dispatch", action);

      setDeferredActions((actions) => [...actions, action]);

      return deferredDispatch(action);
    },
  };
}
