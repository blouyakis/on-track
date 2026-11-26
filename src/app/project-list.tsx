import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ProjectForm } from "@/components/project-form";
import { SignedInBar } from "@/components/signed-in-bar";
import { SIGN_IN_PATH } from "@/lib/auth-routes";
import { projectPath } from "@/lib/project-path";
import { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// One membership with its project's name. `projects` is null if the project
// did not come back with the row.
type MembershipRow = {
  project_id: string;
  role: string;
  projects: { name: string } | null;
};

const ROLE_LABELS: Record<string, string> = {
  overseer: "Overseer",
  contributor: "Contributor",
};

const mutedClass = "text-sm text-zinc-600 dark:text-zinc-400";

// Reads the session cookie, so it must render inside <Suspense> and is never
// cached: the list is per user and has to be fresh after creating or joining.
export async function ProjectList() {
  // Request time only: the Supabase client reads the clock to check whether
  // the session has expired, which must not run during a prerender.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out: nothing about any project is read or shown. The proxy has
  // normally redirected already; this is the check next to the data.
  if (!user) redirect(SIGN_IN_PATH);

  return (
    <div className="flex flex-col gap-10">
      <SignedInBar email={user.email} />

      <section aria-labelledby="your-projects" className="flex flex-col gap-4">
        <h2 id="your-projects" className="text-xl font-semibold">
          Your projects
        </h2>
        {await projects(supabase, user.id)}
      </section>

      <section aria-labelledby="create-project" className="flex flex-col gap-4">
        <h2 id="create-project" className="text-xl font-semibold">
          Create a project
        </h2>
        <p className={mutedClass}>
          You become its overseer and get an invite code to share.
        </p>
        <ProjectForm mode="create" />
      </section>

      <section aria-labelledby="join-project" className="flex flex-col gap-4">
        <h2 id="join-project" className="text-xl font-semibold">
          Join a project
        </h2>
        <p className={mutedClass}>
          Enter the invite code from the project&apos;s overseer to join as a
          contributor.
        </p>
        <ProjectForm mode="join" />
      </section>
    </div>
  );
}

async function projects(supabase: SupabaseClient, userId: string) {
  // The user's own memberships, each with its project's name. The role comes
  // from the membership. The invite code is not asked for here.
  const { data, error } = await supabase
    .from("memberships")
    .select("project_id, role, projects(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<MembershipRow[], { merge: false }>();

  if (error) {
    console.error("Loading projects failed:", error.message);
    return <p className={mutedClass}>Your projects could not be loaded.</p>;
  }

  const rows = (data ?? []).filter((row) => row.projects !== null);

  if (rows.length === 0) {
    return <p className={mutedClass}>You are not a member of a project yet.</p>;
  }

  return (
    <ul aria-labelledby="your-projects" className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.project_id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <Link
            href={projectPath(row.project_id)}
            className="font-medium underline"
          >
            {row.projects?.name}
          </Link>
          <span className={mutedClass}>
            {ROLE_LABELS[row.role] ?? row.role}
          </span>
        </li>
      ))}
    </ul>
  );
}
