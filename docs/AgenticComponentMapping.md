Agentic AI Component Mapping

How it relates to each pattern
RAG (Retrieval Augmented Generation)

RAG is the formal version of what context documents are doing manually.

 

 In a RAG system:

Documents are chunked, embedded as vectors, and stored in a vector database

 

 At call time, the query is embedded and the most semantically relevant chunks are retrieved

 

 Those chunks are injected into the prompt automatically

 

 Our context documents do the same thing but without the infrastructure. Instead of a vector database doing semantic retrieval, a human (or the extension) decides which documents are relevant and injects them whole. It's RAG with curation replacing retrieval.

The tradeoff: RAG scales to thousands of documents and retrieves exactly what's needed. Our approach requires fewer moving parts but requires someone to decide what context matters. For a focused tool like dbt Model Mate, curated context is actually more reliable — you know exactly what the AI is reading.

If the codebase grows large enough that curated documents become unwieldy, the natural evolution is to chunk the context documents and put them in a vector store, making the injection automatic. The documents themselves don't change — just how they're retrieved.
MCP (Model Context Protocol)

MCP is a protocol for giving AI models structured access to tools and data sources at call time. Instead of injecting text into a prompt, an MCP server exposes callable tools — "look up this source table", "get the schema for this model", "list all semantic models in this product" — and the AI decides when to call them.

Our context documents are a static, pre-computed version of what an MCP server would serve dynamically. Where an MCP tool might answer "what are the columns in the orders table?" on demand, our source index document answers it ahead of time by pre-indexing all the sources.

The relationship: context documents are a good stepping stone toward MCP. Once you have a well-structured source index document, you already know what an MCP tool for source lookup would need to return. Building the MCP server becomes a matter of converting the document's content into structured tool responses.
System Instructions / Custom Instructions

System instructions are persistent instructions that shape how the AI behaves across all calls in a session — things like "you are a dbt expert", "always use snake_case", "never suggest deprecated syntax". In Copilot this is .github/copilot-instructions.md. In our AiService it's the systemPrompt field in AiOptions.

Context documents are different from system instructions in an important way. System instructions describe how to behave. Context documents describe what to know about this project specifically. Both go into the prompt, but they serve different purposes.

In practice, our extension uses both:

The systemPrompt in each feature's AI call sets behavioral instructions ("you are a dbt MetricFlow expert, output only valid YAML")

 

 The context documents provide project-specific knowledge ("here is how this team names their models")

 

 Fine-tuning

 

 Fine-tuning is worth mentioning because people sometimes confuse it with RAG. Fine-tuning bakes knowledge into the model's weights through additional training. It's expensive, irreversible, and becomes stale as your codebase evolves. Context documents are the opposite — cheap to generate, easy to refresh, and always reflect the current state of the project. For a codebase that changes regularly, context injection is almost always the right approach over fine-tuning.
