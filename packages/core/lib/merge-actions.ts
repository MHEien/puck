import { PuckAction } from "../reducer";

export const mergeActions = (actions?: PuckAction[]) => {
  return actions?.reduce<PuckAction | null>((acc, item) => {
    if (item.type === "insert" || item.type === "move") {
      if (item.type === "insert" && acc) {
        throw new Error(
          `Attempting to merge ${item.type} action, but an action already exists.`
        );
      }

      if (acc?.type === "insert") {
        return {
          ...acc,
          destinationIndex: item.destinationIndex,
          destinationZone: item.destinationZone,
        };
      }

      let cleanItem = item;

      // Delete any placeholder prop
      if (item.type === "insert") {
        delete item.props;
      }

      return {
        ...cleanItem,
        ...acc,
        destinationIndex: item.destinationIndex,
        destinationZone: item.destinationZone,
      };
    } else {
      console.warn(
        `Attempting to merge ${item.type} action. This is not currently supported. Skipping this action...`
      );
    }

    return acc;
  }, null);
};
