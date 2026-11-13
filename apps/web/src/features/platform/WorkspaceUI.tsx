"use client";
import { useEffect, useId, useRef } from "react";
import { Inbox, Info, X } from "lucide-react";
import styles from "./platform.module.css";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <Inbox size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
export function ServiceNotice({
  message = "Your workspace connection is unavailable. You can explore this screen; private work can be saved once your workspace is connected.",
}: {
  message?: string;
}) {
  return (
    <p className={styles.notice} role="status">
      <Info size={18} aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={styles.badge} data-status={status}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const element = ref.current;
    if (open) element?.showModal();
    else element?.close();
    return () => element?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.sectionHeader}>
        <h2 id={id}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  return (
    <Dialog open={open} title={title} onClose={onCancel}>
      <p>{description}</p>
      <div className={styles.actions}>
        <button className={styles.secondary} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.button} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
