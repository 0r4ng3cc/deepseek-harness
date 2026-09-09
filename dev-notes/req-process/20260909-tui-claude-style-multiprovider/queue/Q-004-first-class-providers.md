# Q-004 first-class protocols
State: done

## Goal
Let a custom gateway speak Claude / Codex / Gemini / Grok / DeepSeek wire protocols. Official vendor accounts are optional, not required.

## Contract
- Hand-declared `llm-pi-ai` routes can name: `openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, `openai-codex-responses`.
- Mapping: DeepSeek/Grok-compatible → OpenAI completions/responses; Claude-compatible → anthropic-messages; Gemini-compatible → google-generative-ai; Codex-compatible → openai-codex-responses.
- Auth for custom routes stays API key + baseURL. Do not force official OAuth.
- Official `deepseek-official` and existing `dsh-auth` OAuth stay available, not mandatory.
- `/provider` protocol picker lists the same set as `supportedProtocols()`.

## Targets
- `packages/llm/llm-pi-ai/src/provider.ts`
- `packages/ui/tui/src/dsh-adapter/providerWizard.ts`
- TUI i18n protocol descriptions
- llm-pi-ai tests that pin the protocol table

## Constraints
Do not log secrets. Do not mount official Claude/Codex/Gemini/Grok by default. Do not add Bedrock/Vertex/Azure (need extra auth shape).

## Verification
- `supportedProtocols()` includes the five wire ids above.
- `/provider` custom flow offers those ids.
- A hand-declared route with `api: google-generative-ai` (or codex-responses) builds; an unknown api still fails loud.
- DeepSeek-only boot unchanged.
