**Feature Specification**  
**Generate Semantic Model (Generic)**  
**Feature ID:** dbtModelMate.generateSemanticModel  
   
 **Tier:** Development  
   
 **Version:** 0.1.0  
   
 **Status:** Implemented  
   
 **Last Updated:** 2026-03-22  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCUZfE2IYmVDBhAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse/xcF7U7sx4wAAAAASUVORK5CYII=)  
**1. Purpose**  
Generate a semantic model YAML starter for a selected dbt model using only that model's own schema — its column names, data types, and descriptions. No project context documents are required.  
This feature is intentionally context-blind. It produces a valid starting point that follows dbt conventions but does not enforce team-specific naming standards, patterns, or architecture rules. It is appropriate for quick starts, one-off models, or situations where context documents have not yet been generated.  
For output that follows team conventions, use **Generate Contextual Semantic Model** instead.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQ2AQBAAsSE5CbzRujLwhwQMYIEfIWkVdJuZozoDAOAvrlWtav96AgDAa/cDEXQEKquakOYAAAAASUVORK5CYII=)  
**2. Scope**  
**In scope**  
- Selecting a dbt model from the project  
- Detecting if a semantic model already exists for that model  
- Building a prompt from the model's column metadata  
- Calling the active AI provider  
- Parsing and validating the AI output as YAML  
- Writing the output to models/semantic/<model_name>.yml  
- Opening the generated file in the editor  
**Out of scope**  
- Reading or injecting context documents  
- Enforcing team naming conventions  
- Validating references against other semantic models  
- Generating metrics
- Modifying existing semantic models  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/kC1sYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4qzBdC53Vr8AAAAAElFTkSuQmCC)  
**3. Preconditions**  
All of the following must be true for the feature to run successfully:  
| | |  
|-|-|  
| **Condition** | **Behavior if not met** |   
| A workspace folder is open in VS Code | Feature exits silently — extension would not have activated |   
| A dbt_project.yml exists at the workspace root | Feature exits silently — extension would not have activated |   
| At least one dbt model with a YAML definition exists | Warning notification shown; feature exits |   
| An active AI profile is configured | AiProfileNotConfiguredError caught; user prompted to configure |   
| The active AI profile is available | AiProfileUnavailableError caught; user notified with action choices |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSdYxKbXxlpGEAOIFfwTYUuwZWa2ag8AgL841uquzq8nAAC8dj05VAYO3phhoQAAAABJRU5ErkJggg==)  
**4. User Flow**  
User invokes command  
         │  
         ▼  
 Load models from dbt project  
         │  
         ├─ No models found ──► Warning notification ──► Exit  
         │  
         ▼  
 Show model picker (QuickPick)  
         │  
         ├─ User dismisses ──► Exit  
         │  
         ▼  
 Check for existing semantic model  
         │  
         ├─ Exists ──► Modal confirmation ──┬─ User cancels ──► Exit  
         │                                  └─ User confirms ──► Continue  
         ▼  
 Build prompt from model schema  
         │  
         ▼  
 Call AI provider (with progress notification)  
         │  
         ├─ Profile not configured ──► Error notification + configure prompt ──► Exit  
         ├─ Profile unavailable ──► Error notification + switch/retry options ──► Exit  
         │  
         ▼  
 Parse AI output as YAML  
         │  
         ├─ Parse fails ──► Error notification + "Show Raw Output" option ──► Exit  
         │  
         ▼  
 Write YAML to models/semantic/<model_name>.yml  
         │  
         ▼  
 Open generated file in editor  
         │  
         ▼  
 Success notification  
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCUZfEnoYmFDBhAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse/wcF74lXkIsAAAAASUVORK5CYII=)  
**5. UI Interactions**  
**Command registration**  
Registered as: dbtModelMate.generateSemanticModel  
   
 Displayed in Command Palette as: dbt Model Mate: Generate Semantic Model (Generic)  
**Model picker**  
Select a dbt model to generate a semantic definition for  
 ──────────────────────────────────────────────────────────  
   orders                models/core/schema.yml  
   customers             models/core/schema.yml  
   order_items           models/staging/schema.yml  
   ...  
   
- Type: vscode.window.showQuickPick  
- Items: all models returned by DbtProjectService.getModels()  
- Label: model name  
- Description: relative path to the YAML file  
- Single selection  
**Existing semantic model confirmation**  
Shown only if a semantic model already exists that references the selected model.  
A semantic model referencing "orders" already exists. Generate anyway?  
 ─────────────────────────────────────────────────────────────────────  
 [Generate]    [Cancel]  
   
