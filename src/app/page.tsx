import { ProjectList } from "@/app/project-list";
import { AppShell } from "@/components/app-shell";

// Everything that depends on who is signed in streams in through the shell's
// Suspense boundary.
export default function Home() {
  return (
    <AppShell>
      <ProjectList />
    </AppShell>
  );
}
