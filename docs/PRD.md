**Product Requirements Document**   
   
  **dbt Model Mate**   
   
  **Version:** 0.1.0  
**Status:** In Development  
**Last Updated:** 2026-03-23  
   
**1. Purpose**  
   
We are on the horizon of what is proving to be a complete paradigm shift in our industry. No one knows what the future will bring, but you can’t ignore what is happening today. The power of AI is transforming our industry every day. We can depend on the timelines of our vendor’s road map; nor do we have to! Rather than relying on rigid, monolithic tools or expensive off-the-shelf extensions, we are creating a lightweight, flexible framework within our existing development environment, that removes friction and adapts to the developer—not the other way around. The goal is not to impose structure, but to provide just enough of a tooling to enhance the human contribution and provide AI the context and skills to seamlessly join the workflow.   
   
 The core features of this solution, which will be delivered as an extension in VS Code, will generate and leverage the context of our specific platform. By ingesting inputs such as naming conventions, architectural standards, and by analyzing our entire code base, a process will output a standard set of artifacts that will server as instruction sets AI. And another feature will take those artifacts in as inputs along with a varying set of requirements documents, source mappings, product specifications, and natural language prompts, and it synthesizes organizational knowledge into actionable artifacts—most notably dbt semantic models tailored to the company’s data, infrastructure, and standards. This bridges the gap between business intent and technical implementation, enabling developers to produce meaningful, context-aware outputs with minimal overhead. Development becomes less about manual translation and more about expressing intent, with the system handling the alignment.   
   
 But its not just those core features. The extension will expose a flexible framework that will make it easy to develop additional features, geared toward AXA XL and whatever is most needed or that will relieve the biggest pain points.  
   
 The framework empowers developers to create exactly what they need, when they need it, whether that involves AI-driven features or not. Sometimes it will be the developer using AI to develop a tool. Sometimes it will be a tool to help the developer better leverage AI. And sometimes the tool won't have anything to do with AI at all.  
   
 A VS Code extension as a Swiss Army knife for the semantic layer, providing tools to help with model generation, unit testing, performance tuning, building and deployment code, managing releases, monitoring the environment, the list of potential wins goes on and on.  
   
 And once developed, those tools with clearly defined inputs and outputs, can be leveraged by other teammates and AI agents as well. In a landscape where AI effectively becomes in-house development capability, this approach eliminates dependence on generic software designed for the masses. Instead, it enables teams and individuals to craft tailored solutions, share them, and evolve their tooling organically. The result is a dual-purpose system: a direct productivity accelerator and a foundation for continuous, developer-driven innovation.  
This document defines the product requirements for dbt Model Mate, a VS Code extension for analytics engineering teams that own the semantic layer in a dbt-centric data ecosystem.  
   
    
   
  **2. Problem Statement**  
   
    
   
  Analytics engineering teams working on dbt semantic layers face a set of compounding challenges:  
- Semantic layer work — generating, repairing, validating, and improving models and metric definitions — is repetitive, knowledge-intensive, and error-prone  
- Generic AI coding assistants produce syntactically valid output that violates team conventions, because they have no awareness of the project's architecture, naming standards, or existing patterns  
- Onboarding new team members to the semantic layer requires absorbing context that is scattered across the codebase with no single reference point  
- There is no structured way for team members to build and share AI-assisted workflows specific to their semantic layer pain points  
   
The core challenge is not that AI tools are unavailable — it is that AI tools without curated project context produce output that compiles but does not belong.  
    
 **3. Vision**  
   
dbt Model Mate is a platform for analytics engineering teams to build their own AI-assisted workflows for the semantic layer. The extension ships with a set of core features, but the real value comes from team members adding functionality that solves their specific pain points.  
   
    
 *A teammate who feels friction in their semantic layer workflow does not raise a feature request. They build the feature.*  
    
  **4. Target Users**  
    
 **Primary:** Analytics engineers and data engineers who own, build, or maintain a semantic layer built with dbt.  