- Type: modal vscode.window.showWarningMessage  
- If user clicks **Generate**: proceed  
- If user clicks **Cancel** or dismisses: exit silently  
**Progress notification**  
Generating semantic model for "orders"…  
   
- Type: vscode.window.withProgress at ProgressLocation.Notification  
- Non-cancellable  
- Dismisses automatically when complete or on error  
**Success notification**  
Semantic model starter written to models/semantic/orders.yml.  
 Review and adjust before committing.  
   
- Type: vscode.window.showInformationMessage  
- No action buttons  
**Parse error notification**  
dbt Model Mate: The AI output could not be parsed as valid YAML.  
 Output did not start with "semantic_models:".  
 ────────────────────────────────────────────  
 [Show Raw Output]  
   
- Type: vscode.window.showErrorMessage  
- **Show Raw Output** opens the raw AI response in a new untitled YAML document  
**AI profile error notifications**  
Handled by StatusBarManager.handleAiError().  
**No profile configured:**  
No AI profile is configured. Please add a profile in dbt Model Mate settings.  
 ──────────────────────────────────────────────────────────────────────────────  
 [Configure AI Profile]  
   
**Profile unavailable:**  
dbt Model Mate: AI profile "Work Copilot" is unavailable.  
 ──────────────────────────────────────────────────────────  
 [Switch Profile]    [Retry]  
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCj5fFyM6mJHAjAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrsexOEF35f1aEgAAAAASUVORK5CYII=)  
**6. Inputs**  
**From DbtProjectService**  
| | | |  
|-|-|-|  
| **Input** | **Source** | **Description** |   
| DbtModel.name | getModels() | Used in prompt, output filename, and notifications |   
| DbtModel.path | getModels() | Displayed in model picker |   
| DbtModel.columns | getModels() | Column names, types, and descriptions used to build the prompt |   
| DbtModel.description | getModels() | Optional model description included in prompt if present |   
| Existing semantic models | getSemanticModels() | Used to detect if a semantic model already exists for the selected model |   
   
**From AiService**  
| | |  
|-|-|  
| **Input** | **Description** |   
| AI completion response | Raw text response from the active provider |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AUBBAsUfyRTCh9VRgEBGsWGAjJK2CbjNzVGcAAPzFtapV7V9PAAB47X4AEWgEMAY9+pUAAAAASUVORK5CYII=)  
**7. Prompt Contract**  
**System prompt**  
You are an expert analytics engineer specializing in dbt semantic layers.  
 Output only valid YAML with no additional commentary.  
   
**User prompt structure**  
You are a dbt expert. Generate a complete semantic model YAML definition  
 for the dbt model below.  
   
 Model name: <model.name>  
 [Model description: <model.description>]  ← omitted if not present  
 Columns:  
 - <column_name> [(<data_type>)] [: <description>]  
 ...  
   
 Requirements:  

 - Identify the most likely primary entity (usually an ID column)  
 - Identify foreign key entities from columns ending in _id  
 - Classify dimensions as "time" for date/timestamp columns, "categorical" for everything else  
 - Suggest measures with appropriate aggregations (count, sum, average, etc.)  
 - Reference the model using: ref('<model.name>')  
 - Use snake_case for all names  
 - Add brief, useful descriptions for each element  
 - Output only valid YAML — no explanation, no markdown fences  
   
 Start your output with: semantic_models:  
   
**Prompt construction rules**  
- Columns with no name are excluded  
- If dataType is present, it is appended in parentheses: - order_date (timestamp)  
- If description is present, it is appended after a colon: - customer_id (integer): unique customer identifier  
- If no columns are documented, the column section reads: (no columns documented)  
- Model description line is omitted entirely if model.description is undefined or empty  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4EEtY9QcxnUms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzXgM37EF77AAAAABJRU5ErkJggg==)  
**8. Output**  
**Parse logic**  
The raw AI response is processed by parseAiOutput():  
1. If the response is wrapped in markdown fences (```yaml or ```yml), the content is extracted from within the fences  
2. The resulting string must begin with semantic_models: — if not, a parse error is returned  
3. The content is parsed with js-yaml to validate syntax — if it throws, a parse error is returned  
4. If both checks pass, the content is returned as valid YAML  
**ParseResult**  
interface ParseResult {  
   yaml: string;  
   valid: boolean;  
   error?: string;  
 }  
   
