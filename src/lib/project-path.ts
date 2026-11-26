// Where a project's page lives. The id is escaped so that nothing in it can
// change which page the path points to.
export function projectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}
