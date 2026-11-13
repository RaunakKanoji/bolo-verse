export type ProjectFilters = {
  search: string;
  status: string;
  clientId: string;
  type: string;
  sort: string;
};
type FilterableProject = {
  name: string;
  objective: string;
  status: string;
  clientId: string | null;
  type: string;
  dueDate: string | null;
  updatedAt: string;
};
export function filterProjects<T extends FilterableProject>(
  rows: T[],
  filters: ProjectFilters,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return rows
    .filter(
      (p) =>
        (filters.status === "all" ? p.status !== "archived" : p.status === filters.status) &&
        (!search || `${p.name} ${p.objective}`.toLocaleLowerCase().includes(search)) &&
        (!filters.clientId || p.clientId === filters.clientId) &&
        (!filters.type || p.type === filters.type),
    )
    .sort((a, b) =>
      filters.sort === "name"
        ? a.name.localeCompare(b.name)
        : filters.sort === "due"
          ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
          : b.updatedAt.localeCompare(a.updatedAt),
    );
}
export function safeAssetUrl(url: string | null | undefined): string | null {
  return url &&
    /^\/api\/v1\/(?:assets\/[0-9a-f-]{36}\/(?:content|native-content)|workspace\/assets\/[0-9a-f-]{36}\/download)$/.test(
      url,
    )
    ? url
    : null;
}
