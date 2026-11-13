"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import {
  ArrowUpRight,
  Bell,
  Box,
  ChartNoAxesCombined,
  CheckCheck,
  Clapperboard,
  FolderOpen,
  House,
  ImageIcon,
  Lightbulb,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { creationRequest } from "@/features/creation/creation-http";
import { StudioOverviewSchema, type StudioActivity } from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "@/features/platform/WorkspaceSession";
import { Dialog } from "@/features/platform/WorkspaceUI";
import styles from "./studio-shell.module.css";
const navigation = [
  { label: "Workspace", href: "/workspace", icon: House },
  { label: "Create", href: "/create", icon: Sparkles },
  { label: "Brainstorm", href: "/brainstorm", icon: Lightbulb },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Review", href: "/review", icon: CheckCheck },
];
const tools = [
  { label: "Workspace", href: "/workspace", icon: House },
  { label: "Assets", href: "/assets", icon: ImageIcon },
  { label: "Clients", href: "/clients", icon: UsersRound },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Spatial Studio", href: "/spatial-studio", icon: Box },
  { label: "Recording lab", href: "/recording-lab", icon: Clapperboard },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
];
function matches(path: string, href: string) {
  if (path === href || (href !== "/workspace" && path.startsWith(`${href}/`))) return true;
  if (href === "/workspace") return ["/", "/studio"].includes(path);
  if (href === "/projects") return path.startsWith("/app/projects");
  if (href === "/create") return ["/studio/create", "/studio/image"].includes(path);
  if (href === "/brainstorm") return path === "/studio/brainstorm";
  if (href === "/review") return path.startsWith("/reviews");
  return path === `/studio${href}`;
}
export default function StudioShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname(),
    router = useRouter();
  const session = useWorkspaceSession();
  const [drawer, setDrawer] = useState(false),
    [notifications, setNotifications] = useState(false);
  const [feed, setFeed] = useState<{ items: StudioActivity[]; loading: boolean; error: boolean }>({
    items: [],
    loading: false,
    error: false,
  });
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
          "input,textarea,select,[contenteditable]:not([contenteditable='false'])",
        )
      )
        return;
      const destination = navigation[Number(event.code.replace("Digit", "")) - 1];
      if (!destination) return;
      event.preventDefault();
      if (window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true })))
        router.push(destination.href);
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [router]);
  useEffect(() => {
    if (!notifications) return;
    const controller = new AbortController();
    void creationRequest("/api/v1/workspace/overview", StudioOverviewSchema, {}, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setFeed({ items: data.activity.slice(0, 10), loading: false, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFeed({ items: [], loading: false, error: true });
      });
    return () => controller.abort();
  }, [notifications, session.sessionKey]);
  function sideLinks(close = false) {
    return (
      <nav aria-label={close ? "Mobile workspace tools" : "Workspace tools"}>
        {tools.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            aria-current={matches(pathname, href) ? "page" : undefined}
            className={matches(pathname, href) ? styles.active : ""}
            onClick={() => {
              if (close) setDrawer(false);
            }}
          >
            <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <div className={styles.shell} data-studio-shell>
      <aside className={styles.sidebar}>
        <Link href="/workspace" className={styles.brand} aria-label="Home">
          <span className={styles.logo}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.brandText}>Shape Studio</span>
        </Link>
        {sideLinks()}
        <Link className={styles.network} href="/projects" aria-label="Your workspace">
          <span>
            Your workspace<small>Projects & creative work</small>
          </span>
          <ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
          >
            <Menu size={22} />
          </button>
          <nav aria-label="Studio navigation" className={styles.topNav}>
            {navigation.map(({ label, href, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={`${label} (Alt+${index + 1})`}
                aria-keyshortcuts={`Alt+${index + 1}`}
                className={matches(pathname, href) ? styles.active : ""}
                aria-current={matches(pathname, href) ? "page" : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.headerActions}>
            {action}
            <a
              href="/spatial-studio"
              className={styles.spatialLink}
              aria-label="Open Spatial Studio"
            >
              <Box size={18} aria-hidden="true" />
              <span>Open Spatial Studio</span>
            </a>
            <button
              className={styles.iconButton}
              aria-label="Notifications"
              title="Notifications"
              onClick={() => {
                setFeed({ items: [], loading: true, error: false });
                setNotifications(true);
              }}
            >
              <Bell size={20} />
            </button>
            {session.configured ? (
              !session.isLoaded ? (
                <span className={styles.accountLoading}>…</span>
              ) : session.sessionKey === "signed-out" ? (
                <SignInButton mode="modal">
                  <button className={styles.signIn}>Sign in</button>
                </SignInButton>
              ) : (
                <UserButton />
              )
            ) : (
              <Link
                href="/profile"
                className={styles.iconButton}
                aria-label="User account"
                title="Your profile"
              >
                <UserRound size={20} />
              </Link>
            )}
          </div>
        </header>
        {title && <p className={styles.breadcrumb}>{title}</p>}
        {children}
      </div>
      <Dialog open={drawer} title="Workspace navigation" onClose={() => setDrawer(false)}>
        <div className={styles.drawerLinks}>{sideLinks(true)}</div>
      </Dialog>
      <Dialog open={notifications} title="Notifications" onClose={() => setNotifications(false)}>
        <p>Recent workspace activity</p>
        {feed.loading ? (
          <p role="status">Loading activity…</p>
        ) : feed.error ? (
          <p role="status">
            Notifications are unavailable while your workspace connection is offline.
          </p>
        ) : !feed.items.length ? (
          <p>No recent activity. Updates appear here as your projects move forward.</p>
        ) : (
          <ul className={styles.notificationList}>
            {feed.items.map((item) => (
              <li key={item.id}>
                <Link href={`/projects/${item.projectId}`} onClick={() => setNotifications(false)}>
                  {item.title}
                </Link>
                <small>
                  {item.projectName} · {new Date(item.createdAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </div>
  );
}