| | |  
|-|-|  
| **Field** | **Description** |   
| yaml | The processed content (fences stripped if present). Present regardless of valid. |   
| valid | true if the content passed both the prefix check and YAML parse check |   
| error | Human-readable description of the parse failure. Present only when valid is false. |   
   
**Output file**  
- **Path:**models/semantic/<model_name>.yml relative to workspace root  
- **Content:** The validated YAML string followed by a trailing newline  
- **No provenance block** — this feature does not use context documents, so no context IDs are stamped  
**Example output:**  
semantic_models:  
   - name: orders  
     model: ref('orders')  
     description: Order-level semantic model  
   
     entities:  
       - name: order_id  
         type: primary  
         description: Unique order identifier  
   
       - name: customer_id  
         type: foreign  
         description: Reference to the customer  
   
     dimensions:  
       - name: order_date  
         type: time  
         description: Date the order was placed  
   
       - name: status  
         type: categorical  
         description: Current order status  
   
     measures:  
       - name: order_count  
         agg: count  
         description: Number of orders  
   
       - name: total_revenue  
         agg: sum  
         expr: order_amount  
         description: Total revenue from orders  
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/jVEMYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4rLBc059ysnAAAAAElFTkSuQmCC)  
**9. Error States**  
| | | |  
|-|-|-|  
| **Error** | **Trigger** | **User-facing behavior** |   
| No models found | getModels() returns empty array | Warning notification; feature exits |   
| User dismisses model picker | User presses Escape | Silent exit |   
| User cancels overwrite confirmation | User clicks Cancel or presses Escape | Silent exit |   
| AiProfileNotConfiguredError | No active AI profile | Error notification with "Configure AI Profile" action |   
| AiProfileUnavailableError | Active profile call fails | Error notification with "Switch Profile" and "Retry" actions; status bar warning state |   
| Parse failure — wrong prefix | AI response does not start with semantic_models: | Error notification with "Show Raw Output" action |   
| Parse failure — invalid YAML | AI response fails js-yaml parse | Error notification with error detail and "Show Raw Output" action |   
| File write failure | Workspace write fails (permissions, disk full) | Unhandled — propagates as an unhandled rejection; VS Code shows a generic error |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3OMQ0AIAwAwdIgBKl1gjacsGCAiZDcTT9+q6oRETMAAPjF6ify6QYAADdyA9Y0AypN+bdfAAAAAElFTkSuQmCC)  
**10. Acceptance Criteria**  
1. Given a dbt project with at least one documented model, when the command runs, a model picker is shown listing all available models.  
2. Given the user selects a model with no existing semantic definition, the command calls the AI and writes a valid YAML file to models/semantic/<model_name>.yml.  
3. Given the user selects a model that already has a semantic definition, a confirmation dialog is shown before proceeding.  
4. Given the user confirms overwrite, the existing semantic model file is overwritten.  
5. Given the AI returns output wrapped in markdown fences, the fences are stripped and the content is written as plain YAML.  
6. Given the AI returns output that does not begin with semantic_models:, an error notification is shown with the option to view the raw output.  
7. Given no AI profile is configured, an error notification is shown prompting the user to configure one.  
8. Given the active AI profile becomes unavailable during the call, an error notification is shown with switch and retry options.  
9. Given the command succeeds, the generated file is opened in the editor automatically.  
10. Given a model with no documented columns, the feature does not fail — the prompt notes that no columns are documented and the AI generates its best guess based on the model name.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhZscaUpheJwqQgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseopcEQ2uoYnwAAAAASUVORK5CYII=)  
**11. Implementation Notes**  
**Files**  
| | |  
|-|-|  
| **File** | **Role** |   
| src/features/generateSemanticModel/index.ts | Feature class, VS Code command, user flow orchestration |   
| src/features/generateSemanticModel/prompt.ts | Prompt template construction from DbtModel |   
| src/features/generateSemanticModel/parser.ts | AI output parsing and validation |   
   
**Dependencies**  
- services.ai — AI call  
- services.dbtProject — model and semantic model retrieval  
- services.workspace — file write and document open  
   
**Context store**  
This feature does not read from or write to the context store. It is entirely context-blind by design. For context-aware generation, see the **Generate Contextual Semantic Model** feature specification.  
   
---  
   
## 12. Output Contract (Programmatic)  
   
In addition to writing the generated file to disk, the feature returns a structured result:  
   
```typescript  
FeatureResult {  
  success: true,  
  artifacts: [  
    {  
      type: 'semantic_model',  
      path: 'models/semantic/<model_name>.yml',  
      content: '<generated YAML>'  
    }  
  ]  
}  
