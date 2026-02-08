<!--
  Sync Impact Report
  ==================
  Version change: (template) → 1.0.0
  Bump rationale: MAJOR — first ratification, all principles new.

  Added principles:
    I.   Content-First Design
    II.  Offline-First Data
    III. Domain-Driven Design with CQRS
    IV.  Principled Simplicity
    V.   Test-First Imperative
    VI.  Docker-Only Execution

  Added sections:
    - Preamble (product identity)
    - Technical Constraints (tech stack, visual identity)
    - Development Workflow (git-flow, SDD, documentation policy)
    - Governance

  Removed sections: None (first version)

  Template sync status:
    ✅ .specify/templates/plan-template.md — no changes needed;
       Constitution Check section is dynamically filled by /speckit.plan.
    ✅ .specify/templates/spec-template.md — no changes needed;
       generic structure compatible with all principles.
    ✅ .specify/templates/tasks-template.md — no changes needed;
       task phases and ordering unaffected.
    ✅ .claude/commands/speckit.plan.md — reads constitution dynamically.
    ✅ .claude/commands/speckit.analyze.md — extracts MUST/SHOULD
       normative statements; principles written accordingly.
    ✅ README.md — minimal; no constitution references to update.

  Deferred TODOs: None.
-->

# Hanzi Ruby Lens Constitution

## Preamble

Hanzi Ruby Lens is a Windows desktop application for Mandarin Chinese
learners. It provides an elegant reading interface with pinyin ruby
annotations for any Chinese text (traditional or simplified), generated
via LLM and correctable by the user.

Born from the study of 知識的365堂課 (a traditional-character translation
of *The Intellectual Devotional* by David S. Kidder and Noah D. Oppenheim),
the app is designed to support any book in Chinese.

**The Chinese characters are the star. Everything else serves them.**

## Core Principles

### I. Content-First Design

The Chinese text and its ruby annotations MUST be the visual focus at
all times.

- UI chrome MUST be minimized: subtle borders, restrained color,
  generous whitespace.
- Controls MUST NOT compete with text; they appear on hover or in
  dedicated sections.
- Cards, lists, and panels MUST follow a consistent spacing scale.
- State changes MUST use gentle CSS transitions (200–300 ms ease).
- Both light and dark modes MUST be first-class; neither is an
  afterthought.

### II. Offline-First Data

All generated data MUST be stored locally. Once a content unit has been
processed, it MUST be readable and studyable entirely offline without
further LLM calls.

- All data MUST reside in a local SQLite database.
- The database file MUST be directly exportable and importable as an
  SQLite file.
- Export and import MUST be easily accessible to the user.
- No feature SHOULD require network connectivity for previously
  processed content.

### III. Domain-Driven Design with CQRS

The application MUST follow DDD architecture with the CQRS pattern.

- Domain logic MUST be expressed through bounded contexts, aggregates,
  entities, and value objects.
- Commands (writes) and Queries (reads) MUST be separated.
- Domain events SHOULD drive cross-context communication.
- The domain model MUST NOT depend on infrastructure concerns.

### IV. Principled Simplicity

SOLID, DRY, KISS, and YAGNI principles MUST be applied without
compromising DDD and CQRS.

- No speculative or "might need" features MUST be implemented.
- Abstractions MUST be justified by actual (not hypothetical)
  requirements.
- When DDD/CQRS and YAGNI appear to conflict, DDD/CQRS wins — but
  unnecessary DDD ceremony (e.g., aggregates for trivial CRUD) SHOULD
  be avoided.
- Code MUST be simple enough that its intent is obvious; comments
  explain "why", not "what".

### V. Test-First Imperative

Tests MUST be extensive and MUST run exclusively inside Docker
containers.

- All test execution MUST happen inside Docker containers.
- Test coverage MUST include contract, integration, and unit levels.
- Tests SHOULD be written before implementation (TDD red-green-refactor).
- No test infrastructure SHOULD exist on the local machine.

### VI. Docker-Only Execution

All code execution (development, testing, building) MUST happen
exclusively inside Docker containers.

- The local machine MUST only have NodeJS and NPM installed.
- Development servers, build processes, and test runners MUST run in
  Docker.
- Docker Compose SHOULD orchestrate multi-container setups.
- Reproducibility across environments MUST be guaranteed by
  containerization.

## Technical Constraints

### Technology Stack

These choices are constitutional and MUST NOT change without a formal
amendment.

- **Desktop framework**: Tauri 2 (Rust backend)
- **Platform**: Windows
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite, embedded locally, accessed via Tauri's Rust
  backend
- **LLM integration**: Claude CLI with the latest Opus model

### Visual Identity

The visual identity is refined, warm, and typographically focused.

- Chinese text MUST use Noto Sans CJK TC (or Noto Serif CJK TC for a
  more literary feel).
- Pinyin and UI text SHOULD use Inter or system sans-serif.
- Ruby annotations MUST render at roughly 50 % of base Chinese font
  size.
- Ruby annotations MUST use the accent color for visual distinction.

## Development Workflow

### Git-Flow with Claude Autonomy

- The project MUST follow the official git-flow methodology.
- Claude Code MUST be fully autonomous on git operations without
  waiting for human intervention.
- Branch naming MUST follow the Spec Kit convention: `NNN-feature-name`.

### Specification-Driven Development

- Spec Kit MUST be the source of truth for all development.
- Feature specs, plans, and tasks MUST be generated via Spec Kit
  commands.
- No implementation SHOULD begin without a ratified spec and plan.

### Documentation Policy

- Documentation MUST be generated and kept up to date for human
  consultation only.
- Documentation MUST NOT interfere with Spec Kit specs.
- PlantUML diagrams MUST be treated as first-class citizens in
  documentation.

## Governance

This constitution is the supreme authority for the Hanzi Ruby Lens
project. All specifications, plans, tasks, and implementations MUST
comply.

- Constitution violations detected by `/speckit.analyze` are
  automatically CRITICAL.
- Amendments require explicit rationale, review, and a formal
  `/speckit.constitution` invocation.
- Principles use **MUST** for non-negotiable rules and **SHOULD** for
  strong recommendations.
- When a SHOULD rule is violated, justification MUST be documented.

**Version**: 1.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-08
