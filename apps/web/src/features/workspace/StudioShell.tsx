"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowUpRight,
  Box,
  Clapperboard,
  FolderOpen,
  House,
  Layers3,
  Lightbulb,
  Sparkles,
  Settings,
  UserRound,
  CheckCheck,
  ImageIcon,
  UsersRound,
  ChartNoAxesCombined,
} from "lucide-react";
import styles from "./studio-shell.module.css";

const navigation = [
  { label: "Workspace", href: "/studio", icon: House },
  { label: "Create", href: "/studio/create", icon: Sparkles },
  { label: "Brainstorm", href: "/studio/xr", icon: Lightbulb },
  { label: "Projects", href: "/app/projects", icon: FolderOpen },
];
const tools = [
  { label: "Spatial Studio", href: "/xr/preview", icon: Box },
  { label: "Recording lab", href: "/studio/feasibility", icon: Clapperboard },
  { label: "Settings", href: "/studio/settings", icon: Settings },
  { label: "Profile", href: "/studio/profile", icon: UserRound },
];
const planned = [
  { label: "Assets", icon: ImageIcon },
  { label: "Clients", icon: UsersRound },
  { label: "Analytics", icon: ChartNoAxesCombined },
];

export default function StudioShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string) =>
    pathname === href ||
    (href === "/studio/create" && ["/create", "/studio/image"].includes(pathname)) ||
    (pathname === "/" && href === "/studio") ||
    (href === "/app/projects" && pathname.startsWith("/app/projects/"));
  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      if (
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat ||
        event.isComposing
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
        )
      )
        return;
      const destination = navigation[Number(event.code.replace("Digit", "")) - 1];
      if (destination) {
        event.preventDefault();
        if (!window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true }))) return;
        router.push(destination.href);
      }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [router]);
  return (
    <div className={styles.shell} data-studio-shell>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand} aria-label="Home">
          <span className={styles.logo}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.brandText}>Shape Studio</span>
        </Link>
        <nav aria-label="Workspace tools">
          {planned.map(({ label, icon: Icon }) => (
            <button
              key={label}
              disabled
              aria-label={`${label} — planned`}
              title={`${label} — planned`}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          {tools.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={active(href) ? styles.active : ""}
              aria-current={active(href) ? "page" : undefined}
              aria-label={label}
              title={label}
            >
              <Icon size={21} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <Link className={styles.network} href="/app/projects" aria-label="Your workspace">
          <Layers3 size={23} />
          <span>
            Your workspace<small>Projects & creative work</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <nav aria-label="Studio navigation" className={styles.topNav}>
            {navigation.map(({ label, href, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                className={active(href) ? styles.active : ""}
                aria-current={active(href) ? "page" : undefined}
                aria-label={label}
                aria-keyshortcuts={`Alt+${index + 1}`}
                title={`${label} (Alt+${index + 1})`}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
            <button disabled aria-label="Review — planned" title="Review — planned">
              <CheckCheck size={17} aria-hidden="true" />
              <span>Review</span>
            </button>
          </nav>
          <div>
            {action}
            <Link href="/studio/xr" className={styles.spatialLink}>
              <Box size={17} />
              Open Spatial Studio
            </Link>
          </div>
        </header>
        {title && <p className={styles.breadcrumb}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
