You are helping design a VS Code extension for dbt developers and analytics engineers.

The extension’s purpose is to help teams build, augment, repair, validate, and improve the semantic layer of a data ecosystem.

This tool is intended for semantic layer teams working in dbt-centric analytics environments, and it should support practical workflows such as:
- generating starter semantic definitions
- repairing incomplete or inconsistent semantic configurations
- validating references and relationships
- suggesting improvements to dimensions, entities, measures, metrics, and naming
- identifying gaps, inconsistencies, and opportunities for standardization

There are two equally important constraints:

1. The extension must be very easy for contributors to extend.
Team members should be able to add new functionality through a simple, repeatable pattern without needing deep expertise in VS Code extension development.

2. The architecture must still support robust capabilities over time.
Although adding features should stay simple, the system must accommodate more advanced semantic-layer workflows such as:
- multi-step commands
- reusable services
- structured AI prompt pipelines
- diagnostics and validation engines
- project-wide analysis
- shared registries or manifests
- richer UI surfaces in the future, such as tree views, webviews, code actions, and guided workflows

Your task:
First, propose 2-3 architecture options for the extension.
For each option, explain:
- the core pattern
- strengths
- tradeoffs
- contributor experience
- how well it supports both simple and robust features

Then recommend one architecture.

After recommending an architecture, provide:
1. A proposed folder structure
2. A high-level system design
3. Key TypeScript interfaces and contracts
4. A feature registration model
5. A simple contributor workflow for adding new commands
6. One end-to-end example feature, such as “Generate Semantic Model Starter”
7. Short contributor documentation explaining how teammates would add new functionality
8. Notes on how the design can evolve without losing contributor simplicity

Design priorities:
- contributor simplicity
- clear separation of concerns
- long-term extensibility
- semantic-layer usefulness
- maintainability over cleverness

Please optimize for architectural clarity and practical team adoption.
Do not jump straight into writing a full codebase.
Start with architecture options and recommendation first.