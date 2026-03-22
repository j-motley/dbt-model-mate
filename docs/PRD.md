# Product Requirements Document
# dbt Model Mate

**Version:** 0.1.0
**Status:** In Development
**Last Updated:** 2026-03-22

---

## 1. Purpose

This document defines the product requirements for dbt Model Mate, a VS Code extension for analytics engineering teams that own the semantic layer in a dbt-centric data ecosystem.

---

## 2. Problem Statement

Analytics engineering teams working on dbt semantic layers face a set of compounding challenges:

- Semantic layer work — generating, repairing, validating, and improving MetricFlow definitions — is repetitive, knowledge-intensive, and error-prone
- Generic AI coding assistants produce syntactically valid output that violates team conventions, because they have no awareness of the project's architecture, naming standards, or existing patterns
- Onboarding new team members to the semantic layer requires absorbing context that is scattered across the codebase with no single reference point
- There is no structured way for team members to build and share AI-assisted workflows specific to their semantic layer pain points

The core challenge is not that AI tools are unavailable — it is that AI tools without curated project context produce output that compiles but does not belong.

---

## 3. Vision

dbt Model Mate is a platform for analytics engineering teams to build their own AI-assisted workflows for the semantic layer. The extension ships with a set of core features, but the real value comes from team members adding functionality that solves their specific pain points.

> A teammate who feels friction in their semantic layer workflow does not raise a feature request. They build the feature.

The extension is as good as a knowledgeable intern: available on demand, familiar with the codebase when given the right context, capable of handling repetitive or complex tasks, and never the final decision-maker.

---

## 4. Target Users

**Primary:** Analytics engineers and data engineers who own, build, or maintain a semantic layer built with dbt (dbt 1.7+).

**Secondary:** Contributors to the extension itself — team members who identify workflow pain and build features to address it.

**Environment:** Teams using dbt in a large, multi-model codebase where:
- Semantic layer conventions are established but not always documented
- New data products require understanding patterns accumulated over years of development
- GitHub Copilot access is available via organizational subscription

---

## 5. Goals and Non-Goals

### Goals

- Reduce friction in semantic layer development through AI-assisted generation, repair, validation, and analysis
- Produce AI output that conforms to team conventions, not just dbt syntax
- Give team members a simple, repeatable pattern for adding new AI-assisted workflows
- Surface AI usage, model, and session information transparently
- Support both context-blind (quick) and context-aware (high-quality) AI workflows

### Non-Goals

- General-purpose dbt development assistance (pipeline models, SQL authoring)
- Predictive simulation or offline warehouse forecasting
- Replacing human review of generated output — all output is a starting point, not a final product
- Multi-agent orchestration or automated build pipelines

---

## 6. User Stories

### Semantic Layer Development

- As an analytics engineer, I want to generate a starter semantic model definition for a dbt model so that I have a correct starting point without writing boilerplate from scratch.
- As an analytics engineer, I want the generated semantic model to follow my team's naming conventions and patterns so that I spend less time editing AI output to match our standards.
- As an analytics engineer, I want to validate references and relationships in my semantic YAML so that I catch inconsistencies before running dbt.
- As an analytics engineer, I want to see suggestions for missing dimensions, measures, or entities so that I don't overlook coverage gaps.

### Context Management

- As an analytics engineer, I want to generate context documents from my dbt project so that subsequent AI operations are aware of our architecture and conventions.
- As an analytics engineer, I want to see which context documents were used to generate a file so that I know whether to regenerate it after a context refresh.
- As an analytics engineer, I want to know when my context documents are stale so that I can refresh them before building new semantic models.

### AI Profile Management

- As a user, I want to configure multiple AI provider profiles so that I can switch between GitHub Copilot and a direct API key depending on my needs.
- As a user, I want to see which AI profile and model I am currently using at all times.
- As a user, I want to be alerted when my active AI profile becomes unavailable so that I can decide how to proceed — not have the extension decide for me.

### Contribution

- As a team member, I want to add a new feature to the extension by following a simple pattern so that I do not need deep VS Code extension expertise to contribute.
- As a team member, I want to raise a PR to the extension repository to share a feature I have built so that the whole team benefits.

---

## 7. Feature Inventory

Features are classified into two tiers:

- **Foundational** — scan the project and build or refresh context documents. Run occasionally when the project changes.
- **Development** — perform semantic layer work for the user, optionally consuming context documents.

### Current Features (v0.1.0)

| Feature | Tier | Description |
|---|---|---|
| Generate Context Documents | Foundational | Scans the dbt project and produces canonical context documents: architecture, naming conventions, source index, and pattern library. Each document is assigned a UUID at generation time. |
| Generate Semantic Model (Generic) | Development | Generates a MetricFlow semantic model starter for a selected dbt model. Context-blind — uses only the model's own YAML. |
| Generate Contextual Semantic Model | Development | Generates a MetricFlow semantic model using available context documents. Stamps the context document IDs as provenance in the output. |

### Planned Features

| Feature | Tier | Description |
|---|---|---|
| Validate References | Development | Validates `ref()` and `source()` references in semantic YAML against the dbt project |
| Suggest Metrics | Development | Suggests metric definitions based on existing measures and dimensions |
| Classify Models | Foundational | Classifies existing models by layer role and archetype |
| Repair Semantic Model | Development | Identifies and repairs incomplete or inconsistent semantic definitions |
| Architecture Guidance Panel | Development | Surfaces architectural recommendations for the active model |
| AI Usage Panel | Development | Shows current model, token usage, remaining credits, and request history |

---

## 8. AI Provider Support

The extension supports multiple AI providers through a named profile system:

