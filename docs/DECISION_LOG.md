# Decision Log
# dbt Model Mate

This document records significant architectural and product decisions made during the design and initial development of dbt Model Mate. Each entry captures the decision, the context that motivated it, the options considered, and the rationale for the choice made.

---

## DEC-001: Extension Architecture — Feature Plugin System

**Date:** 2026-03-21
**Status:** Adopted

### Decision
Use a feature plugin architecture where each capability is a self-contained class implementing a `Feature` interface, receiving shared services via dependency injection through a `ServiceContainer`.

### Context
The extension needs to satisfy two equally important constraints: any team member should be able to add new functionality through a simple, repeatable pattern without deep VS Code expertise, and the architecture must support robust capabilities over time including multi-step workflows, shared services, diagnostics, and richer UI surfaces.

### Options Considered

**Option A: Command Registry with Handler Modules**
Each command is a file exporting a handler function. A central registry maps command IDs to handlers.
- Simple for the first few features
- No clean way to share state or services between commands
- Diagnostics, code actions, and tree views do not fit the command pattern
- Becomes a flat, unstructured list as the codebase grows

**Option B: Feature Plugin System (chosen)**
Each feature is a class implementing a `Feature` interface. Features receive shared services via injection and return VS Code disposables from `activate()`.
- Small upfront learning cost — contributors must understand one interface
- Services are shared and injected, not duplicated across features
- Accommodates commands, diagnostics, code actions, tree views, and webviews without changing the model
- Features are independently testable with mock services

**Option C: Layered Architecture with Contribution Manifests**
Features declare capabilities in a typed manifest. A resolver wires them up at activation.
- High learning curve — contributors must understand manifest schema, resolver, and layer boundaries
- Good for large teams; too much ceremony for this context

### Rationale
Option B provides the right balance. The `Feature` interface is a single learnable contract. The small upfront cost pays out immediately: contributors always know where to look, what to change, and how to test. The model scales from a one-command feature to a multi-step pipeline with diagnostics without changing the registration pattern.

---

## DEC-002: AI Provider Strategy — Named Profiles with No Auto-Fallback

**Date:** 2026-03-21
**Status:** Adopted

### Decision
AI provider access is managed through named profiles. Multiple profiles can be configured, one is active at a time, and the extension never automatically switches profiles on failure. Failures surface as user notifications with explicit choices.

### Context
Initial users have GitHub Copilot access via organizational subscription, which provides access to multiple models. The team may also want direct API access via Anthropic or OpenAI keys. The question was how to manage these configurations and what to do when a provider is unavailable.

### Options Considered

**Automatic fallback**
If the active profile fails, automatically try the next configured profile.
- Silent, reduces friction in the happy path
- Hides failures that the user should know about
- User loses awareness of which provider and model is actually being used
- Could route to a more expensive or less capable model without the user knowing

**User-controlled profiles with no auto-fallback (chosen)**
If the active profile fails, alert the user and let them decide: switch, retry, or configure.
- Explicit — the user always knows which provider and model is active
- Failures are surfaced immediately rather than hidden
- User remains in control of decisions that have cost and quality implications

### Rationale
The "explicit over implicit" principle. Switching AI providers has implications for output quality, cost, and model capabilities. These are decisions the user should make consciously, not decisions the extension should make silently on their behalf.

---

## DEC-003: API Key Storage — VS Code SecretStorage

**Date:** 2026-03-21
**Status:** Adopted

### Decision
API keys for non-Copilot providers (Anthropic, OpenAI) are stored in VS Code `SecretStorage`. Profile metadata (provider, model, name) is stored in `settings.json`. Keys are never written to `settings.json` or any file that could be committed to source control.

### Context
Direct API provider keys are sensitive credentials. They need to be accessible to the extension at call time but must not appear in user-visible settings files or be accidentally committed to a repository.

### Rationale
VS Code `SecretStorage` is encrypted per-machine and per-extension. It is the VS Code-endorsed mechanism for storing extension secrets. The profile in `settings.json` looks clean with no key or placeholder — only the provider and model. Keys are fetched from `SecretStorage` at call time and held in memory no longer than necessary.

