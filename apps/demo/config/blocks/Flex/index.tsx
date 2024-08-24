import React from "react";
import { ComponentConfig } from "@/core/types/Config";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@/core/lib";
import { DropZone } from "@/core/components/DropZone";
import { Section } from "../../components/Section";

const getClassName = getClassNameFactory("Flex", styles);

export type FlexProps = {
  direction: "row" | "column";
  gap: number;
  wrap: "wrap" | "nowrap";
};

export const Flex: ComponentConfig<FlexProps> = {
  fields: {
    direction: {
      label: "Direction",
      type: "radio",
      options: [
        { label: "row", value: "row" },
        { label: "column", value: "column" },
      ],
    },
    gap: {
      label: "Gap",
      type: "number",
      min: 0,
    },
    wrap: {
      label: "Wrap",
      type: "radio",
      options: [
        { label: "true", value: "wrap" },
        { label: "false", value: "nowrap" },
      ],
    },
  },
  defaultProps: {
    direction: "row",
    gap: 24,
    wrap: "wrap",
  },
  render: ({ direction, gap, wrap }) => {
    return (
      <Section>
        <DropZone
          className={getClassName()}
          style={{ flexDirection: direction, gap, flexWrap: wrap }}
          zone="flex"
        />
      </Section>
    );
  },
};
