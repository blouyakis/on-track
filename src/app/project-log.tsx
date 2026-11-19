import { isDemoSignInEnabled } from "@/app/demo-sign-in";
import { DemoSignIn } from "@/components/demo-sign-in";
import { EntryForm } from "@/components/entry-form";
import { EntryList, type EntryRow } from "@/components/entry-list";
import { sortNewestFirst } from "@/lib/sort-entries";
import { createClient } from "@/utils/supabase/server";

type MembershipRow = { project_id: string; role: string };
type ProjectRow = { name: string };

const mutedClass = "text-sm text-zinc-600 dark:text-zinc-400";

// Reads the session cookie, so it must render inside <Suspense> and is never
// cached: the data is per user and has to be fresh after each new entry.
export async function ProjectLog() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out: nothing about any project is shown.
  if (!user) {
    return isDemoSignInEnabled() ? (
      <DemoSignIn />
    ) : (
      <p className={mutedClass}>Sign-in is not available yet.</p>
    );
  }

  // The project comes from the signed-in user's membership, looked up here.
  // (One project per user for now.)
  const { data: membership } = await supabase
    .from("memberships")
    .select("project_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()
    .overrideTypes<MembershipRow, { merge: false }>();

  if (!membership) {
    return <p className={mutedClass}>You are not a member of a project yet.</p>;
  }

  const [projectResult, entriesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("name")
      .eq("id", membership.project_id)
      .maybeSingle()
      .overrideTypes<ProjectRow, { merge: false }>(),
    supabase
      .from("entries")
      .select(
        "id, author_id, entry_date, hours, type, details, link, attendees, decisions, action_items, created_at",
      )
      .eq("project_id", membership.project_id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .overrideTypes<EntryRow[], { merge: false }>(),
  ]);

  if (entriesResult.error) {
    console.error("Loading entries failed:", entriesResult.error.message);
    return <p className={mutedClass}>The project log could not be loaded.</p>;
  }

  const entries = sortNewestFirst(entriesResult.data);

  return (
    <div className="flex flex-col gap-10">
      <h2 className="text-xl font-semibold">
        {projectResult.data?.name ?? "Your project"}
      </h2>

      {membership.role === "contributor" && (
        <section aria-labelledby="add-entry" className="flex flex-col gap-4">
          <h3 id="add-entry" className="text-lg font-medium">
            Add an entry
          </h3>
          <EntryForm />
        </section>
      )}

      <section aria-labelledby="project-log" className="flex flex-col gap-4">
        <h3 id="project-log" className="text-lg font-medium">
          Project log
        </h3>
        <EntryList entries={entries} currentUserId={user.id} />
      </section>
    </div>
  );
}
