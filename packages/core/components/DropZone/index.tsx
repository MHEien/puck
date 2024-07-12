import { useContext, useEffect } from "react";
import { DraggableComponent } from "../DraggableComponent";
import { Droppable } from "../Droppable";
import { getItem } from "../../lib/get-item";
import { setupZone } from "../../lib/setup-zone";
import { rootDroppableId } from "../../lib/root-droppable-id";
import { getClassNameFactory } from "../../lib";
import styles from "./styles.module.css";
import { DropZoneProvider, dropZoneContext } from "./context";
import { getZoneId } from "../../lib/get-zone-id";
import { useAppContext } from "../Puck/context";
import { DropZoneProps } from "./types";
import { ComponentConfig, PuckContext } from "../../types/Config";
import Example from "../DraggableComponent/basic";

import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { DrawerItemInner } from "../Drawer";

const getClassName = getClassNameFactory("DropZone", styles);

function Sortable({ children, id, index, group, collisionPriority }) {
  const { ref } = useSortable({
    id,
    index,
    group,
    data: { group, index },
    collisionPriority,
  });

  return (
    <div ref={ref}>
      {/* {id} */}
      <div className={styles.Item}>{children}</div>
    </div>
  );
}

export { DropZoneProvider, dropZoneContext } from "./context";

