import { Suspense } from "react";
import { ProjectLog } from "@/app/project-log";

// The shell is static and the same for every project. The project in the URL
// and everything about who is signed in are read inside the Suspense
// boundary, so `params` is passed down without being awaited here.
export default function ProjectPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">OnTrack</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A shared contribution log for teams.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        }
      >
        <ProjectLog params={params} />
      </Suspense>
    </main>
  );
}
