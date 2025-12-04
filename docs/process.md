# Working Agreement & Contribution Process

## Overview
This repository tracks the evolution of the **SQLite Metadata System** proposal. The intent is to keep every change traceable, reviewable, and easy for multiple agents (human or automated) to collaborate on asynchronously.

## Branching Strategy
- Default branch: `main`.
- Create a feature branch per task using the spec prefix so `.specify` tooling can locate the right documents: `NNN-short-name` (e.g., `001-t037-docs`). One branch == one GitHub issue.
- Keep branches short-lived. Rebase onto `main` (`git pull --rebase origin main`) before opening a pull request and run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` to confirm the branch is tied to the correct feature directory.
- Every work session starts by syncing the task/checklist context from `specs/<NNN-...>/tasks.md` and marking completed tasks `[X]` in that file and in the associated GitHub issue.

## Commit Guidelines
- Use conventional prefixes: `docs:`, `feat:`, `chore:`, `ci:`, `refactor:`.
- Each commit should communicate one logical change and include context in the body if needed.

## Issue Lifecycle
1. Open an issue using the **Planning** or **Research Note** template.
2. Apply labels and milestone (see sections below).
3. Assign yourself (default automation also assigns `@ganesh47`).
4. Move the card on the project board from **Backlog** → **Selected** → **In Progress** → **Review** → **Done**.

## Pull Request Workflow
- Reference the associated issue and spec task in the PR description (`Closes #X`, cites `T0YY`).
- Ensure the polyglot validation commands stay green before requesting review:
  - API: `cd packages/api && pnpm lint && pnpm vitest run`
  - CLI: `cd packages/cli && uv run ruff check . && uv run pytest`
  - Connectors: `cd packages/connectors/java && mvn --batch-mode verify`
  - Optional but encouraged: `docker compose -f docker/api/compose.yml up --build --detach` smoke test, `docker build` for CLI/connector, and SBOM/signing scripts.
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

## Polyglot Build & Validation Commands

| Scope | Command(s) | Notes |
|-------|------------|-------|
| API (TypeScript) | `cd packages/api && pnpm lint && pnpm vitest run` | Node.js 20 + Fastify + Drizzle; `.pnpm-store` lives in-repo for CI. |
| CLI (Python) | `cd packages/cli && uv run ruff check . && uv run pytest` | Typer/SQLAlchemy stack; fixtures stay in `packages/cli/tests`. |
| Connectors (Java) | `cd packages/connectors/java && mvn --batch-mode verify` | Java 21 + Spring Boot template with Spotless/Checkstyle enforced. |
| Docker images | `docker buildx build -f docker/api/Dockerfile .` etc. | API/CLI/connector images publish to GHCR with SBOM + Cosign; see `docker/README.md`. |

## Automation
- `stack-build.yml` runs pnpm/uv/maven lint+test suites, Hadolint, Spectral, Docker Buildx, and SBOM signing for every PR and merge to `main`, and publishes API/CLI/connector images to GHCR when on `main`.
- Link checks: Lychee link checker nightly and on PRs touching docs.
- Proposal snapshot: build & archive HTML/PDF on merge to `main` (planned).
- Spec sync: `Sync Spec Tasks` workflow (weekly and on demand) reads `specs/tasks.json`
  and ensures each entry has a corresponding GitHub issue with the right labels.

## Working With Agents
- Capture task context in issues so autonomous agents can pick up work.
- Use checklists in issues to track progress when multiple agents share a task.
- Summarize findings in comments before handing off.

## Getting Started Checklist
1. Clone the repo and run `gh repo sync` if needed.
2. Read the open issues in the project board and pick the next dated spec task.
3. Create a feature branch named `NNN-short-name`, run the `.specify/scripts/bash/check-prerequisites.sh` command, and review `specs/<NNN-...>/plan.md` + `tasks.md`.
4. Implement the task following the spec-driven workflow (tests first, then implementation, then docs), updating checklists and issues as you finish checkpoints.
5. Run the polyglot validation commands, open a PR with references, and keep CI green before/after merge.
