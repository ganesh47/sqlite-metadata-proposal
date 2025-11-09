<!--
Sync Impact Report
Version: 0.0.0 -> 1.0.0
Modified Principles:
- Template Principle 1 -> I. Code Quality Is Enforced
- Template Principle 2 -> II. Testing Proves Every Change
- Template Principle 3 -> III. Experience Consistency Across Surfaces
- Template Principle 4 -> IV. Performance Budgets Are Contracts
- Template Principle 5 -> V. Spec-Driven Delivery
Added Sections:
- Specification Sources & Usability Standards
- Development Workflow & Quality Gates
Removed Sections:
- None
Templates Requiring Updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->

# SQLite Metadata Proposal Constitution

## Core Principles

### I. Code Quality Is Enforced
- **Mandates**: Every change must leave `sqlite-metadata-system.md`, `docs/process.md`, and supporting CLI/API docs accurate; missing updates block merges. Linting, formatting, and static-analysis issues are fixed, not muted. Shared modules must stay modular—introduce extension points instead of duplicating logic.
- **Rationale**: High-signal documentation plus clean code keeps this proposal trustworthy for both humans and automation and reduces downstream integration risk.

### II. Testing Proves Every Change
- **Mandates**: Tests precede implementation for all functionality (unit, integration, CLI, and documentation validation where applicable). Each PR identifies the tests that fail before the change and adds new coverage for regressions discovered. Flaky tests are treated as P0 bugs.
- **Rationale**: The platform depends on SQLite correctness and graph semantics—without deterministic tests, future contributors cannot safely evolve the system.

### III. Experience Consistency Across Surfaces
- **Mandates**: API responses, CLI commands, docs, and UI guidelines share one contract: pagination objects, error payloads, and metadata fields must match the shapes in the proposal. Any UX change ships with updated quickstarts, examples, and demo scripts so humans can reproduce the flow end-to-end.
- **Rationale**: The same proposal powers API, CLI, and console work; keeping user touchpoints aligned prevents costly migrations and UX drift.

### IV. Performance Budgets Are Contracts
- **Mandates**: Default budgets are `<200ms p95` for writes, `<100ms p95` for reads, `<5s` for CLI batch actions, and `<256MB` RSS per process unless the spec explicitly grants an exception. Instrumentation (metrics, logs, or traces) proving compliance must be part of the implementation, and exceeding a budget blocks release.
- **Rationale**: SQLite enables edge/self-hosted deployments only when latency and resource ceilings are honored; budgets keep the project viable on constrained hardware.

### V. Spec-Driven Delivery
- **Mandates**: Work starts from the living proposal (`sqlite-metadata-system.md`), `docs/process.md`, relevant `docs/notes/*.md`, and feature folders under `specs/`. Requirements, acceptance criteria, and tasks stay traceable to those sources, and no code merges without updating the underlying spec/plan.
- **Rationale**: The repository exists to keep the proposal executable; aligning every change with documented intent ensures downstream automation always consumes a complete, current specification.

## Specification Sources & Usability Standards

1. `sqlite-metadata-system.md` is the canonical architecture + product narrative; amendments must cite the section and describe how usability or workflow improves.
2. `docs/process.md` defines collaboration workflow; updates to review rules, branching, or automation must propagate here before teams act on them.
3. `docs/project-readme.md` and `README.md` expose onboarding context; keep their “Quick Links” accurate so new contributors can load the current spec without guesswork.
4. `docs/notes/YYYY-MM-DD.md` capture research; reference the latest applicable note inside specs to show evidence for decisions.
5. `specs/` (plus `specs/tasks.json`) houses feature-level specs; ensure each spec links back to its parent section in the main proposal and includes testable acceptance criteria so it can be executed as-is.

## Development Workflow & Quality Gates

- Branching, labeling, and review rules follow `docs/process.md`; deviations require explicit approval recorded in the spec or ADR.
- Each feature flow: issue → plan (`/specs/<feature>/plan.md`) → spec → tasks → implementation. Skipping a document is prohibited unless the constitution is amended.
- Pull requests must demonstrate compliance with all five principles via checklists in descriptions (code quality, tests, UX, performance, spec sync) before review.
- CI MUST run markdown lint, link checks, and the relevant automated tests; failures block merge until resolved.
- Release notes summarize the spec sections touched so stakeholders can map deployments back to proposal clauses.

## Governance

1. **Authority**: This constitution supersedes any conflicting guidance; when doubt exists, defer to the stricter interpretation of these principles.
2. **Amendments**: Open a PR referencing the affected sections, update the Sync Impact Report, and secure review from at least one maintainer plus one domain expert (architecture, testing, or UX). Provide migration notes for work in flight.
3. **Versioning**: Use semantic versioning—major for principle/governance rewrites, minor for new principles or mandatory processes, patch for clarifications. Record every bump in the Version line below and in release notes.
4. **Compliance Reviews**: Before merging significant work (new module, performance change, workflow change), reviewers confirm that the Constitution Check in the plan template passes and that instrumentation/tests prove ongoing adherence.

**Version**: 1.0.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-09
