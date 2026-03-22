# Technical Architecture Document
# dbt Model Mate

**Version:** 0.1.0
**Status:** In Development
**Last Updated:** 2026-03-22

---

## 1. Overview

dbt Model Mate is a VS Code extension built on a feature plugin architecture. The system is designed around two equally important constraints: any team member should be able to add new functionality by following a simple, repeatable pattern, while the architecture must support robust capabilities over time without requiring that pattern to change.

The extension activates when a `dbt_project.yml` is detected in the workspace, indicating a dbt project is open.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        extension.ts                          │
│  1. Builds ServiceContainer                                  │
│  2. Initializes StatusBarManager                             │
│  3. Registers profile picker command                         │
│  4. Passes services to FeatureRegistry                       │
│  5. FeatureRegistry activates all features                   │
└────────────────────────┬─────────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │     FeatureRegistry     │
            │  Iterates allFeatures,  │
            │  calls activate(),      │
            │  collects disposables   │
            └────────────┬────────────┘
                         │ injects ServiceContainer
          ┌──────────────┼──────────────────────┐
          │              │                      │
    ┌─────▼──────┐ ┌─────▼──────┐        ┌──────▼──────┐
    │Foundational│ │Development │  ...   │ Development │
    │  Feature   │ │  Feature   │        │   Feature   │
    └────────────┘ └────────────┘        └─────────────┘
          │
          ▼
    ┌─────────────────────────────────────────┐
    │            ServiceContainer             │
    │  ai            AiService                │
    │  aiProfiles    AiProfileService         │
    │  dbtProject    DbtProjectService        │
    │  workspace     WorkspaceService         │
    │  diagnostics   DiagnosticsService       │
    │  contextStore  ContextStoreService      │
    │  vscodeContext ExtensionContext         │
    └─────────────────────────────────────────┘
```

---

## 3. Core Layer

### 3.1 Feature Interface

Every capability in the extension implements the `Feature` interface. This is the only contract contributors need to understand.

```typescript
interface Feature {
  readonly id: string;           // matches the VS Code command ID
  readonly displayName: string;  // shown in logs and error messages
  readonly tier: FeatureTier;    // 'foundational' | 'development'
  activate(services: ServiceContainer): Contribution[] | Promise<Contribution[]>;
  deactivate?(): void | Promise<void>;
}

