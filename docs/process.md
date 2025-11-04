# Working Agreement & Contribution Process

## Overview
This repository tracks the evolution of the **SQLite Metadata System** proposal. The intent is to keep every change traceable, reviewable, and easy for multiple agents (human or automated) to collaborate on asynchronously.

## Branching Strategy
- Default branch: `main`.
- Create a feature branch per task: `docs/<topic>-<issue#>` or `chore/<task>-<issue#>`.
- Keep branches short-lived. Rebase onto `main` before opening a pull request (`git pull --rebase origin main`).

## Commit Guidelines
- Use conventional prefixes: `docs:`, `feat:`, `chore:`, `ci:`, `refactor:`.
- Each commit should communicate one logical change and include context in the body if needed.

## Issue Lifecycle
1. Open an issue using the **Planning** or **Research Note** template.
2. Apply labels and milestone (see sections below).
3. Assign yourself (default automation also assigns `@ganesh47`).
4. Move the card on the project board from **Backlog** → **Selected** → **In Progress** → **Review** → **Done**.

## Pull Request Workflow
- Reference the associated issue in the PR description (`Closes #X`).
- Ensure lint and link-check workflows pass before requesting review.
- At least one review (human or delegated agent) is required before merging.
- Use squash merge to keep history clean; delete the branch once merged.

## Labels
- Status: `status:todo`, `status:in-progress`, `status:review`, `status:done`, `blocked`.
- Type: `type:doc`, `type:research`, `type:experiment`, `type:process`.
- Area tags as needed: `area:architecture`, `area:tooling`, `area:workflows`.

## Milestones
- `M1 - Foundations`: initial scaffolding and methodology definition.
- `M2 - Architecture Draft`: first complete pass on system design.
- `M3 - Implementation Plan`: transition proposal into actionable roadmap.

## Project Board
- GitHub Project: **SQLite Metadata Proposal** (Projects v2).
- Columns: `Backlog`, `Selected`, `In Progress`, `Review`, `Done`.
- Use the `Stage` single-select field to move cards between columns.
- Issues are auto-added via the repository link; review new entries and set Stage accordingly.

## Documentation Structure
- `sqlite-metadata-system.md`: living proposal.
- `docs/process.md`: this guide.
- `docs/notes/`: dated research logs (`YYYY-MM-DD.md`).
- `docs/decisions/`: architecture decision records (ADR) when decisions stabilize.

## Automation
- Linting: Markdown lint on pull requests.
- Link checks: Lychee link checker nightly and on PRs touching docs.
- Proposal snapshot: build & archive HTML/PDF on merge to `main` (planned).

## Working With Agents
- Capture task context in issues so autonomous agents can pick up work.
- Use checklists in issues to track progress when multiple agents share a task.
- Summarize findings in comments before handing off.

## Getting Started Checklist
1. Clone the repo and run `gh repo sync` if needed.
2. Read the open issues in the project board.
3. Pick an issue, self-assign, and move it to **Selected**.
4. Create a branch, make changes, and open a PR using the template.
5. Ensure workflows pass and request review.
