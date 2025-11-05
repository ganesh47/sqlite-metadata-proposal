# SQLite Metadata Proposal

This repository hosts a living proposal for building a cloud-agnostic metadata
platform on top of SQLite. The goal is to capture design decisions, research
notes, and implementation plans in a highly collaborative format that works for
both humans and automation agents.

## Quick Links

- [Proposal](./sqlite-metadata-system.md)
- [Working Agreement](./docs/process.md)
- [Research Notes](./docs/notes)
- [Issues](https://github.com/ganesh47/sqlite-metadata-proposal/issues)
- Project Board: _Created automatically once the classic project API becomes
  available_

## Getting Started

```bash
git clone https://github.com/ganesh47/sqlite-metadata-proposal.git
cd sqlite-metadata-proposal
gh repo sync
```

1. Review open issues and the project board to understand current priorities.
2. Open or select an issue (Planning / Research template) and self-assign.
3. Create a feature branch (`git switch -c docs/section-update-<issue#>`).
4. Make changes, update the proposal or notes, and open a pull request using
   the template.
5. Ensure CI checks (markdown lint, link check) pass before requesting review.

## Automation

- `markdown-lint`: Runs on PRs and pushes touching `.md` to enforce style
  consistency.
- `link-check`: Runs on PRs and a weekly schedule to keep references fresh.
- `auto-assign`: Runs on PRs and issues to auto-assign work to @ganesh47.

The project board uses the `Stage` single-select field with steps **Backlog →
Selected → In Progress → Review → Done**.

## Collaboration Rules

- Branch per task; keep history tidy with squash merges.
- Reference issues in commits/PRs (`Closes #<id>`).
- Capture context in `docs/notes/YYYY-MM-DD.md` for research spikes.
- Use labels + milestones to track progress toward proposal maturity.

## Roadmap Milestones

1. **M1 – Foundations**: Complete scaffolding, workflows, and baseline proposal
   structure.
2. **M2 – Architecture Draft**: Produce the first end-to-end design narrative.
3. **M3 – Implementation Plan**: Translate the proposal into actionable project
   work.

## Support

Open a discussion if you have questions or suggestions: _Discussions will be
enabled soon to support broader async collaboration._