interface Contribution {
  disposable: vscode.Disposable;
}
```

**Tier classification:**

| Tier | Purpose | Typical output |
|---|---|---|
| `foundational` | Scans the project, builds/refreshes context documents | Context store files |
| `development` | Performs semantic layer work for the user | YAML files, reports, diagnostics |

Both tiers are identical in terms of interface. The tier is a classification for UI grouping and documentation, not a behavioral distinction.

### 3.2 FeatureRegistry

`FeatureRegistry` iterates `allFeatures`, calls `activate()` on each, collects the returned disposables, and manages their lifecycle. If a feature fails to activate, the error is logged and surfaced as a notification — other features continue activating.

### 3.3 ServiceContainer

`ServiceContainer` is the dependency injection boundary. Features receive a `ServiceContainer` instance and call services through it. They never import services directly or instantiate them. This keeps features isolated from infrastructure details and fully testable with mock services.

```typescript
interface ServiceContainer {
  ai: AiService;
  aiProfiles: AiProfileService;
  dbtProject: DbtProjectService;
  workspace: WorkspaceService;
  diagnostics: DiagnosticsService;
  contextStore: ContextStoreService;
  vscodeContext: vscode.ExtensionContext;
}
```

### 3.4 Feature Registration

The only file contributors edit to register a new feature is `src/features/index.ts`:

```typescript
export const allFeatures: Feature[] = [
  // Foundational
  new GenerateContextDocumentsFeature(),

  // Development
  new GenerateSemanticModelFeature(),
  new GenerateContextualSemanticModelFeature(),
];
```

---

## 4. Service Layer

### 4.1 AiService

`AiService` is the interface all features use for AI calls. The implementation is `DelegatingAiService`, which reads the active profile from `AiProfileService` at call time and routes to the appropriate provider implementation.

```typescript
interface AiService {
  complete(prompt: string, options?: AiOptions): Promise<string>;
  stream(prompt: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken): Promise<void>;
}
```

**Provider implementations:**

| Provider | Class | Authentication |
|---|---|---|
| GitHub Copilot | `CopilotAiService` | VS Code `vscode.lm` API — uses active GitHub session |
| Anthropic | `AnthropicAiService` | API key from `SecretStorage` |
| OpenAI | `OpenAiService` | API key from `SecretStorage` |

The `DelegatingAiService` selects the correct implementation based on `profile.provider`. Features never interact with provider implementations directly.

**Error types:**
- `AiProfileNotConfiguredError` — no active profile is set
- `AiProfileUnavailableError` — active profile exists but cannot complete the call (auth failure, model unavailable, etc.)

Both errors propagate to the feature, which is responsible for user-facing handling. The `StatusBarManager` provides a shared `handleAiError()` helper for consistent error display.

### 4.2 AiProfileService

Manages named AI provider profiles. Profiles are stored in VS Code `settings.json` (non-sensitive fields only). API keys are stored separately in VS Code `SecretStorage` under a key derived from the profile ID.

```typescript
interface AiProfileService {
  getProfiles(): AiProfile[];
  getActiveProfile(): AiProfile | null;
  setActiveProfile(id: string): Promise<void>;
  addProfile(profile: AiProfile, apiKey?: string): Promise<void>;
  removeProfile(id: string): Promise<void>;
  getApiKey(profileId: string): Promise<string | undefined>;
  onDidChangeActiveProfile: vscode.Event<AiProfile | null>;
}
```

**Profile switching behavior:** Profile switching is always user-initiated. The extension never automatically switches profiles or falls back to an alternative on failure. If the active profile becomes unavailable, the user is notified and presented with explicit choices: switch, retry, or configure.

### 4.3 DbtProjectService

Parses the dbt project at the open workspace root. YAML source files are the primary data source. `target/manifest.json` is used as an optional enrichment layer when present, adding compiled column types and descriptions without being required.

**Startup detection sequence:**
1. Locate `dbt_project.yml` at workspace root
2. Parse project name, version, model paths, and `require-dbt-version`
3. Check version compatibility (warn if below 1.7.0)
4. Glob for model YAML files under configured model paths
5. Parse semantic model definitions from all YAML files
6. If `target/manifest.json` exists, layer in column type and description enrichment

```typescript
interface DbtProjectService {
  detect(): Promise<DbtProjectInfo | null>;
  getModels(): Promise<DbtModel[]>;
  getSemanticModels(): Promise<SemanticModel[]>;
  findModelByName(name: string): Promise<DbtModel | null>;
}
```

### 4.4 ContextStoreService

Manages context documents in `.dbt_model_mate/context/` within the workspace. Each document is a markdown file with a machine-readable JSON header on the first line:

```
<!-- dbt-model-mate {"id":"<uuid>","type":"<type>","generatedAt":"<iso>"} -->

# Document content...
```

The UUID is assigned at write time using `crypto.randomUUID()`. It is stable for the lifetime of that document version — writing a new version assigns a new UUID.

```typescript
interface ContextStoreService {
  write(type: ContextDocumentType, content: string): Promise<ContextDocument>;
  read(type: ContextDocumentType): Promise<ContextDocument | null>;
  readAll(): Promise<ContextDocument[]>;
  isStale(type: ContextDocumentType, thresholdHours?: number): Promise<boolean>;
  getAvailableTypes(): Promise<ContextDocumentType[]>;
}
```

**Supported document types:**
`architecture` | `naming_conventions` | `source_index` | `pattern_library` | `governance_index` | `product_catalog`

### 4.5 WorkspaceService

Wraps VS Code workspace and Node `fs` APIs. Resolves all paths relative to the first workspace folder root. Features never access the file system directly.

### 4.6 DiagnosticsService

Wraps `vscode.languages.createDiagnosticCollection`. Features post and clear diagnostics through this service rather than managing their own collections.

---

## 5. Context Document Provenance

When a development feature generates output using context documents, it prepends a provenance block identifying which documents were used and when:

```yaml
# Generated by dbt Model Mate
# generated: 2026-03-22T10:35:00Z
# context:
#   architecture: 550e8400-e29b-41d4-a716-446655440000
#   naming_conventions: 7c9e6679-7425-40de-944b-e07fc1f90ae7
#   source_index: a87ff679-a2f4-471d-8308-d78985433cb4

semantic_models:
  ...
