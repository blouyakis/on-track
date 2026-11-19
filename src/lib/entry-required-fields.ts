// Presence checks only. The full entry validation rules in the PRD (date not
// in the future, hours range, listed type, valid link) are a separate
// test-first feature.

export type RequiredEntryField = "date" | "hours" | "type" | "details";

export type RequiredFieldsInput = Record<RequiredEntryField, string>;

export type RequiredFieldError = {
  field: RequiredEntryField;
  message: string;
};

const MESSAGES: Record<RequiredEntryField, string> = {
  date: "Date is required.",
  hours: "Hours are required.",
  type: "Type is required.",
  details: "Details are required.",
};

// In form order, so errors are reported top to bottom.
const REQUIRED_FIELDS: readonly RequiredEntryField[] = [
  "date",
  "hours",
  "type",
  "details",
];

export function checkRequiredFields(
  input: RequiredFieldsInput,
): RequiredFieldError[] {
  return REQUIRED_FIELDS.filter((field) => input[field].trim() === "").map(
    (field) => ({ field, message: MESSAGES[field] }),
  );
}
