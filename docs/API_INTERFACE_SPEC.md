# API and Interface Specification
# dbt Model Mate

**Version:** 0.1.0
**Status:** In Development
**Last Updated:** 2026-03-22
**Source of truth:** `src/core/types.ts`

---

## 1. Overview

This document specifies all public interfaces, types, and contracts in dbt Model Mate. These interfaces define the boundaries between the core layer, the service layer, and individual features. They are the contracts that contributors rely on when building new features.

All interfaces are defined in `src/core/types.ts` and exported for use throughout the extension. Features interact exclusively with these interfaces — never with concrete implementations directly.

---

## 2. Feature Interface

Every capability in the extension implements the `Feature` interface. This is the primary contract for contributors.

```typescript
interface Feature {
  readonly id: string;
  readonly displayName: string;
  readonly tier: FeatureTier;
  activate(services: ServiceContainer): Contribution[] | Promise<Contribution[]>;
  deactivate?(): void | Promise<void>;
}
```

### Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier. Must match the VS Code command ID registered by the feature. Convention: `dbtModelMate.<featureName>` |
| `displayName` | `string` | Yes | Human-readable name used in logs, error messages, and UI surfaces |
| `tier` | `FeatureTier` | Yes | Classification of the feature's purpose. See Feature Tiers below. |

### Methods

#### `activate(services: ServiceContainer): Contribution[] | Promise<Contribution[]>`

Called once when the extension activates. The feature registers its VS Code contributions here (commands, diagnostic providers, code actions, tree views, etc.) and returns them as disposables.

- **Parameter:** `services` — the shared service container. All service access must go through this parameter.
- **Returns:** An array of `Contribution` objects. Each wraps a VS Code `Disposable`. The `FeatureRegistry` collects these and manages their lifecycle.
- **Errors:** If `activate()` throws, the error is logged and surfaced as a notification. Other features continue activating.

#### `deactivate?(): void | Promise<void>`

Optional. Called when the extension deactivates. Use for cleanup beyond what disposables handle (e.g., stopping timers, closing connections). Most features do not need to implement this.

### Feature Tiers

```typescript
type FeatureTier = 'foundational' | 'development';
```

| Tier | Purpose | Typical output |
|---|---|---|
| `foundational` | Scans the project, builds or refreshes context documents | Files in `.dbt_model_mate/context/` |
| `development` | Performs semantic layer work for the user | YAML files, diagnostics, reports |

Tier is a classification for UI grouping and documentation. Both tiers implement the same `Feature` interface identically.

### Contribution

```typescript
interface Contribution {
  disposable: vscode.Disposable;
}
```

A thin wrapper around a VS Code `Disposable`. Returned from `activate()` to give the `FeatureRegistry` ownership of the VS Code resource's lifecycle.

---

## 3. Service Container

The `ServiceContainer` is the dependency injection boundary. Features receive it as the sole parameter to `activate()` and access all services through it.

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

| Property | Interface | Description |
|---|---|---|
| `ai` | `AiService` | Sends prompts to the active AI provider, returns completions or streams |
| `aiProfiles` | `AiProfileService` | Manages named AI provider profiles and the active profile |
| `dbtProject` | `DbtProjectService` | Parses dbt YAML files, lists models and semantic models |
| `workspace` | `WorkspaceService` | File I/O, glob search, document display |
| `diagnostics` | `DiagnosticsService` | Posts and clears VS Code diagnostic markers |
| `contextStore` | `ContextStoreService` | Reads and writes context documents with UUID provenance |
| `vscodeContext` | `vscode.ExtensionContext` | Raw VS Code extension context for advanced use cases |

---

## 4. AiService

```typescript
interface AiService {
  complete(prompt: string, options?: AiOptions): Promise<string>;
  stream(
    prompt: string,
    onChunk: (chunk: string) => void,
    token?: vscode.CancellationToken
  ): Promise<void>;
}
```

