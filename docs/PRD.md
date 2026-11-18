# OnTrack: Product Requirements

CS6983 AI Coding, Fall 2026, Project 3
Team: Barbara (Bobbi) Louyakis, Ziye Huang

## Problem

Any group that works together eventually has to answer the same questions: who did what, when, and how much time did it take? Today the answers live in hand-built spreadsheets, chat threads, and memory. Someone has to copy updates into the log, the format changes from team to team, and the person overseeing the work only sees it when a file is sent to them. It is hard to tell whether the workload is balanced, what was decided in a meeting, or what each person contributed until the end, when it is too late to fix.

Time trackers record hours but not decisions or communication. Project boards track tasks but not each person's effort. OnTrack is one shared, trustworthy record of both.

## Target users

Any group that needs a shared record of its work: class project teams, workplace teams, clubs, and volunteer groups.

## Roles

Roles are assigned per project. One person can be a Contributor on one project and an Overseer on another.

| Role | Who it is | What they can do |
| --- | --- | --- |
| Contributor | A member of the project team | Log entries, edit their own entries, view all entries in their project, download reports for their project |
| Overseer | The instructor, manager, or coordinator | Create a project, share its invite code, set planned hours, view all entries and the summary, download reports |

Nobody can see a project they do not belong to.

## User stories

1. As a contributor who keeps a tracker spreadsheet by hand, I want to log each contribution with its date, hours, type, and details in one form, so that my work is recorded as I go without maintaining a separate file.
2. As a contributor on a team, I want to see my teammates' entries for our project, so that I know what has been done without asking in chat.
3. As a contributor who records team meetings, I want to log the attendees, decisions, and action items for a meeting, so that our communication and our work live in the same record.
4. As an overseer of several teams, I want a summary of each contributor's planned and logged hours, so that I can spot an unbalanced workload before the project ends.
5. As a contributor on more than one project, I want each project's log visible only to its own members and overseer, so that our entries stay private to the people involved.
6. As an overseer or contributor who has to submit a record, I want to download a summary or detailed report as a PDF, so that I can hand it in or file it without reformatting a spreadsheet.

## Features

### Projects
- An Overseer creates a project and gets an invite code.
- A Contributor joins a project with the invite code.
- A user sees only the projects they belong to.

### Entries
- Fields: date, hours, type, details, optional link.
- Types: Work, Meeting, Async update, Planning, Other.
- Meeting entries add: attendees, decisions made, action items.
- A Contributor can edit or delete only their own entries.

### Project log
- Lists all entries in a project, newest first.
- Filter by contributor, type, and date range.

### Overseer dashboard
- Per contributor: planned hours, logged hours, the difference, and entry counts by type.
- Each contributor's share of total logged hours.

### PDF reports
- Summary report: totals per contributor for a date range.
- Detailed report: every entry in a date range.
- One download button with the two options.

## Rules the logic must enforce

These are the candidates for test-driven development.

### Visibility
- A user can read a project's entries only if they are a Contributor or the Overseer of that project.
- A Contributor can edit or delete only entries they created.
- An Overseer can read every entry in their project but cannot edit a Contributor's entries.
- A user with no membership in a project gets no data from it, including its name.

### Contribution summary
- Logged hours per contributor equal the sum of that contributor's entry hours in the date range.
- Shares of total hours add up to 100%, or all show 0% when no hours are logged.
- Planned minus logged is reported per contributor.

### Entry validation
- Date is required and cannot be in the future.
- Hours are required, greater than 0, and no more than 24 for one entry.
- Type is required and must be one of the listed types.
- Details are required.
- A link, when present, must be a valid URL.

## Out of scope

- Task lists, dependencies, phases, and milestones.
- Timers and automatic time tracking.
- Email or push notifications.
- Automatic import from GitHub or other tools.
- File uploads.

## Definition of done

- Acceptance criteria in the GitHub issue are met.
- Tests were written before the implementation and pass.
- Lint and type check pass.
- No secrets in the code, and inputs are validated on the server.
- The pull request was reviewed by the other partner.