**Secondary:** Those same engineers who contribute to the extension itself — team members who identify workflow pain and build features to address it.  
   
**Environment:** Teams using dbt in a large, multi-model codebase where:  
- Semantic layer conventions are established but not always documented  
- New data products require understanding patterns accumulated over years of development  
- GitHub Copilot access is available via organizational subscription  
    
 **5. Goals and Non-Goals**  
   
  **Goals**  
- Reduce friction in semantic layer development through AI-assisted generation, repair, validation, and analysis  
- Produce AI output that conforms to team conventions, not just dbt syntax  
- Give team members a simple, repeatable pattern for adding new AI-assisted workflows  
- Surface AI usage, model, and session information transparently  
- Support both context-blind (quick) and context-aware (high-quality) AI workflows  
   
**Non-Goals**  
- General-purpose dbt development assistance (pipeline models, SQL authoring)  
- Predictive simulation or offline warehouse forecasting  
- Replacing human review of generated output — all output is a starting point, not a final product  
- Multi-agent orchestration or automated build pipelines  
   
**6. User Stories**  
   
    
 **Semantic Layer Development**  
   
    
- As an analytics engineer, I want to generate a starter semantic model definition for a dbt model so that I have a correct starting point without writing boilerplate from scratch.  
- As an analytics engineer, I want the generated semantic model to follow my team's naming conventions and patterns so that I spend less time editing AI output to match our standards.  
- As an analytics engineer, I want to validate references and relationships in my semantic YAML so that I catch inconsistencies before running dbt.  
- As an analytics engineer, I want to see suggestions for missing dimensions, measures, or entities so that I don't overlook coverage gaps.  
   
**Context Management**  
    
- As an analytics engineer, I want to generate context documents from my dbt project so that subsequent AI operations are aware of our architecture and conventions.  
- As an analytics engineer, I want to see which context documents were used to generate a file so that I know whether to regenerate it after a context refresh.  
- As an analytics engineer, I want to know when my context documents are stale so that I can refresh them before building new semantic models.  
   
**AI Profile Management**  
   
- As a user, I want to configure multiple AI provider profiles so that I can switch between GitHub Copilot and a direct API key depending on my needs.  
- As a user, I want to see which AI profile and model I am currently using at all times.  
- As a user, I want to be alerted when my active AI profile becomes unavailable so that I can decide how to proceed — not have the extension decide for me.  
   
**Contribution**  
- As a team member, I want to add a new feature to the extension by following a simple pattern so that I do not need deep VS Code extension expertise to contribute.  
- As a team member, I want to raise a PR to the extension repository to share a feature I have built so that the whole team benefits.  
   
**7. Feature Inventory**  
   
Some features build project context (scanning the codebase, generating context documents), while others consume it (generating semantic models, validating references). This distinction is conceptual and not part of the core feature contract — all features implement the same interface.  
   
    
 **Current Features (v0.1.0)**  
   
    
   
  | | |  
   
    
   
  |-|-|  
   
    
   
  | **Feature** |   **Description** |  
   
    
   
  | Generate Context Documents | Scans the dbt project and produces canonical context documents: architecture, naming conventions, source index, and pattern library. Each document is assigned a UUID at generation time. |  
   
    
  | Generate Semantic Model | Generates a semantic model based on provided context. Stamps the context document IDs as provenance in the output. |  
   
   
**Planned Features**  
   
   
  | | |  
   
    
   
  |-|-|  
   
    
   
  | **Feature** |   **Description** |  
   
    
   
  | Validate References | Validates ref() and source() references in semantic YAML against the dbt project |  
   
    
   
  | Suggest Metrics | Suggests metric definitions based on existing measures and dimensions |  
   
    
   
  | Classify Models | Classifies existing models by layer role and archetype |  
   
    
   
  | Repair Semantic Model | Identifies and repairs incomplete or inconsistent semantic definitions |  
   
    
   
  | Architecture Guidance Panel | Surfaces architectural recommendations for the active model |  
   
    
   
  | AI Usage Panel | Shows current model, token usage, remaining credits, and request history |   
   
   