---

## DEC-004: AI Provider — GitHub Copilot via VS Code Language Model API

**Date:** 2026-03-21
**Status:** Adopted

### Decision
GitHub Copilot integration uses the VS Code Language Model API (`vscode.lm`) rather than direct API calls. This is the primary provider implementation for the initial user base.

### Context
Initial users authenticate via GitHub and have Copilot access through an organizational subscription. The VS Code Language Model API allows extensions to use models available through the user's Copilot subscription without managing API keys.

### Rationale
- Zero authentication friction — users are already signed in via GitHub in VS Code
- Access to multiple models (Claude, GPT, Gemini) through one subscription
- Microsoft handles rate limiting, billing, and model routing
- No API key management required for the common case

The minimum VS Code version was set to `^1.90.0` to ensure `vscode.lm` availability.

---

## DEC-005: dbt Project Detection — Raw YAML Primary, Manifest Optional

**Date:** 2026-03-21
**Status:** Adopted

### Decision
The `DbtProjectService` parses raw YAML source files as the primary data source. `target/manifest.json` is used as an optional enrichment layer when present, providing compiled column types and descriptions. The manifest is never required.

### Context
Different teams use dbt differently. Some compile frequently and have an up-to-date manifest. Others work primarily from source files. Requiring a compiled manifest would exclude teams that have not run `dbt compile` recently, or environments where the manifest is not accessible.

### Rationale
Raw YAML parsing works everywhere, with no build step required. The manifest enrichment is additive — when present it improves column type and description data, but its absence does not degrade core functionality. Features should work on any dbt project that has YAML source files, regardless of whether it has been compiled.

---

## DEC-006: dbt Version Target — 1.7+ / MetricFlow

**Date:** 2026-03-21
**Status:** Adopted

### Decision
The extension targets dbt 1.7 and above, using the MetricFlow semantic model schema (`semantic_models:` block). The legacy `metrics:` block syntax is not supported.

### Context
dbt MetricFlow was introduced as the semantic layer framework in dbt 1.6 and stabilized in 1.7. Two incompatible YAML schemas exist: the MetricFlow schema (`semantic_models:`) and the pre-MetricFlow `metrics:` schema. Supporting both would significantly complicate prompt templates, YAML parsing, and validation logic.

### Rationale
Targeting 1.7+ allows the extension to commit to a single, current schema. Teams on older versions receive a version compatibility warning at activation. The MetricFlow schema is the actively maintained standard — building against it keeps the extension aligned with dbt's direction.

---

## DEC-007: Feature Tier Classification — Foundational vs Development

**Date:** 2026-03-22
**Status:** Adopted

### Decision
Features are classified into two tiers via a `tier: FeatureTier` property on the `Feature` interface. `'foundational'` features build and refresh context documents. `'development'` features perform semantic layer work for the user.

### Context
The BTL AgenticAI PoC documents identified a key insight: AI agents without curated project context produce code that compiles but violates team standards. The solution is a two-category system where some features build knowledge (foundational) and others consume it (development). The question was how to represent this distinction in the extension architecture.

### Options Considered

**Separate interfaces or base classes**
`FoundationalFeature` and `DevelopmentFeature` as distinct types.
- Increases complexity — contributors must choose which type to extend
- No meaningful behavioral difference between the two types
- Would require more interface knowledge to contribute

**Tier as an attribute (chosen)**
A single `Feature` interface with a `tier` property.
- No additional complexity for contributors — same interface, same pattern
- Enables UI grouping and documentation differentiation
- Tier is a classification, not a behavioral contract

### Rationale
The tiers describe what a feature does, not how it is built. Using a property rather than separate types keeps the contributor experience identical for both tiers while enabling the UI to surface them differently.

---

## DEC-008: Context Documents — Manual RAG with UUID Provenance

**Date:** 2026-03-22
**Status:** Adopted

