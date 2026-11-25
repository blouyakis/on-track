import { AuthForm } from "@/components/auth-form";
import type { CredentialsMode } from "@/lib/credentials";

// The shell both auth pages share. It reads nothing about the visitor, so
// the whole page is static.
export function AuthPage({
  title,
  mode,
}: {
  title: string;
  mode: CredentialsMode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">OnTrack</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A shared contribution log for teams.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <AuthForm mode={mode} />
      </section>
    </main>
  );
}