```

This allows any generated file to be traced to the exact context state that produced it. If context documents are subsequently refreshed (new UUIDs assigned), the generated file can be identified as potentially stale.

---

## 6. AI Integration

### 6.1 Context Documents as Manual RAG

Context documents implement manual Retrieval Augmented Generation (RAG). Rather than a vector store performing semantic retrieval, the extension injects curated, pre-computed summaries of the dbt project into the AI prompt. The AI reads them as part of the prompt and produces output consistent with the team's conventions.

This approach is simpler than full RAG infrastructure and more reliable for focused use cases — the extension controls exactly what context the AI receives. The natural evolution path is to chunk the context documents into a vector store as the project grows, or to serve them via an MCP server for dynamic retrieval.

### 6.2 Context Window Management

Each feature is responsible for staying within model context limits. The current approach:
- Context documents are injected whole — typically 5–20 KB each
- Features select which document types are relevant to their task rather than injecting all documents
- Prompt templates are designed to be concise, not exhaustive

Future work: a `contextBudget` concept in `AiOptions` to track and warn on token load before calling.

### 6.3 System Prompts vs Context Documents

Both go into the AI call but serve different purposes:

| | System prompt | Context documents |
|---|---|---|
| **Purpose** | Shape how the AI behaves | Teach the AI about this specific project |
| **Content** | Role, output format, behavioral rules | Architecture, conventions, patterns, indexes |
| **Scope** | Universal across all projects | Project-specific |
| **Updated** | When feature logic changes | When the project changes |

---

## 7. UI Components

### 7.1 Status Bar

Two persistent status bar items, always visible when the extension is active:

| Item | Content | Click action |
|---|---|---|
| AI provider | `⚡ [profile name] · [model]` | Opens profile picker |
| dbt project | `$(database) [project name]` | — |

**Warning states:**
- No profile: `$(alert) Configure AI`
- Profile unavailable: `$(warning) [profile name] unavailable`
- Incompatible dbt version: warning indicator on dbt project item

### 7.2 Profile Picker

A `vscode.window.showQuickPick` listing all configured profiles with the active profile marked. Invoked by clicking the AI provider status bar item or via `dbtModelMate.selectAiProfile`.

### 7.3 Inline UI (within features)

Features use standard VS Code UI APIs directly:
- `showQuickPick` — model selection, document type selection
- `withProgress` — progress notification during AI calls
- `showInformationMessage / showWarningMessage / showErrorMessage` — results and errors with action buttons

### 7.4 Planned UI Surfaces

| Surface | Purpose |
|---|---|
| Workflow panel (tree view) | Show foundational and development features grouped by tier, with staleness indicators on foundational features |
| Architecture guidance panel | Show AI architectural recommendations for the active model |
| AI usage panel | Show current model, token consumption, remaining credits |

---

## 8. Folder Structure

```
src/
├── extension.ts                  ← activation, profile picker command
├── core/
│   ├── types.ts                  ← all interfaces, domain types, errors
│   ├── featureRegistry.ts        ← activates features, manages disposables
│   └── serviceContainer.ts       ← assembles and wires all services
├── services/
│   ├── aiProfileService.ts       ← profile CRUD, SecretStorage key management
│   ├── aiService.ts              ← DelegatingAiService + provider implementations
│   ├── dbtProjectService.ts      ← YAML parsing, manifest enrichment, version check
│   ├── workspaceService.ts       ← file I/O, glob, document open
│   ├── diagnosticsService.ts     ← DiagnosticCollection wrapper
│   └── contextStoreService.ts    ← context document read/write, provenance block
├── features/
│   ├── index.ts                  ← feature registration (the only file contributors edit)
│   ├── generateContextDocuments/ ← foundational: builds context store
│   ├── generateSemanticModel/    ← development: context-blind generation
│   └── generateContextualSemanticModel/ ← development: context-aware generation
└── ui/
    └── statusBar.ts              ← StatusBarManager
```

---

## 9. CI Pipeline

Three jobs run on every push and pull request to `main` and `develop`:

| Job | Command | Purpose |
|---|---|---|
| Lint | `npm run lint` | ESLint with TypeScript rules |
| Type Check | `tsc --noEmit` | Strict TypeScript validation |
| Test | `npm test` (headless) | Unit tests with mock services |
| Package | `vsce package` | Validates the extension builds as a `.vsix` |

The package job runs only after lint, typecheck, and test pass. The `.vsix` artifact is uploaded and retained for 14 days.

---

## 10. Technology Stack

| Concern | Technology |
|---|---|
| Language | TypeScript 5.4, strict mode |
| VS Code API | `^1.90.0` (required for `vscode.lm` Language Model API) |
| AI — Copilot | VS Code Language Model API (`vscode.lm`) |
| AI — Anthropic | `@anthropic-ai/sdk` |
| AI — OpenAI | Native `fetch` |
| YAML parsing | `js-yaml` |
| Build | `tsc` |
| Lint | ESLint + `@typescript-eslint` |
| Testing | `@vscode/test-cli` + `@vscode/test-electron` |
| Packaging | `@vscode/vsce` |
| CI | GitHub Actions |
