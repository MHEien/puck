import React from "react";
import { ComponentConfig } from "@/core";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@/core/lib";

const getClassName = getClassNameFactory("Hero", styles);

export type HeroProps = {};

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    myDropZone: {
      type: "dropzone",
    },
  },
  defaultProps: {},
  render: ({ myDropZone }) => {
    return (
      <div className={getClassName()}>
        <DropZone style={{ display: "flex" }} zone="my-zone" />
      </div>
    );
  },
};
