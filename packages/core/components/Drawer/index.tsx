import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { DragIcon } from "../DragIcon";
import {
  ReactElement,
  ReactNode,
  Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useDraggable } from "@dnd-kit/react";
import { generateId } from "../../lib/generate-id";

const getClassName = getClassNameFactory("Drawer", styles);
const getClassNameItem = getClassNameFactory("DrawerItem", styles);

export const DrawerItemInner = ({
  children,
  name,
  label,
  dragRef,
}: {
  children?: (props: { children: ReactNode; name: string }) => ReactElement;
  name: string;
  label?: string;
  dragRef?: Ref<any>;
}) => {
  const CustomInner = useMemo(
    () =>
      children ||
      (({ children }: { children: ReactNode; name: string }) => (
        <div className={getClassNameItem("default")}>{children}</div>
      )),
    [children]
  );

  return (
    <div className={getClassNameItem()} ref={dragRef}>
      <CustomInner name={name}>
        <div className={getClassNameItem("draggableWrapper")}>
          <div className={getClassNameItem("draggable")}>
            <div className={getClassNameItem("name")}>{label ?? name}</div>
            <div className={getClassNameItem("icon")}>
              <DragIcon />
            </div>
          </div>
        </div>
      </CustomInner>
    </div>
  );
};

const DrawerItem = ({
  name,
  children,
  id,
  label,
}: {
  name: string;
  children?: (props: { children: ReactNode; name: string }) => ReactElement;
  id?: string;
  label?: string;
  index?: number; // TODO deprecate
}) => {
  const resolvedId = id || name;
  // const [dynamicId, setDynamicId] = useState(generateId(resolvedId));

  const { ref } = useDraggable({
    id: resolvedId,
    data: { type: "drawer", componentType: resolvedId },
  });

  // // Id changes every time you hover
  // const onMouseOver = useCallback(() => {
  //   setDynamicId(generateId(resolvedId));
  // }, [resolvedId]);

  return (
    <DrawerItemInner name={name} label={label} dragRef={ref}>
      {children}
    </DrawerItemInner>
  );
};

export const Drawer = ({
  children,
}: {
  children: ReactNode;
  droppableId?: string; // TODO deprecate
  direction?: "vertical" | "horizontal"; // TODO deprecate
}) => {
  return <div className={getClassName()}>{children}</div>;
};

Drawer.Item = DrawerItem;
