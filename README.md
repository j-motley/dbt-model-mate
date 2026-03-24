# dbt Model Mate

An AI-powered VS Code extension for analytics engineering teams that own the semantic layer in a dbt-centric data ecosystem.

dbt Model Mate helps you build, repair, validate, and improve semantic models — and gives your team a simple pattern for adding whatever AI-assisted workflows you need.

---

## Requirements

- **VS Code** 1.90 or higher
- **Node.js** 20 or higher (for development)
- **dbt** 1.7 or higher
- One of the following for AI access:
  - GitHub Copilot subscription (recommended — no API key required)
  - Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
  - OpenAI API key

---

## Build

```bash
git clone <repo-url>
cd dbt-model-mate
npm install
npm run compile
```

**Verify the build is clean:**

```bash
npm run lint        # ESLint
npx tsc --noEmit    # Type check without emitting
```

---

## Run in Development

1. Open the `dbt_model_mate` folder in VS Code
2. Press **F5** (or **Run → Start Debugging**)
3. A new **Extension Development Host** window opens
4. In that window, open a dbt project folder (one containing `dbt_project.yml`)
5. The extension activates automatically when a dbt project is detected

> The status bar at the bottom right will show the AI provider and dbt project items once active.

---

## Package

To build a `.vsix` file for local installation or distribution:

```bash
npm install -g @vscode/vsce
npm run compile
vsce package --no-dependencies
```

This produces a `dbt-model-mate-0.0.1.vsix` file. Install it in VS Code via:

```
Extensions panel → ··· menu → Install from VSIX
```

---

## Setup

### 1. Configure an AI profile

The extension requires at least one AI profile before any features will work.

Open the VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
dbt Model Mate: Select AI Profile
```

If no profiles are configured, follow the prompt to add one.

Profiles are also accessible by clicking the AI provider item in the status bar (bottom right).

---

#### GitHub Copilot (recommended)

No API key required. The extension uses your existing GitHub Copilot subscription via VS Code's built-in Language Model API.

1. Ensure you are signed into VS Code with a GitHub account that has Copilot access
2. Add a profile via the profile picker:
   - **Name:** anything descriptive, e.g. `Work Copilot`
   - **Provider:** `copilot`
   - **Model:** the model family name, e.g. `claude-3.5-sonnet` or `gpt-4o`

#### Anthropic API

1. Obtain an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add a profile:
   - **Provider:** `anthropic`
   - **Model:** e.g. `claude-3-5-sonnet-20241022`
   - **API key:** stored securely in VS Code SecretStorage — never written to settings files

#### OpenAI API

1. Obtain an API key from your OpenAI account
2. Add a profile:
   - **Provider:** `openai`
   - **Model:** e.g. `gpt-4o`
   - **API key:** stored securely in VS Code SecretStorage

---

### 2. Open a dbt project

Open a folder containing a `dbt_project.yml` in VS Code. The extension activates automatically and the status bar updates:

```
⚡ Work Copilot · claude-3.5-sonnet        $(database) my-project
```

If the dbt project version appears incompatible (below 1.7.0), a warning is shown. The extension targets dbt 1.7+.

---

## Usage

All commands are available via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`). Type `dbt Model Mate` to see all available commands.

---

### Generate Context Documents

**Command:** `dbt Model Mate: Generate Context Documents`
**Tier:** Foundational

Scans your dbt project and generates a set of reference documents that subsequent AI operations use to produce output consistent with your team's conventions.

**Recommended first step before using contextual generation.**

**What it produces** (stored in `.dbt_model_mate/context/`):

| Document | Description |
|---|---|
| `architecture.md` | Project structure, layers, and data flow |
| `naming_conventions.md` | Model, column, and semantic naming rules inferred from your project |
| `source_index.md` | Source models, entity relationships, semantic model coverage |
| `pattern_library.md` | Recurring semantic model patterns and recommendations |

Each document is assigned a unique ID at generation time. That ID is stamped into any output file generated using the document, creating a provenance trail.

**When to re-run:** When models are added or restructured, naming conventions change, or the source index grows stale. The extension shows a warning indicator on stale documents.

---

### Generate Semantic Model (Generic)

**Command:** `dbt Model Mate: Generate Semantic Model (Generic)`
**Tier:** Development

Generates a semantic model starter for a selected dbt model. Uses only the model's own YAML (columns, descriptions) — no project context required.

Use this for a quick start when context documents have not been generated yet, or when working on a model that is an outlier from your usual patterns.

**Steps:**
1. Run the command
2. Select a dbt model from the list
3. If a semantic model already exists for that model, confirm to proceed
4. The extension generates YAML and opens it at `models/semantic/<model_name>.yml`

**Review before committing.** The output is a starting point, not a finished definition.

---

### Generate Contextual Semantic Model

**Command:** `dbt Model Mate: Generate Contextual Semantic Model`
**Tier:** Development

Generates a semantic model using your project's context documents. Produces output that follows your team's naming conventions, patterns, and standards.

**Requires context documents to be generated first** (see above). The extension will prompt you to generate them if none are found, or warn you if they are stale.

**Steps:**
1. Run `Generate Context Documents` if you have not already
2. Run the command
3. Select a dbt model
4. The extension injects context documents into the AI prompt and generates YAML
5. The output is written to `models/semantic/<model_name>.yml` with a provenance block at the top

**Provenance block** (top of generated file):
```yaml
# Generated by dbt Model Mate
# generated: 2026-03-22T10:35:00Z
# context:
#   architecture: 550e8400-e29b-41d4-a716-446655440000
#   naming_conventions: 7c9e6679-7425-40de-944b-e07fc1f90ae7
#   source_index: a87ff679-a2f4-471d-8308-d78985433cb4
```

This records which context documents were used. If you refresh your context documents later, the IDs change — making it easy to identify files that were generated with older context.

---

## Status Bar

| Item | Meaning |
|---|---|
| `⚡ Work Copilot · claude-3.5-sonnet` | Active AI profile and model |
| `$(alert) Configure AI` | No AI profile configured — click to set one up |
| `$(warning) Work Copilot unavailable` | Active profile failed — click to switch or retry |
| `$(database) my-project` | Active dbt project name |
| `$(database) my-project $(warning)` | dbt project detected but version may be below 1.7.0 |

Click the AI provider item to open the profile picker.

---

## Context Documents

Context documents live at `.dbt_model_mate/context/` in your workspace root. This folder is automatically excluded from dbt via `.dbtignore`.

You can commit this folder to source control if you want to share context documents across your team. Teammates who pull the documents can use contextual generation without running the foundational scan themselves — though running it periodically keeps the documents current.

---

## Adding a Feature

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide.

The short version: create a folder under `src/features/`, implement the `Feature` interface, add one line to `src/features/index.ts`, and add the command to `package.json`. No other files need to change.

---

## Scripts

| Command | Description |
|---|---|
| `npm run compile` | Compile TypeScript to `out/` |
| `npm run watch` | Watch mode — recompile on change |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm test` | Run tests (requires compiled output) |
| `npm run clean` | Delete `out/` |
| `vsce package --no-dependencies` | Build `.vsix` package |