### Methods

#### `complete(prompt, options?): Promise<string>`

Sends a prompt to the active AI provider and returns the full response as a string.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | The user/task prompt |
| `options` | `AiOptions` | No | Optional overrides for temperature, token limit, and system prompt |

- **Returns:** The complete AI response as a string
- **Throws:** `AiProfileNotConfiguredError` if no active profile is set
- **Throws:** `AiProfileUnavailableError` if the active profile fails (auth error, model unavailable, network error)

#### `stream(prompt, onChunk, token?): Promise<void>`

Sends a prompt and calls `onChunk` for each streamed text chunk as it arrives. Useful for long-running generations where showing incremental output improves perceived responsiveness.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | The user/task prompt |
| `onChunk` | `(chunk: string) => void` | Yes | Callback invoked for each text chunk |
| `token` | `vscode.CancellationToken` | No | Optional cancellation token |

- **Throws:** Same as `complete()`

### AiOptions

```typescript
interface AiOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `temperature` | `number` | Provider default | Sampling temperature. Lower = more deterministic. |
| `maxTokens` | `number` | `4096` | Maximum tokens in the response |
| `systemPrompt` | `string` | — | Persistent behavioral instructions prepended to the call. Describes how the AI should behave, not what it should know about the project. |

---

## 5. AiProfileService

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

### Methods

| Method | Returns | Description |
|---|---|---|
| `getProfiles()` | `AiProfile[]` | Returns all configured profiles from VS Code settings |
| `getActiveProfile()` | `AiProfile \| null` | Returns the currently active profile, or null if none is set |
| `setActiveProfile(id)` | `Promise<void>` | Sets the active profile by ID and fires `onDidChangeActiveProfile` |
| `addProfile(profile, apiKey?)` | `Promise<void>` | Adds or updates a profile. If `apiKey` is provided, stores it in SecretStorage. |
| `removeProfile(id)` | `Promise<void>` | Removes a profile and deletes its key from SecretStorage |
| `getApiKey(profileId)` | `Promise<string \| undefined>` | Retrieves the API key for a profile from SecretStorage |

### Events

| Event | Payload | Description |
|---|---|---|
| `onDidChangeActiveProfile` | `AiProfile \| null` | Fires when the active profile changes. Null indicates no active profile. |

### AiProfile

```typescript
interface AiProfile {
  id: string;
  name: string;
  provider: AiProviderType;
  model: string;
}