function DropZoneEdit({ zone, allow, disallow, style }: DropZoneProps) {
  const appContext = useAppContext();
  const ctx = useContext(dropZoneContext);

  const {
    // These all need setting via context
    data,
    dispatch = () => null,
    config,
    itemSelector,
    setItemSelector = () => null,
    areaId,
    draggedItem,
    placeholderStyle,
    registerZoneArea,
    areasWithZones,
    hoveringComponent,
    zoneWillDrag,
    setZoneWillDrag = () => null,
    collisionPriority,
  } = ctx! || {};

  let content = data.content || [];
  let zoneCompound = rootDroppableId;

  useEffect(() => {
    if (areaId && registerZoneArea) {
      registerZoneArea(areaId);
    }
  }, [areaId]);

  // Register and unregister zone on mount
  useEffect(() => {
    if (ctx?.registerZone) {
      ctx?.registerZone(zoneCompound);
    }

    return () => {
      if (ctx?.unregisterZone) {
        ctx?.unregisterZone(zoneCompound);
      }
    };
  }, []);

  if (areaId) {
    if (zone !== rootDroppableId) {
      zoneCompound = `${areaId}:${zone}`;
      content = setupZone(data, zoneCompound).zones[zoneCompound];
    }
  }

  const isRootZone =
    zoneCompound === rootDroppableId ||
    zone === rootDroppableId ||
    areaId === "root";

  const draggedSourceId = draggedItem && draggedItem.source.droppableId;
  const draggedDestinationId =
    draggedItem && draggedItem.destination?.droppableId;
  const [zoneArea] = getZoneId(zoneCompound);

  // we use the index rather than spread to prevent down-level iteration warnings: https://stackoverflow.com/questions/53441292/why-downleveliteration-is-not-on-by-default
  const [draggedSourceArea] = getZoneId(draggedSourceId);

  const userWillDrag = zoneWillDrag === zone;

  const userIsDragging = !!draggedItem;
  const draggingOverArea = userIsDragging && zoneArea === draggedSourceArea;
  const draggingNewComponent = draggedSourceId?.startsWith("component-list");

  const { ref } = useDroppable({
    id: `zone:${zoneCompound}`,
    collisionPriority,
  });

  if (
    !ctx?.config ||
    !ctx.setHoveringArea ||
    !ctx.setHoveringZone ||
    !ctx.setHoveringComponent ||
    !ctx.setItemSelector ||
    !ctx.registerPath ||
    !ctx.dispatch
  ) {
    return <div>DropZone requires context to work.</div>;
  }

  const {
    hoveringArea = "root",
    setHoveringArea,
    hoveringZone,
    setHoveringZone,
    setHoveringComponent,
  } = ctx;

  const hoveringOverArea = hoveringArea
    ? hoveringArea === zoneArea
    : isRootZone;
  const hoveringOverZone = hoveringZone === zoneCompound;

  let isEnabled = userWillDrag;

  /**
   * We enable zones when:
   *
   * 1. This is a new component and the user is dragging over the area. This
   *    check prevents flickering if you move cursor outside of zone
   *    but within the area
   * 2. This is an existing component and the user a) is dragging over the
   *    area (which prevents drags between zone areas, breaking the rules
   *    of @hello-pangea/dnd) and b) has the cursor hovering directly over
   *    the specific zone (which increases robustness when using flex
   *    layouts)
   */
  if (userIsDragging) {
    if (draggingNewComponent) {
      if (appContext.safariFallbackMode) {
        isEnabled = true;
      } else {
        isEnabled = hoveringOverArea;
      }
    } else {
      isEnabled = draggingOverArea && hoveringOverZone;
    }
  }

  if (isEnabled && userIsDragging && (allow || disallow)) {
    const [_, componentType] = draggedItem.draggableId.split("::");

    if (disallow) {
      const defaultedAllow = allow || [];

      // remove any explicitly allowed items from disallow
      const filteredDisallow = (disallow || []).filter(
        (item) => defaultedAllow.indexOf(item) === -1
      );

      if (filteredDisallow.indexOf(componentType) !== -1) {
        isEnabled = false;
      }
    } else if (allow) {
      if (allow.indexOf(componentType) === -1) {
        isEnabled = false;
      }
    }
  }

  const selectedItem = itemSelector ? getItem(itemSelector, data) : null;
  const isAreaSelected = selectedItem && zoneArea === selectedItem.props.id;

  return (
    <div
      className={getClassName({
        isRootZone,
        userIsDragging,
        draggingOverArea,
        hoveringOverArea,
        draggingNewComponent,
        isDestination: draggedDestinationId === zoneCompound,
        isDisabled: !isEnabled,
        isAreaSelected,
        hasChildren: content.length > 0,
      })}
      onMouseUp={() => {
        setZoneWillDrag("");
      }}
      ref={ref}
    >
      {content.map((item, i) => {
        const componentId = item.props.id;

        const puckProps: PuckContext = {
          renderDropZone: DropZone,
          isEditing: true,
        };

        const defaultedProps = {
          ...config.components[item.type]?.defaultProps,
          ...item.props,
          puck: puckProps,
          editMode: true, // DEPRECATED
        };

        const isSelected = selectedItem?.props.id === componentId || false;

        const isDragging =
          (draggedItem?.draggableId || "draggable-").split("draggable-")[1] ===
          componentId;

        const containsZone = areasWithZones
          ? areasWithZones[componentId]
          : false;

        let Render = config.components[item.type]
          ? config.components[item.type].render
          : () => (
              <div style={{ padding: 48, textAlign: "center" }}>
                No configuration for {item.type}
              </div>
            );

        if (item.props.__placeholder) {
          // eslint-disable-next-line react/display-name
          Render = () => <DrawerItemInner name={item.type as string} />;
        }

        const componentConfig: ComponentConfig | undefined =
          config.components[item.type];

        const label = componentConfig?.["label"] ?? item.type.toString();

        return (
          <Sortable
            key={componentId}
            group={zoneCompound}
            id={componentId}
            index={i}
            collisionPriority={collisionPriority} // TODO this can make it hard to switch between sibling zones
          >
            <DropZoneProvider
              value={{
                ...ctx,
                areaId: componentId,
                collisionPriority: collisionPriority + 1,
              }}
            >
              <Render {...defaultedProps} />
            </DropZoneProvider>
          </Sortable>
        );
      })}
    </div>
  );
}

function DropZoneRender({ zone }: DropZoneProps) {
  const ctx = useContext(dropZoneContext);

  const { data, areaId = "root", config } = ctx || {};

  let zoneCompound = rootDroppableId;
  let content = data?.content || [];

  if (!data || !config) {
    return null;
  }

  if (areaId && zone && zone !== rootDroppableId) {
    zoneCompound = `${areaId}:${zone}`;
    content = setupZone(data, zoneCompound).zones[zoneCompound];
  }

  return (
    <>
      {content.map((item) => {
        const Component = config.components[item.type];

        if (Component) {
          return (
            <DropZoneProvider
              key={item.props.id}
              value={{
                data,
                config,
                areaId: item.props.id,
                collisionPriority: 1,
              }}
            >
              <Component.render
                {...item.props}
                puck={{ renderDropZone: DropZone }}
              />
            </DropZoneProvider>
          );
        }

        return null;
      })}
    </>
  );
}

export function DropZone(props: DropZoneProps) {
  const ctx = useContext(dropZoneContext);

  if (ctx?.mode === "edit") {
    return (
      <>
        <DropZoneEdit {...props} />
      </>
    );
  }

  return (
    <>
      <DropZoneRender {...props} />
    </>
  );
}
