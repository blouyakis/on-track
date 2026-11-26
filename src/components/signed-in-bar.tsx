import { SignOutButton } from "@/components/sign-out-button";

// Who is signed in, and the way out. Shown at the top of every signed-in
// page, whatever else the page can or cannot show.
export function SignedInBar({ email }: { email: string | undefined }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as <span className="font-medium">{email}</span>
      </p>
      <SignOutButton />
    </div>
  );
}
