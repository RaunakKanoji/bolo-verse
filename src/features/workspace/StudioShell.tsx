"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Box,
  Clapperboard,
  FolderOpen,
  House,
  Layers3,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import styles from "./studio-shell.module.css";

const navigation = [
  { label: "Dashboard", href: "/studio", icon: House },
  { label: "Projects", href: "/app/projects", icon: FolderOpen },
  { label: "Create", href: "/studio/create", icon: Sparkles },
  { label: "Brainstorm", href: "/studio/xr", icon: Lightbulb },
  { label: "Spatial Studio", href: "/xr/preview", icon: Box },
  { label: "Recording lab", href: "/studio/feasibility", icon: Clapperboard },
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
  return (
    <div className={styles.shell} data-studio-shell>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand} aria-label="Home">
          <span className={styles.logo}>
            <i />
            <i />
            <i />
          </span>
          BoloVerse
        </Link>
        <nav aria-label="Studio navigation">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href || (pathname === "/" && href === "/studio") ? styles.active : ""
              }
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <Link className={styles.network} href="/app/projects">
          <Layers3 size={23} />
          <span>
            Your workspace<small>Projects & creative work</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <span>{title}</span>
          <div>
            {action}
            <Link href="/studio/xr" className={styles.spatialLink}>
              <Box size={17} />
              Open Spatial Studio
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