**8. AI Provider Support**  
   
    
   
  The extension supports multiple AI providers through a named profile system:  
   
    
   
  | | | |  
   
    
   
  |-|-|-|  
   
    
   
  | **Provider** |   **Authentication** |   **Notes** |  
   
    
   
  | GitHub Copilot | VS Code GitHub session | Primary for teams with Copilot subscriptions. No API key required. |  
   
    
   
  | Anthropic | API key via VS Code SecretStorage | Direct Claude API access |  
   
    
   
  | OpenAI | API key via VS Code SecretStorage | GPT model access |  
   
    
   
     
   
    
   
  **Profile behavior:**  
- Users configure one or more named profiles  
- Only one profile is active at a time  
- If an active profile becomes unavailable, the extension alerts the user — it does not automatically switch  
- API keys are stored in VS Code SecretStorage and never written to settings.json  
   
   
**9. Context Store**  
   
The extension maintains a context store at .dbt_model_mate/context/ in the workspace root. This directory is excluded from dbt via .dbtignore.  
   
    
   
  Context documents are markdown files that build project context. Each document:  
- Is assigned a UUID at generation time, stamped in a machine-readable header  
- Can be checked for staleness (default threshold: 24 hours)  
- Is injected into AI prompts by features that are context-aware  
   
**What the context documents are doing**  
   
    
   
  When you call an AI model, it only knows what you put in the prompt. It has no persistent memory between calls, no awareness of your codebase, and no knowledge of your team's conventions. Every call starts from zero.  
   
    
   
  Context documents solve this by giving the AI a curated, bounded summary of your project — your architecture, your naming conventions, your patterns — injected into the prompt at call time. The AI reads them as part of the prompt and uses them to produce output that fits your codebase rather than generic output.  
   
That's the core idea. Everything else is a variation on how that injection happens.  
   
When a feature uses context documents, it stamps their IDs as a provenance block at the top of its output. This allows any generated file to be traced back to the context state that produced it.  
   
  **Canonical Context Document Types**  
   
 | | |  
   
    
   
  |-|-|  
   
 | **Type** |   **Description** |  
   
 | architecture | Project structure, layers, data flow |  
  | naming_conventions | File, model, column, and semantic naming rules |  
  | source_index | Sources, tables, entity relationships |  
  | pattern_library | Recurring semantic model patterns and recommendations |  
  | governance_index | Doc blocks, macros, tests inventory |  
  | product_catalog | Existing data products and model counts |  
   
**10. dbt Compatibility**  
- **Detection:** The extension activates when dbt_project.yml is present in the workspace root  
- **Version check:** At activation, the extension reads require-dbt-version from dbt_project.yml and warns if the project is below 1.7.0  
- **Source parsing:** Raw YAML source files are the primary data source. target/manifest.json is used as an optional enrichment layer when available.  
 **11. Contribution Model**  
    
   
  Any team member can add a feature to the extension by:  
1. Creating a folder under src/features//  
2. Implementing the Feature interface  
3. Adding the feature to src/features/index.ts  
4. Adding the command to package.json  
   
No changes to core infrastructure are required. Features are isolated from each other and receive shared services via dependency injection. See CONTRIBUTING.md for full guidance.  
   
 **12. Success Criteria**  
- A team member with no VS Code extension experience can add a working feature within a single session following CONTRIBUTING.md  
- Generated contextual semantic models require materially less editing than context-blind output when context documents are current  
- The extension activates cleanly on any dbt 1.7+ project without configuration beyond an AI profile  
- AI profile unavailability is surfaced to the user without silent fallback or data loss  