type AiProviderType = 'copilot' | 'anthropic' | 'openai';
```

| Field | Description |
|---|---|
| `id` | Unique identifier used as the SecretStorage key suffix |
| `name` | User-defined display name, e.g. `"Work Copilot"` |
| `provider` | Provider type determining which `AiService` implementation is used |
| `model` | Model identifier. For Copilot: model family name (e.g. `claude-3.5-sonnet`). For Anthropic/OpenAI: full model ID (e.g. `claude-3-5-sonnet-20241022`). |

**Storage:** Profile metadata is stored in VS Code `settings.json`. API keys are stored separately in VS Code `SecretStorage` under the key `dbtModelMate.apiKey.<profileId>`. Keys never appear in settings files.

---

## 6. DbtProjectService

```typescript
interface DbtProjectService {
  detect(): Promise<DbtProjectInfo | null>;
  getModels(): Promise<DbtModel[]>;
  getSemanticModels(): Promise<SemanticModel[]>;
  findModelByName(name: string): Promise<DbtModel | null>;
}
```

### Methods

| Method | Returns | Description |
|---|---|---|
| `detect()` | `Promise<DbtProjectInfo \| null>` | Reads `dbt_project.yml` and returns project metadata. Returns null if no project is found. Caches the result. |
| `getModels()` | `Promise<DbtModel[]>` | Parses all model YAML files under configured model paths. Enriches with manifest data if available. |
| `getSemanticModels()` | `Promise<SemanticModel[]>` | Parses all `semantic_models:` blocks from YAML files in the project. |
| `findModelByName(name)` | `Promise<DbtModel \| null>` | Returns a single model by name, or null if not found. |

### DbtProjectInfo

```typescript
interface DbtProjectInfo {
  name: string;
  version: string;
  requireDbtVersion: string | string[] | null;
  modelPaths: string[];
  isVersionCompatible: boolean;
}
```

| Field | Description |
|---|---|
| `name` | Project name from `dbt_project.yml` |
| `version` | Project version string |
| `requireDbtVersion` | Raw value of `require-dbt-version` from `dbt_project.yml`. May be a string, array of constraints, or null. |
| `modelPaths` | List of model path directories. Defaults to `['models']` if not specified. |
| `isVersionCompatible` | `true` if the minimum required dbt version is 1.7.0 or higher |

### DbtModel

```typescript
interface DbtModel {
  name: string;
  path: string;
  columns: Record<string, DbtColumn>;
  description?: string;
}
```

| Field | Description |
|---|---|
| `name` | Model name as declared in the YAML `models:` block |
| `path` | Absolute file system path to the YAML file containing this model |
| `columns` | Map of column name → `DbtColumn`. Populated from YAML; enriched from manifest if available. |
| `description` | Optional model-level description from YAML |

### DbtColumn

```typescript
interface DbtColumn {
  name: string;
  dataType?: string;
  description?: string;
}
```

### SemanticModel

```typescript
interface SemanticModel {
  name: string;
  model: string;
  sourcePath: string;
  entities: Entity[];
  dimensions: Dimension[];
  measures: Measure[];
}
```

| Field | Description |
|---|---|
| `name` | Semantic model name |
| `model` | The `ref()` expression referencing the source dbt model |
| `sourcePath` | Absolute path to the YAML file containing this semantic model |
| `entities` | List of entity definitions |
| `dimensions` | List of dimension definitions |
| `measures` | List of measure definitions |

### Entity

```typescript
interface Entity {
  name: string;
  type: 'primary' | 'foreign' | 'natural' | 'unique';
  expr?: string;
  description?: string;
}
```

### Dimension

```typescript
interface Dimension {
  name: string;
  type: 'categorical' | 'time';
  expr?: string;
  description?: string;
}
```

### Measure

```typescript
interface Measure {
  name: string;
  agg: string;
  expr?: string;
  description?: string;
}
```

---

## 7. WorkspaceService

```typescript
interface WorkspaceService {
  getRootPath(): string | null;
  readFile(relativePath: string): Promise<string>;
  writeFile(relativePath: string, content: string): Promise<void>;
  findFiles(glob: string): Promise<vscode.Uri[]>;
  showDocument(uri: vscode.Uri): Promise<void>;
  fileExists(relativePath: string): Promise<boolean>;
}
```

All path parameters are relative to the workspace root unless noted.

| Method | Description |
|---|---|
| `getRootPath()` | Returns the absolute path of the first workspace folder, or null if no folder is open |
| `readFile(relativePath)` | Reads a file as UTF-8 string. Throws if the file does not exist. |
| `writeFile(relativePath, content)` | Writes content to a file. Creates parent directories as needed. |
| `findFiles(glob)` | Returns VS Code URIs matching the glob pattern within the workspace |
| `showDocument(uri)` | Opens a file in the editor |
| `fileExists(relativePath)` | Returns true if the file exists at the given path |

---

## 8. ContextStoreService

```typescript
interface ContextStoreService {
  write(type: ContextDocumentType, content: string): Promise<ContextDocument>;
  read(type: ContextDocumentType): Promise<ContextDocument | null>;
  readAll(): Promise<ContextDocument[]>;
  isStale(type: ContextDocumentType, thresholdHours?: number): Promise<boolean>;
  getAvailableTypes(): Promise<ContextDocumentType[]>;
}
```

### Methods

| Method | Returns | Description |
|---|---|---|
| `write(type, content)` | `Promise<ContextDocument>` | Writes a context document. Assigns a new UUID v4 on every write. Returns the written document including its ID and timestamp. |
| `read(type)` | `Promise<ContextDocument \| null>` | Reads a context document by type. Returns null if not yet generated. |
| `readAll()` | `Promise<ContextDocument[]>` | Returns all available context documents. |
| `isStale(type, thresholdHours?)` | `Promise<boolean>` | Returns true if the document is older than `thresholdHours` (default: 24). Also returns true if the document does not exist. |
| `getAvailableTypes()` | `Promise<ContextDocumentType[]>` | Returns the types of documents that have been generated. |

### ContextDocument

```typescript
interface ContextDocument {
  id: string;
  type: ContextDocumentType;
  generatedAt: Date;
  content: string;
}
```

| Field | Description |
|---|---|
| `id` | UUID v4 assigned at write time. Changes on every write. Used for provenance tracking. |
| `type` | The document type |
| `generatedAt` | Timestamp of when the document was written |
| `content` | Markdown content of the document, excluding the file header |

### ContextDocumentType

```typescript
type ContextDocumentType =
  | 'architecture'
  | 'naming_conventions'
  | 'source_index'
  | 'pattern_library'
  | 'governance_index'
  | 'product_catalog';
