// Reading an invite code that someone typed or pasted. The codes themselves
// are made by the database (see the create_project function), so nothing
// here decides what a valid code looks like beyond its length.

// Far longer than any real code. Anything over it is not looked up at all.
export const INVITE_CODE_MAX_LENGTH = 64;

// The one message for every code that does not work, whether it is unknown,
// malformed, or the lookup failed. It must not say whether a project exists.
export const INVALID_INVITE_CODE_MESSAGE = "That invite code is not valid.";

// Codes are stored in upper case with no spaces.
export function normalizeInviteCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

// Returns what is wrong with the code, or null when it is worth looking up.
export function inviteCodeError(input: string): string | null {
  const code = normalizeInviteCode(input);
  if (code === "") return "Invite code is required.";
  if (code.length > INVITE_CODE_MAX_LENGTH) return INVALID_INVITE_CODE_MESSAGE;
  return null;
}
