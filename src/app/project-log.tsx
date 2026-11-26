import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { EntryForm } from "@/components/entry-form";
import { EntryList, type EntryRow } from "@/components/entry-list";
import { SignedInBar } from "@/components/signed-in-bar";
import { HOME_PATH, SIGN_IN_PATH } from "@/lib/auth-routes";
import { sortNewestFirst } from "@/lib/sort-entries";
import {
  canReadProject,
  canSeeInviteCode,
  type Membership,
} from "@/lib/visibility";
import { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type MembershipRow = { project_id: string; role: string };
type ProjectRow = { name: string };

const mutedClass = "text-sm text-zinc-600 dark:text-zinc-400";

// The membership row as the visibility rules in src/lib/ read it. A missing
// row, or a role the app does not know, is no membership at all.
function toMemberships(
  userId: string,
  row: MembershipRow | null,
): Membership[] {
  if (!row) return [];
  if (row.role !== "contributor" && row.role !== "overseer") return [];
  return [{ userId, projectId: row.project_id, role: row.role }];
}

// Reads the session cookie and the project in the URL, so it must render
// inside <Suspense> and is never cached: the data is per user and has to be
// fresh after each new entry.
export async function ProjectLog({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
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

  const { projectId } = await params;

  return (
    <div className="flex flex-col gap-8">
      <SignedInBar email={user.email} />

      <p>
        <Link href={HOME_PATH} className="text-sm font-medium underline">
          Your projects
        </Link>
      </p>

      {await projectContent(supabase, user.id, projectId)}
    </div>
  );
}

async function projectContent(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
) {
  // The project in the URL is only a request. What the user may see comes
  // from their membership in it, looked up here.
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("project_id, role")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle()
    .overrideTypes<MembershipRow, { merge: false }>();

  if (membershipError) {
    console.error("Loading a membership failed:", membershipError.message);
  }

  const memberships = toMemberships(userId, membership ?? null);

  // No membership, no data: not the project's name, and nothing that tells a
  // project the user is not in apart from one that does not exist.
  if (!canReadProject(userId, projectId, memberships)) {
    return (
      <p className={mutedClass}>
        This project does not exist, or you are not a member of it.
      </p>
    );
  }

  const isContributor = memberships[0].role === "contributor";
  const showInviteCode = canSeeInviteCode(userId, projectId, memberships);

  const [projectResult, entriesResult, inviteCode] = await Promise.all([
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle()
      .overrideTypes<ProjectRow, { merge: false }>(),
    supabase
      .from("entries")
      .select(
        "id, author_id, entry_date, hours, type, details, link, attendees, decisions, action_items, created_at",
      )
      .eq("project_id", projectId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .overrideTypes<EntryRow[], { merge: false }>(),
    // Asked for only when the rules say this user may see it. The database
    // function checks the same thing again.
    showInviteCode ? loadInviteCode(supabase, projectId) : null,
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

      {showInviteCode && (
        <section aria-labelledby="invite-code" className="flex flex-col gap-2">
          <h3 id="invite-code" className="text-lg font-medium">
            Invite code
          </h3>
          {inviteCode ? (
            <>
              <p>
                <code className="rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-lg tracking-wider select-all dark:bg-zinc-800">
                  {inviteCode}
                </code>
              </p>
              <p className={mutedClass}>
                Share this code with the people who should join as contributors.
              </p>
            </>
          ) : (
            <p className={mutedClass}>The invite code could not be loaded.</p>
          )}
        </section>
      )}

      {isContributor && (
        <section aria-labelledby="add-entry" className="flex flex-col gap-4">
          <h3 id="add-entry" className="text-lg font-medium">
            Add an entry
          </h3>
          <EntryForm projectId={projectId} />
        </section>
      )}

      <section aria-labelledby="project-log" className="flex flex-col gap-4">
        <h3 id="project-log" className="text-lg font-medium">
          Project log
        </h3>
        <EntryList entries={entries} currentUserId={userId} />
      </section>
    </div>
  );
}

async function loadInviteCode(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("project_invite_code", {
    p_project_id: projectId,
  });
  const inviteCode: unknown = data;

  if (error) console.error("Loading the invite code failed:", error.message);
  return typeof inviteCode === "string" ? inviteCode : null;
}
