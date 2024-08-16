import { DragDropProvider } from "@dnd-kit/react";
import { useAppContext } from "../Puck/context";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DragDropManager, Feedback } from "@dnd-kit/dom";
import { DragDropEvents } from "@dnd-kit/abstract";
import { DropZoneProvider } from "../DropZone";
import type { Draggable, Droppable } from "@dnd-kit/dom";
import { getItem, ItemSelector } from "../../lib/get-item";
import { PathData } from "../DropZone/context";
import { getZoneId } from "../../lib/get-zone-id";

type Events = DragDropEvents<Draggable, Droppable, DragDropManager>;
type DragCbs = Partial<{ [eventName in keyof Events]: Events[eventName][] }>;

const dragListenerContext = createContext<{
  dragListeners: DragCbs;
  setDragListeners?: Dispatch<SetStateAction<DragCbs>>;
}>({
  dragListeners: {},
});

type EventKeys = keyof Events;

export function useDragListener(
  type: EventKeys,
  fn: Events[EventKeys],
  deps: any[] = []
) {
  const { setDragListeners } = useContext(dragListenerContext);

  useEffect(() => {
    if (setDragListeners) {
      setDragListeners((old) => ({
        ...old,
        [type]: [...(old[type] || []), fn],
      }));
    }
  }, deps);
}

export const DragDropContext = ({ children }: { children: ReactNode }) => {
  const { state, config, deferred, dispatch } = useAppContext();
  const { data } = deferred?.isDeferred ? deferred.state : state;
  const [manager] = useState(new DragDropManager({ plugins: [Feedback] }));

  const [draggedItem, setDraggedItem] = useState<Draggable | null>();

  const [dragListeners, setDragListeners] = useState<DragCbs>({});

  const [pathData, setPathData] = useState<PathData>();

  const [dragMode, setDragMode] = useState<"new" | "existing" | null>(null);

  const registerPath = useCallback(
    (selector: ItemSelector) => {
      const item = getItem(selector, data);

      if (!item) {
        return;
      }

      const [area] = getZoneId(selector.zone);

      setPathData((latestPathData = {}) => {
        const parentPathData = latestPathData[area] || { path: [] };

        return {
          ...latestPathData,
          [item.props.id]: {
            path: [
              ...parentPathData.path,
              ...(selector.zone ? [selector.zone] : []),
            ],
            label: item.type as string,
          },
        };
      });
    },
    [data, setPathData]
  );

  return (
    <dragListenerContext.Provider
      value={{
        dragListeners,
        setDragListeners,
      }}
    >
      <DragDropProvider
        manager={manager}
        onDragEnd={(event) => {
          const { source, target } = event.operation;

          setDraggedItem(null);

          // TODO tidy up placeholder if aborted

          if (!target || !source) return;

          console.log("onDragEnd", source, target);

          let zone = source.data.group;
          let index = source.data.index;

          setTimeout(() => {
            if (state.ui.preview) {
              dispatch({
                type: "insert",
                componentType: state.ui.preview.componentType,
                destinationIndex: state.ui.preview.index,
                destinationZone: state.ui.preview.zone,
              });
            }

            deferred?.commit();

            dispatch({
              type: "setUi",
              ui: {
                itemSelector: { index, zone },
                isDragging: false,
                preview: null,
              },
              recordHistory: false,
            });
          }, 300);

          dragListeners.dragend?.forEach((fn) => {
            fn(event, manager);
          });
        }}
        onDragOver={(event) => {
          // Prevent the optimistic re-ordering
          event.preventDefault();

          // Drag end can sometimes trigger after drag
          if (!draggedItem) return;

          const { source, target } = event.operation;

          if (!target || !source) return;

          const sourceData = source.data;
          const targetData = target.data;

          const isOverZone = targetData.zone;

          let targetZone = targetData.group;
          let targetIndex = targetData.index;

          if (isOverZone) {
            targetZone = target.id.toString();
            targetIndex = 0; // TODO place at end
          }

          const [sourceId] = (source.id as string).split(":");
          const [targetId] = (target.id as string).split(":");

          // Abort if dragging over self or descendant
          if (
            targetId === sourceId ||
            pathData?.[target.id]?.path.find((path) => {
              const [pathId] = (path as string).split(":");
              return pathId === sourceId;
            })
          ) {
            return;
          }

          if (dragMode === "new") {
            dispatch({
              type: "setUi",
              ui: {
                preview: {
                  componentType: sourceData.componentType,
                  index: targetIndex,
                  zone: targetZone,
                  id: source.id.toString(),
                },
              },
              recordHistory: false,
            });
          } else {
            deferred?.dispatch({
              type: "move",
              sourceZone: sourceData.group,
              sourceIndex: sourceData.index,
              destinationIndex: targetIndex,
              destinationZone: targetZone,
            });
          }

          dragListeners.dragover?.forEach((fn) => {
            fn(event, manager);
          });
        }}
        onBeforeDragStart={(event) => {
          setDraggedItem(event.operation.source);

          const isNewComponent = event.operation.source?.data.type === "drawer";

          setDragMode(isNewComponent ? "new" : "existing");

          deferred?.start();

          dispatch({
            type: "setUi",
            ui: { itemSelector: null, isDragging: true },
          });

          dragListeners.beforedragstart?.forEach((fn) => {
            fn(event, manager);
          });
        }}
      >
        <DropZoneProvider
          value={{
            data,
            config,
            dispatch,
            draggedItem,
            mode: "edit",
            areaId: "root",
            collisionPriority: 1,
            registerPath,
            pathData,
          }}
        >
          {children}
        </DropZoneProvider>
      </DragDropProvider>
    </dragListenerContext.Provider>
  );
};
