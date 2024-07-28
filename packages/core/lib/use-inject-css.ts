import { useEffect, useState } from "react";

const styles = `
/* Prevent user from interacting with underlying component */
#puck-preview [data-puck-component] * {
  user-select: none;
}

#puck-preview [data-puck-component] {
  cursor: grab;
  pointer-events: auto !important;
}

#puck-preview [data-dnd-placeholder] {
  background: var(--puck-color-azure-06) !important;
  border: none !important;
  color: #00000000 !important;
  opacity: 0.3 !important;
  outline: none !important;
  transition: none !important;
}

#puck-preview [data-dnd-placeholder] *, #puck-preview [data-dnd-placeholder]::after, #puck-preview [data-dnd-placeholder]::before {
  opacity: 0 !important;
}

#puck-preview [data-dnd-dragging] {
  pointer-events: none !important;
}
`;

export const useInjectStyleSheet = (initialStyles: string) => {
  const [el] = useState<HTMLStyleElement>(document.createElement("style"));

  useEffect(() => {
    el.innerHTML = initialStyles;
    document.head.appendChild(el);
  }, []);

  return el;
};

export const useInjectGlobalCss = () => {
  return useInjectStyleSheet(styles);
};
