// TEMPORARY, until the authentication feature lands.
//
// These credentials belong to the demo contributor created by
// supabase/seed.sql. They exist only in a locally seeded database and are not
// secrets of any real system.
export const DEMO_CONTRIBUTOR_EMAIL = "demo.contributor@ontrack.local";
export const DEMO_CONTRIBUTOR_PASSWORD = "ontrack-local-demo";

// Off in production unless it is switched on deliberately, so a real
// deployment cannot offer a shared login by accident.
export function isDemoSignInEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_SIGN_IN === "true"
  );
}
