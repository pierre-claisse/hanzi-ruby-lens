<!--
  Sync Impact Report
  ==================
  Version change: 2.0.0 → 3.0.0
  Bump rationale: MAJOR — removal of constitutional LLM dependency.
    The "LLM integration: Claude CLI with the latest Sonnet model"
    technical constraint is removed entirely. All references to LLM
    processing throughout the document are replaced with
    technology-neutral language ("text processing libraries").
    This is backward-incompatible: code that relied on Claude CLI
    as a constitutional guarantee can no longer cite it.

  Changed sections:
    - Preamble: "generated via LLM" → "generated via text processing
        libraries".
    - Core Principles > II. Offline-First Data: "without further LLM
        calls" → "without further processing".
    - Domain Language > Text: "reprocessed via LLM" → "reprocessed".
    - Domain Language > Word: "produced by LLM analysis of the full
        Text at creation time" → "produced by text processing of the
        full Text at creation time".
    - Technical Constraints > Technology Stack: removed bullet
        "LLM integration: Claude CLI with the latest Sonnet model".
      Added bullet "Text processing: native Rust libraries
        (dictionary-based segmentation and pinyin annotation)".

  Added sections: None.
  Removed sections: None.

  Template sync status:
    ✅ .specify/templates/plan-template.md — generic template; no
       LLM or Claude references to update.
    ✅ .specify/templates/spec-template.md — generic template; no
       LLM or Claude references to update.
    ✅ .specify/templates/tasks-template.md — generic template; no
       LLM or Claude references to update.
    ⚠ CLAUDE.md — contains "LLM: Claude CLI (Opus) for pinyin
       segmentation" and "processing.rs # Claude CLI integration"
       in project structure comments. These will be updated during
       feature 023 implementation when the files themselves change.

  Deferred TODOs: None.
-->

# Hanzi Ruby Lens Constitution

## Preamble

Hanzi Ruby Lens is a Windows desktop application for Mandarin Chinese
learners. It provides an elegant reading interface with pinyin ruby
annotations for any Chinese text (traditional or simplified), generated
via text processing libraries and correctable by the user.

Born from the study of 知識的365堂課 (a traditional-character translation
of *The Intellectual Devotional* by David S. Kidder and Noah D. Oppenheim),
the app is designed to grow into a personal library of annotated Chinese
texts, preserving the user's pinyin corrections across sessions.

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
further processing.

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

## Domain Language

All specifications, code, and documentation MUST use the following terms
consistently. These definitions are constitutional; any deviation MUST be
treated as a violation.

### Text

The complete body of Chinese content entered by the user. The application
holds a collection of Texts; there is no limit on their number.

- A Text MUST NOT be empty: it MUST contain at least one Chinese
  character.
- A Text is immutable once created: its raw Chinese content MUST NOT
  be replaced, edited, or reprocessed after initial processing.
- Only pinyin annotations on a Text's Words MUST remain correctable by
  the user.
- There is no autosave: persistence operations MUST be explicit user
  actions (e.g., confirming a pinyin correction).
- A Text is the aggregate root of the domain model.

### Word

An ordered segment of a Text, consisting of one or more Chinese
characters and their pinyin as a single unit. Words are produced by
text processing of the full Text at creation time.

- A Word MUST contain one or more Chinese characters and exactly one
  pinyin string representing the whole Word.
- Pinyin MUST be determined at the Word level, not the character level,
  because character pronunciation depends on word context
  (e.g., 覺 is "jué" in 覺得 but "jiào" in 睡覺).
- Pinyin MUST be displayed as a single unit per Word
  (e.g., "xiànzài" for 現在, not "xiàn zài").
- A Word's pinyin MUST be individually correctable by the user.
- A Word's corrected pinyin MUST persist permanently and MUST NOT be
  overwritten by any automatic process.
- A Chinese character MUST NOT exist as an independent domain entity.
  Characters are the string content of a Word, nothing more.

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
- **Text processing**: Native Rust libraries (dictionary-based
  segmentation and pinyin annotation)

### Visual Identity

The visual identity is refined, warm, and typographically focused.

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

**Version**: 3.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-22