```

| Type | Description |
|---|---|
| `architecture` | Project structure, layers, and data flow |
| `naming_conventions` | Model, column, and semantic naming rules |
| `source_index` | Sources, tables, and entity relationships |
| `pattern_library` | Recurring semantic model patterns |
| `governance_index` | Doc blocks, macros, and test inventory |
| `product_catalog` | Existing data products and model counts |

### Storage Format

Context documents are stored as markdown files at `.dbt_model_mate/context/<type>.md`. Each file begins with a single-line JSON header:

```
<!-- dbt-model-mate {"id":"<uuid>","type":"<type>","generatedAt":"<iso8601>"} -->

# Document content...
```

The header is machine-readable and does not interfere with markdown rendering.

---

## 9. DiagnosticsService

```typescript
interface DiagnosticsService {
  report(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void;
  clear(uri?: vscode.Uri): void;
}
```

| Method | Description |
|---|---|
| `report(uri, diagnostics)` | Posts diagnostics for a file. Replaces any previously reported diagnostics for that URI. |
| `clear(uri?)` | Clears diagnostics for a specific URI, or clears all diagnostics if no URI is provided. |

---

## 10. Error Types

### AiProfileNotConfiguredError

Thrown by `AiService` when no active profile is set.

```typescript
class AiProfileNotConfiguredError extends Error {
  constructor()
  // message: 'No AI profile is configured. Please add a profile in dbt Model Mate settings.'
}
```

### AiProfileUnavailableError

Thrown by `AiService` when the active profile exists but cannot complete the call.

```typescript
class AiProfileUnavailableError extends Error {
  readonly profileId: string;
  readonly cause?: Error;
  constructor(profileId: string, cause?: Error)
  // message: 'AI profile "<profileId>" is unavailable.'
}
```

Common causes: Copilot session expired, API key invalid or revoked, model not available in the active subscription, network error.

**Error handling contract:** Features are responsible for catching these errors and presenting appropriate user-facing messages. The `StatusBarManager.handleAiError()` helper provides consistent error display behavior and can be used by any feature.

---

## 11. Versioning

This interface specification tracks the extension version. Breaking changes to any interface require a minor version bump. Additive changes (new optional fields, new methods) are non-breaking.

| Change type | Version impact |
|---|---|
| Remove or rename an interface member | Major |
| Change a method signature | Major |
| Add a required interface member | Major |
| Add an optional interface member | Minor |
| Add a new interface | Minor |
| Documentation change only | Patch |