| Provider | Authentication | Notes |
|---|---|---|
| GitHub Copilot | VS Code GitHub session | Primary for teams with Copilot subscriptions. No API key required. |
| Anthropic | API key via VS Code SecretStorage | Direct Claude API access |
| OpenAI | API key via VS Code SecretStorage | GPT model access |

**Profile behavior:**
- Users configure one or more named profiles
- Only one profile is active at a time
- If an active profile becomes unavailable, the extension alerts the user — it does not automatically switch
- API keys are stored in VS Code SecretStorage and never written to `settings.json`

---

## 9. Context Store

The extension maintains a context store at `.dbt_model_mate/context/` in the workspace root. This directory is excluded from dbt via `.dbtignore`.

Context documents are markdown files generated by foundational features. Each document:
- Is assigned a UUID at generation time, stamped in a machine-readable header
- Can be checked for staleness (default threshold: 24 hours)
- Is injected into AI prompts by development features that are context-aware

### What the context documents are doing

When you call an AI model, it only knows what you put in the prompt. It has no persistent memory between calls, no awareness of your codebase, and no knowledge of your team's conventions. Every call starts from zero.

Context documents solve this by giving the AI a curated, bounded summary of your project — your architecture, your naming conventions, your patterns — injected into the prompt at call time. The AI reads them as part of the prompt and uses them to produce output that fits your codebase rather than generic output.

That's the core idea. Everything else is a variation on how that injection happens.

### How it relates to each pattern

#### RAG (Retrieval Augmented Generation)

RAG is the formal version of what context documents are doing manually. 
In a RAG system:

Documents are chunked, embedded as vectors, and stored in a vector database
At call time, the query is embedded and the most semantically relevant chunks are retrieved
Those chunks are injected into the prompt automatically
Our context documents do the same thing but without the infrastructure. Instead of a vector database doing semantic retrieval, a human (or the extension) decides which documents are relevant and injects them whole. It's RAG with curation replacing retrieval.

The tradeoff: RAG scales to thousands of documents and retrieves exactly what's needed. Our approach requires fewer moving parts but requires someone to decide what context matters. For a focused tool like dbt Model Mate, curated context is actually more reliable — you know exactly what the AI is reading.

If the codebase grows large enough that curated documents become unwieldy, the natural evolution is to chunk the context documents and put them in a vector store, making the injection automatic. The documents themselves don't change — just how they're retrieved.

#### MCP (Model Context Protocol)

MCP is a protocol for giving AI models structured access to tools and data sources at call time. Instead of injecting text into a prompt, an MCP server exposes callable tools — "look up this source table", "get the schema for this model", "list all semantic models in this product" — and the AI decides when to call them.

Our context documents are a static, pre-computed version of what an MCP server would serve dynamically. Where an MCP tool might answer "what are the columns in the orders table?" on demand, our source index document answers it ahead of time by pre-indexing all the sources.

The relationship: context documents are a good stepping stone toward MCP. Once you have a well-structured source index document, you already know what an MCP tool for source lookup would need to return. Building the MCP server becomes a matter of converting the document's content into structured tool responses.

#### System Instructions / Custom Instructions

System instructions are persistent instructions that shape how the AI behaves across all calls in a session — things like "you are a dbt expert", "always use snake_case", "never suggest deprecated syntax". In Copilot this is .github/copilot-instructions.md. In our AiService it's the systemPrompt field in AiOptions.

Context documents are different from system instructions in an important way. System instructions describe how to behave. Context documents describe what to know about this project specifically. Both go into the prompt, but they serve different purposes.

In practice, our extension uses both:

The systemPrompt in each feature's AI call sets behavioral instructions ("you are a dbt MetricFlow expert, output only valid YAML")
The context documents provide project-specific knowledge ("here is how this team names their models")
Fine-tuning
Fine-tuning is worth mentioning because people sometimes confuse it with RAG. Fine-tuning bakes knowledge into the model's weights through additional training. It's expensive, irreversible, and becomes stale as your codebase evolves. Context documents are the opposite — cheap to generate, easy to refresh, and always reflect the current state of the project. For a codebase that changes regularly, context injection is almost always the right approach over fine-tuning.

When a development feature uses context documents, it stamps their IDs as a provenance block at the top of its output. This allows any generated file to be traced back to the context state that produced it.

### Canonical Context Document Types

| Type | Description |
|---|---|
| `architecture` | Project structure, layers, data flow |
| `naming_conventions` | File, model, column, and semantic naming rules |
| `source_index` | Sources, tables, entity relationships |
| `pattern_library` | Recurring semantic model patterns and recommendations |
| `governance_index` | Doc blocks, macros, tests inventory |
| `product_catalog` | Existing data products and model counts |

---

## 10. dbt Compatibility

- **Target version:** dbt 1.7 and above (MetricFlow semantic model schema)
- **Detection:** The extension activates when `dbt_project.yml` is present in the workspace root
- **Version check:** At activation, the extension reads `require-dbt-version` from `dbt_project.yml` and warns if the project is below 1.7.0
- **Source parsing:** Raw YAML source files are the primary data source. `target/manifest.json` is used as an optional enrichment layer when available.

---

## 11. Contribution Model

Any team member can add a feature to the extension by:

1. Creating a folder under `src/features/<featureName>/`
2. Implementing the `Feature` interface
3. Adding the feature to `src/features/index.ts`
4. Adding the command to `package.json`

No changes to core infrastructure are required. Features are isolated from each other and receive shared services via dependency injection. See `CONTRIBUTING.md` for full guidance.

---

## 12. Success Criteria

- A team member with no VS Code extension experience can add a working feature within a single session following `CONTRIBUTING.md`
- Generated contextual semantic models require materially less editing than context-blind output when context documents are current
- The extension activates cleanly on any dbt 1.7+ project without configuration beyond an AI profile
- AI profile unavailability is surfaced to the user without silent fallback or data loss
