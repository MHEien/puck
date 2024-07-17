import { useEffect, useState } from "react";
import styles from "../styles.global.css";

export const useInjectStyleSheet = (initialStyles: string) => {
  const [el] = useState<HTMLStyleElement>(document.createElement("style"));

  useEffect(() => {
    el.innerText = initialStyles;
    document.head.appendChild(el);
  }, []);

  return el;
};

export const useInjectGlobalCss = () => {
  return useInjectStyleSheet(styles);
};
