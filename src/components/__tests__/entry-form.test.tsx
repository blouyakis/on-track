import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createEntry } from "@/app/actions";
import { initialEntryFormState } from "@/app/entry-form-state";
import { EntryForm } from "@/components/entry-form";
import { ENTRY_TYPE_LABELS } from "@/lib/entry-types";

// The server action is replaced: these tests cover what the form renders.
vi.mock("@/app/actions", () => ({ createEntry: vi.fn() }));

afterEach(cleanup);

const PROJECT_ID = "project-id";
const MEETING_FIELDS = ["Attendees", "Decisions made", "Action items"];

function typeSelect() {
  return screen.getByLabelText("Type") as HTMLSelectElement;
}

describe("EntryForm", () => {
  test("shows date, hours, type, details and an optional link", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    expect((screen.getByLabelText("Date") as HTMLInputElement).type).toBe(
      "date",
    );
    expect((screen.getByLabelText("Hours") as HTMLInputElement).type).toBe(
      "number",
    );
    expect(typeSelect().tagName).toBe("SELECT");
    expect(screen.getByLabelText("Details").tagName).toBe("TEXTAREA");

    const link = screen.getByLabelText("Link (optional)") as HTMLInputElement;
    expect(link.required).toBe(false);
  });

  test("marks date, hours, type and details as required", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    for (const label of ["Date", "Hours", "Type", "Details"]) {
      const field = screen.getByLabelText(label) as HTMLInputElement;
      expect(field.required).toBe(true);
    }
  });

  test("offers the eleven entry types, in PRD order", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    const options = Array.from(typeSelect().options).filter(
      (option) => option.value !== "",
    );

    expect(options.map((option) => option.value)).toEqual(
      Object.keys(ENTRY_TYPE_LABELS),
    );
    expect(options.map((option) => option.textContent)).toEqual(
      Object.values(ENTRY_TYPE_LABELS),
    );
  });

  test("hides the meeting fields for a work entry", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    fireEvent.change(typeSelect(), { target: { value: "work" } });

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).toBeNull();
    }
  });

  test("shows attendees, decisions made and action items for a meeting", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    fireEvent.change(typeSelect(), { target: { value: "meeting" } });

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).not.toBeNull();
    }
  });

  test("hides the meeting fields again when the type changes back", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    fireEvent.change(typeSelect(), { target: { value: "retrospective" } });
    fireEvent.change(typeSelect(), { target: { value: "async_update" } });

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).toBeNull();
    }
  });

  test("has a button to save the entry", () => {
    render(<EntryForm projectId={PROJECT_ID} />);

    const button = screen.getByRole("button", { name: "Add entry" });
    expect((button as HTMLButtonElement).type).toBe("submit");
  });
});

// The form is shown on one project's page, so it tells the action which
// project the entry is for. The action still checks the membership itself.
describe("EntryForm, on a project's page", () => {
  test("submits to the action with that project's id", async () => {
    vi.mocked(createEntry).mockResolvedValue(initialEntryFormState);
    render(<EntryForm projectId={PROJECT_ID} />);

    const form = screen.getByLabelText("Date").closest("form");
    if (!form) throw new Error("The date field is not inside a form.");
    fireEvent.submit(form);

    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1));
    const [projectId, , formData] = vi.mocked(createEntry).mock.calls[0];
    expect(projectId).toBe(PROJECT_ID);
    expect(formData).toBeInstanceOf(FormData);
  });

  // A hidden field could be edited in the browser like any other field, and
  // would suggest the server reads the project from the form. It does not.
  test("has no project or role field in the form", () => {
    const { container } = render(<EntryForm projectId={PROJECT_ID} />);

    expect(container.querySelector('[name="project_id"]')).toBeNull();
    expect(container.querySelector('[name="role"]')).toBeNull();
  });
});
