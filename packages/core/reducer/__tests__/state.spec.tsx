import { defaultAppState } from "../../components/Puck/context";
import { InsertAction, SetUiAction, createReducer } from "../../reducer";
import { AppState, Config } from "../../types/Config";

describe("State reducer", () => {
  const config: Config = {
    components: {
      Comp: {
        defaultProps: { prop: "example" },
        render: () => <div />,
      },
    },
  };

  const reducer = createReducer({ config });

  describe("setUi action", () => {
    it("should insert data into the state", () => {
      const state: AppState = defaultAppState;

      const action: SetUiAction = {
        type: "setUi",
        ui: { leftSideBarVisible: false },
      };

      const newState = reducer(state, action);
      expect(newState.ui.leftSideBarVisible).toEqual(false);
    });
  });

  describe("insert action", () => {
    it("should clear preview", () => {
      const state: AppState = defaultAppState;

      const action: InsertAction = {
        type: "insert",
        destinationIndex: 0,
        destinationZone: "my-zone",
        componentType: "Comp",
      };

      const newState = reducer(state, action);
      expect(newState.ui.preview).toBeNull();
    });
  });
});
