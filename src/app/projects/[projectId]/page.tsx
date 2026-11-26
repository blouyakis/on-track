import { ProjectLog } from "@/app/project-log";
import { AppShell } from "@/components/app-shell";

// The shell is the same for every project. The project in the URL and
// everything about who is signed in are read inside the shell's Suspense
// boundary, so `params` is passed down without being awaited here.
export default function ProjectPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  return (
    <AppShell>
      <ProjectLog params={params} />
    </AppShell>
  );
}
