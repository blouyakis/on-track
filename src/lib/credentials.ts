// Validation for the sign-up and sign-in forms. The server actions run it on
// every submission; the browser's own checks are for convenience only.

export type CredentialField = "email" | "password";

export type CredentialsInput = Record<CredentialField, string>;

export type CredentialsMode = "sign-up" | "sign-in";

export type CredentialError = {
  field: CredentialField;
  message: string;
};

// The longest address the mail standards allow.
const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
// Supabase Auth hashes passwords with bcrypt, which reads at most 72 bytes.
const PASSWORD_MAX_LENGTH = 72;

// One @, something on each side of it, and a dot in the domain. Whether the
// address exists is for the auth provider to find out.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === "") return "Email is required.";
  if (trimmed.length > EMAIL_MAX_LENGTH || !EMAIL_SHAPE.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

// The password is never trimmed: spaces are legitimate characters in one.
function passwordError(password: string, mode: CredentialsMode): string | null {
  if (password === "") return "Password is required.";
  // An existing account's password is whatever it already is, so the length
  // rules apply only when a password is being chosen.
  if (mode === "sign-in") return null;
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

// Errors come back in form order: email, then password.
export function validateCredentials(
  input: CredentialsInput,
  mode: CredentialsMode,
): CredentialError[] {
  const errors: CredentialError[] = [];

  const email = emailError(input.email);
  if (email) errors.push({ field: "email", message: email });

  const password = passwordError(input.password, mode);
  if (password) errors.push({ field: "password", message: password });

  return errors;
}
