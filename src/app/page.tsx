import { Suspense } from "react";
import { ProjectList } from "@/app/project-list";

// The shell is static. Everything that depends on who is signed in streams in
// through the Suspense boundary.
export default function Home() {
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
        <ProjectList />
      </Suspense>
    </main>
  );
}