### Decision
Project context (architecture, naming conventions, patterns, source index) is stored as curated markdown files in `.dbt_model_mate/context/`. Each document is assigned a UUID at generation time. Development features that use these documents stamp the IDs of the documents they consumed as a provenance block in their output.

### Context
AI models have no persistent memory and no awareness of the project's conventions. Injecting curated project context into prompts — sometimes called manual RAG — significantly improves output quality. The question was how to structure this context and how to track which context state produced a given output.

### Options Considered

**No context management**
Features build prompts from whatever YAML they can read at call time.
- Simple to implement
- Output quality is limited — the AI has no knowledge of team conventions
- Not differentiated from generic AI coding assistance

**Full RAG pipeline**
Chunk documents into a vector store, perform semantic retrieval at call time.
- Maximum relevance — only the most pertinent context is injected
- Significant infrastructure: vector store, embedding model, retrieval pipeline
- Premature for the current scale and team size

**Manual RAG with curated documents (chosen)**
Foundational features generate curated markdown summaries. Development features inject relevant documents whole.
- No infrastructure beyond the file system
- Full control over what context the AI receives
- Natural evolution path to vector store if the project grows
- UUID provenance allows tracing any generated output to the context state that produced it

### Rationale
Manual RAG is the pragmatic choice for the current scale. The BTL PoC demonstrated that this approach produces materially better output than context-blind generation. The UUID provenance system adds an important capability: generated files carry a record of their context lineage, which enables staleness detection and reproducibility.

The natural evolution is: manual RAG → chunked vector store → MCP server for dynamic retrieval. The structure of the context documents does not need to change for this evolution — only how they are stored and retrieved changes.

---

## DEC-009: Context Store Location — `.dbt_model_mate/context/`

**Date:** 2026-03-22
**Status:** Adopted

### Decision
Context documents are stored at `.dbt_model_mate/context/` within the workspace root. This directory is excluded from dbt processing via `.dbtignore`.

### Context
Context documents need to persist between VS Code sessions, be accessible to all features, and not interfere with the dbt project itself.

### Rationale
Storing in the workspace root makes context documents part of the project, allowing them to be committed to source control if the team chooses (sharing context across team members). The `.dbt_model_mate/` prefix namespaces the directory clearly. Excluding via `.dbtignore` ensures dbt never tries to parse the markdown files as models.

---

## DEC-010: Extension Name — dbt Model Mate

**Date:** 2026-03-22
**Status:** Adopted

### Decision
The extension is named **dbt Model Mate**.

### Context
Several naming directions were explored: precision-oriented names (Grain, Stratum, Tessera, Meridian), friendly compound names (Semantic Bench, Semantic Stitch, Semantic Weaver), teammate metaphors (Semantic Mate, Semantic Sherpa, Semantic Sidekick), and dbt-prefixed compounds (dbt SemanticMate, dbt LayerMate, dbt MetricMate).

### Rationale
"dbt Model Mate" was selected because:
- The `dbt` prefix signals the domain immediately to the target audience
- "Model" is the foundational concept in dbt — every practitioner knows it
- "Mate" positions the tool as a collaborator and knowledgeable peer, not an authority or oracle
- The name captures the intern metaphor: as capable and helpful as a really good intern who knows the codebase well
- It reads naturally in conversation: "just run it through Model Mate", "Model Mate flagged that"

---

## DEC-011: CI Pipeline — Three Jobs, No Automatic Release

**Date:** 2026-03-22
**Status:** Adopted

### Decision
The CI pipeline runs three jobs on every push and pull request: lint, typecheck, and test. A package job validates the `.vsix` builds cleanly and uploads it as an artifact. A release job (marketplace publish) is deferred until the extension is ready for public distribution.

### Rationale
The three core jobs (lint, typecheck, test) provide the minimum useful signal for contributors: does it follow style, does it type-check, do the tests pass. The package job catches issues that only appear when building the full extension. Deferring the release job avoids premature marketplace presence while the extension is in active early development.
