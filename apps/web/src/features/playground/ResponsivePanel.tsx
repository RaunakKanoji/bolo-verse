"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./playground.module.css";

/** The same controls move into a native modal sheet; form/store state stays mounted. */
export function ResponsivePanel({
  children,
  label,
  side,
}: {
  children: ReactNode;
  label: string;
  side: "left" | "right";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const sync = () => {
      const element = dialog.current;
      if (!element) return;
      if (element.open) element.close();
      // Desktop panels are ordinary nonmodal content; opening them must not
      // move focus away from navigation or an active field during a resize.
      if (!media.matches) element.open = true;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return (
    <div className={`${styles.panelSlot} ${side === "left" ? styles.leftSlot : styles.rightSlot}`}>
      <button
        className={styles.panelTrigger}
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        {label}
      </button>
      <dialog ref={dialog} className={styles.panel} aria-label={label}>
        <div className={styles.sheetHeading}>
          <strong>{label}</strong>
          <button
            type="button"
            aria-label={`Close ${label.toLowerCase()}`}
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </dialog>
    </div>
  );
}
