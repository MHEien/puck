// TODO
// - [x] fix placeholder preview
// - [ ] fix collisions when dragging out of nested dropzones
// - [ ] dragging in of new items
// - [ ] drag handlers when dragging
// - [ ] reintroduce dropzone restrictions
// - [ ] use data- attribute instead of ref for multi-framework future thinking
// - [ ] (Clauderic) fix item resizing when dragged out of nested parent
// - [ ] (Clauderic?) fix infinite loop when dragging out of nested dropzones
// - [ ] iframe support for dragging
// - [ ] iframe support for overlays
// - [ ] Can't always scroll whilst dragging
// - [ ] register path data
// - [ ] Fix some state issues where item is duplicated after dropping between zones
// - [ ] Test multiple root dropzones
// - [ ] Custom collision detector to mimic over-midpoint dragging?

import {
  ReactNode,
  Ref,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { Copy, Trash } from "lucide-react";
import { useModifierHeld } from "../../lib/use-modifier-held";
import { useAppContext } from "../Puck/context";
import { Loader } from "../Loader";
import { useSortable } from "@dnd-kit/react/sortable";
import { createPortal } from "react-dom";
import { pointerIntersection } from "@dnd-kit/collision";
import { dropZoneContext, DropZoneProvider } from "../DropZone";

const getClassName = getClassNameFactory("DraggableComponent", styles);

// Magic numbers are used to position actions overlay 8px from top of component, bottom of component (when sticky scrolling) and side of preview
const space = 8;
const actionsOverlayTop = space * 6.5;
const actionsTop = -(actionsOverlayTop - 8);
const actionsRight = space;

export const DraggableComponent = ({
  children,
  collisionPriority,
  componentType,
  id,
  index,
  zoneCompound,
  isLoading = false,
  isSelected = false,
  debug,
  label,
  indicativeHover = false,
  isDragDisabled,
}: {
  children: (ref: Ref<any>) => ReactNode;
  componentType: string;
  collisionPriority: number;
  id: string;
  index: number;
  zoneCompound: string;
  isSelected?: boolean;
  debug?: string;
  label?: string;
  isLoading: boolean;
  isDragDisabled?: boolean;
  indicativeHover?: boolean;
}) => {
  const { zoomConfig, dispatch, iframe } = useAppContext();
  const isModifierHeld = useModifierHeld("Alt");

  const { ref: sortableRef } = useSortable({
    id,
    index,
    group: zoneCompound,
    data: { group: zoneCompound, index, componentType },
    collisionPriority,
    disabled: isDragDisabled,
  });

  const ref = useRef<Element>();

  const [containsDropZone, setContainsDropZone] = useState(false);

  const refSetter = useCallback(
    (el: Element | null) => {
      sortableRef(el);

      if (el) {
        ref.current = el;
      }
    },
    [sortableRef]
  );

  const overlayRef = useRef<HTMLDivElement>(null);

  const sync = useCallback(() => {
    if (!ref.current || !overlayRef.current) return;

    const rect = ref.current!.getBoundingClientRect();

    // TODO change this logic when using iframes
    if (iframe.enabled) {
    } else {
      const previewEl = document.getElementById("puck-preview");

      if (!previewEl) return;

      const previewRect = previewEl.getBoundingClientRect();

      overlayRef.current!.style.left = `${rect.left - previewRect.left}px`;
      overlayRef.current!.style.top = `${rect.top - previewRect.top}px`;
      overlayRef.current!.style.height = `${rect.height}px`;
      overlayRef.current!.style.width = `${rect.width}px`;
    }

    setRect(rect);
  }, [ref, overlayRef]);

  const onClick = useCallback(
    (e: SyntheticEvent | Event) => {
      e.stopPropagation();
      dispatch({
        type: "setUi",
        ui: {
          itemSelector: { index, zone: zoneCompound },
        },
      });
    },
    [index, zoneCompound, id]
  );

  const onDuplicate = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      dispatch({
        type: "duplicate",
        sourceIndex: index,
        sourceZone: zoneCompound,
      });
    },
    [index, zoneCompound]
  );

  const onRemove = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      dispatch({
        type: "remove",
        index: index,
        zone: zoneCompound,
      });
    },
    [index, zoneCompound]
  );

  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current as HTMLElement;

    const _onMouseOver = (e: Event) => {
      e.stopPropagation();

      // console.log("cp", e.currentTarget, e.target, id, zoneCompound);

      setHover(true);

      if (containsDropZone) {
        if (ctx?.setHoveringArea) {
          ctx.setHoveringArea(id);
        }

        // if (ctx?.registerZone) {
        //   ctx?.registerZone(zoneCompound);
        // }
      } else {
        if (ctx?.setHoveringArea) {
          ctx.setHoveringArea(ctx.areaId || "");
        }

        if (ctx?.setHoveringZone) {
          ctx.setHoveringZone(zoneCompound);
        }
      }
    };

    const _onMouseOut = (e: Event) => {
      e.stopPropagation();

      setHover(false);
    };

    el.setAttribute("data-puck-component", "");
    el.style.position = "relative";
    el.addEventListener("click", onClick);
    el.addEventListener("mouseover", _onMouseOver);
    el.addEventListener("mouseout", _onMouseOut);

    return () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("mouseover", _onMouseOver);
      el.removeEventListener("mouseout", _onMouseOut);
    };
  }, [ref, overlayRef, onClick, containsDropZone, zoneCompound, id]);

  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(sync, [ref]);

  const isVisible = isSelected || hover || indicativeHover;

  useEffect(() => {
    if (!ref.current || !overlayRef.current) return;

    const el = ref.current as HTMLElement;

    const canvasRoot = document.getElementById("puck-canvas-root");

    const onCanvasScroll = () => {
      requestAnimationFrame(() => {
        if (!ref.current || !overlayRef.current) return;

        const rect = ref.current!.getBoundingClientRect();

        // Apply styles directly as lower latency than relying on React render loop
        overlayRef.current!.style.top = `${rect.top}px`;
      });
    };

    if (isVisible) {
      canvasRoot?.addEventListener("scroll", onCanvasScroll);
    } else {
      canvasRoot?.removeEventListener("scroll", onCanvasScroll);
    }

    const observer = new ResizeObserver(() => {
      sync();
    });

    observer.observe(el);

    return () => {
      if (!ref.current) return;

      observer.disconnect();
      canvasRoot?.removeEventListener("scroll", onCanvasScroll);
    };
  }, [ref, overlayRef, isSelected, hover, rect]);

  const ctx = useContext(dropZoneContext);

  return (
    <DropZoneProvider
      value={{
        ...ctx!,
        areaId: id,
        zoneCompound,
        index,
        collisionPriority: collisionPriority + 1,
        setContainsDropZone,
      }}
    >
      {/* <p>collisionPriority: {JSON.stringify(collisionPriority)}</p> */}
      {isVisible &&
        createPortal(
          <div
            className={getClassName({
              isSelected,
              isModifierHeld,
              hover: hover || indicativeHover,
            })}
            ref={overlayRef}
            // onMouseOver={(e) => {
            //   e.stopPropagation();
            //   setHover(true);
            // }}
            // onMouseOut={(e) => {
            //   e.stopPropagation();
            //   setHover(false);
            // }}
            // onClick={onClick}
          >
            {debug}
            {isLoading && (
              <div className={getClassName("loadingOverlay")}>
                <Loader />
              </div>
            )}

            <div
              className={getClassName("actionsOverlay")}
              style={{
                top: actionsOverlayTop / zoomConfig.zoom,
              }}
            >
              <div
                className={getClassName("actions")}
                style={{
                  transform: `scale(${1 / zoomConfig.zoom}`,
                  top: actionsTop / zoomConfig.zoom,
                  right: actionsRight / zoomConfig.zoom,
                }}
              >
                {label && (
                  <div className={getClassName("actionsLabel")}>{label}</div>
                )}
                <button
                  className={getClassName("action")}
                  onClick={onDuplicate}
                >
                  <Copy size={16} />
                </button>
                <button className={getClassName("action")} onClick={onRemove}>
                  <Trash size={16} />
                </button>
              </div>
            </div>
            <div className={getClassName("overlay")} />
          </div>,
          document.getElementById("puck-preview") || document.body
        )}
      {children(refSetter)}
    </DropZoneProvider>
  );
};
