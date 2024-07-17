// TODO
// - [ ] dragging in of new items
// - [ ] drag handlers when dragging
// - [ ] reintroduce dropzone restrictions
// - [ ] use data- attribute instead of ref for multi-framework future thinking
// - [ ] (Clauderic) fix item resizing when dragged out of nested parent
// - [ ] fix placeholder preview
// - [ ] fix collisions when dragging out of nested dropzones
// - [ ] (Clauderic?) fix infinite loop when dragging out of nested dropzones
// - [ ] iframe support for dragging
// - [ ] iframe support for overlays

import {
  ReactNode,
  Ref,
  SyntheticEvent,
  useCallback,
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

const getClassName = getClassNameFactory("DraggableComponent", styles);

// Magic numbers are used to position actions overlay 8px from top of component, bottom of component (when sticky scrolling) and side of preview
const space = 8;
const actionsOverlayTop = space * 6.5;
const actionsTop = -(actionsOverlayTop - 8);
const actionsRight = space;

export const DraggableComponent = ({
  children,
  collisionPriority,
  id,
  index,
  zoneCompound,
  isLoading = false,
  isSelected = false,
  debug,
  label,
  indicativeHover = false,
}: {
  children: (ref: Ref<any>) => ReactNode;
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
    data: { group: zoneCompound, index },
    collisionPriority,
  });

  const ref = useRef<Element>();

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

    const onMouseOver = (e: Event) => {
      e.stopPropagation();
      setHover(true);
    };
    const onMouseOut = (e: Event) => {
      e.stopPropagation();
      setHover(false);
    };

    el.setAttribute("data-puck-component", "");
    el.style.position = "relative";
    el.addEventListener("click", onClick);
    el.addEventListener("mouseover", onMouseOver);
    el.addEventListener("mouseout", onMouseOut);

    return () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("mouseover", onMouseOver);
      el.removeEventListener("mouseout", onMouseOut);
    };
  }, [ref, overlayRef, onClick]);

  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(sync, [ref]);

  const isVisible = isSelected || hover || indicativeHover;

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current as HTMLElement;

    const canvasRoot = document.getElementById("puck-canvas-root");

    const onCanvasScroll = () => {
      requestAnimationFrame(() => {
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

  return (
    <>
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
    </>
  );
};
