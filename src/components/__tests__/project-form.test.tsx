import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createProject, joinProject } from "@/app/project-actions";
import type { ProjectFormState } from "@/app/project-form-state";
import { ProjectForm } from "@/components/project-form";
import { INVALID_INVITE_CODE_MESSAGE } from "@/lib/invite-code";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/project-name";

// The server actions are replaced: these tests cover what the forms render
// and what they send.
vi.mock("@/app/project-actions", () => ({
  createProject: vi.fn(),
  joinProject: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit(button: string) {
  const form = screen.getByRole("button", { name: button }).closest("form");
  if (!form) throw new Error("The button is not inside a form.");
  fireEvent.submit(form);
}

function errorState(overrides: Partial<ProjectFormState>): ProjectFormState {
  return {
    status: "error",
    message: null,
    fieldError: null,
    value: "",
    ...overrides,
  };
}

describe("ProjectForm, creating a project", () => {
  test("shows a required project name field and a Create project button", () => {
    render(<ProjectForm mode="create" />);

    expect(field("Project name").type).toBe("text");
    expect(field("Project name").name).toBe("name");
    expect(field("Project name").required).toBe(true);
    expect(field("Project name").maxLength).toBe(PROJECT_NAME_MAX_LENGTH);
    expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
  });

  test("sends the name to the createProject action", async () => {
    vi.mocked(createProject).mockResolvedValue(errorState({}));
    render(<ProjectForm mode="create" />);

    fireEvent.change(field("Project name"), { target: { value: "Capstone" } });
    submit("Create project");

    await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(createProject).mock.calls[0][1];
    expect(formData.get("name")).toBe("Capstone");
    expect(joinProject).not.toHaveBeenCalled();
  });

  test("shows the server's error for the name, tied to the field", async () => {
    vi.mocked(createProject).mockResolvedValue(
      errorState({ fieldError: "Project name is required.", value: "   " }),
    );
    render(<ProjectForm mode="create" />);

    submit("Create project");

    const error = await screen.findByText("Project name is required.");
    expect(field("Project name").getAttribute("aria-invalid")).toBe("true");
    expect(field("Project name").getAttribute("aria-describedby")).toBe(
      error.id,
    );
  });

  test("shows a failed save as an alert and keeps what was typed", async () => {
    vi.mocked(createProject).mockResolvedValue(
      errorState({
        message: "The project could not be created. Try again.",
        value: "Capstone",
      }),
    );
    render(<ProjectForm mode="create" />);

    submit("Create project");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "The project could not be created. Try again.",
    );
    expect(field("Project name").value).toBe("Capstone");
  });
});

describe("ProjectForm, joining a project", () => {
  test("shows a required invite code field and a Join project button", () => {
    render(<ProjectForm mode="join" />);

    expect(field("Invite code").type).toBe("text");
    expect(field("Invite code").name).toBe("invite_code");
    expect(field("Invite code").required).toBe(true);
    // A code is not something a browser should offer from an earlier form.
    expect(field("Invite code").autocomplete).toBe("off");
    expect(screen.getByRole("button", { name: "Join project" })).toBeTruthy();
  });

  test("sends the code to the joinProject action", async () => {
    vi.mocked(joinProject).mockResolvedValue(errorState({}));
    render(<ProjectForm mode="join" />);

    fireEvent.change(field("Invite code"), {
      target: { value: "K7QXM-2RDTP" },
    });
    submit("Join project");

    await waitFor(() => expect(joinProject).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(joinProject).mock.calls[0][1];
    expect(formData.get("invite_code")).toBe("K7QXM-2RDTP");
    expect(createProject).not.toHaveBeenCalled();
  });

  test("shows the fixed message for a code that did not work, and nothing else", async () => {
    vi.mocked(joinProject).mockResolvedValue(
      errorState({
        fieldError: INVALID_INVITE_CODE_MESSAGE,
        value: "WRONG-CODE9",
      }),
    );
    render(<ProjectForm mode="join" />);

    submit("Join project");

    const error = await screen.findByText(INVALID_INVITE_CODE_MESSAGE);
    expect(field("Invite code").getAttribute("aria-describedby")).toBe(
      error.id,
    );
    expect(field("Invite code").value).toBe("WRONG-CODE9");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
