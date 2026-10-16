# Error handling

Failures have three audiences. Each audience gets a different string.

| Audience | Sees | Example |
| --- | --- | --- |
| Person in the UI | A sentence we wrote | `Missing personaId` or `Something went wrong. Try again.` |
| Server log and PostHog | The caught error | Drizzle message, provider SDK message, stack |
| Model (tool result) | `{ ok: false, error }` | `Invalid path for read: "…"`. This stays on the tool path and is not rendered as `ErrorNotice`. |

The HTTP and stream boundary is where detail stops. A route may log `error`. The body and the chat transcript carry only a public sentence.

## Contract

Every JSON error from `app/api/` is:

```ts
type ApiErrorBody = { error: string };
```

| Kind | When | Status | `error` |
| --- | --- | --- | --- |
| Expected | We rejected the request: missing session, bad role, missing path, unknown table, file not visible | `400` or `404` | The sentence already written in that route |
| Unexpected | `catch`: database, provider, parse, anything else | `500` | `Something went wrong. Try again.` |

On `500`, log the caught value (`console.error`) before returning. Chat also calls `captureChatError` with the real message. The response body uses the fixed sentence.

Chat stream failures (`streamText` `onError`, `toUIMessageStreamResponse` `onError`) follow the same split. PostHog stores the provider message. The transcript receives `The model request failed. Check the API key and try again.`

Guardrail replies in `lib/agent/guardrails.ts` are assistant text, not this error body. They stay as written.

## Flow

```
                         user action
                              |
                              v
                    +-------------------+
                    |  browser panel    |
                    |  chat / picker /  |
                    |  db tab / vfs     |
                    +-------------------+
                              |
                         fetch / stream
                              |
                              v
                    +-------------------+
                    |   API route       |
                    |   try / catch     |
                    +-------------------+
                         /         \
                        /           \
                       v             v
              we wrote it      it threw
              (400 / 404)      (500)
                   |               |
                   |               +----> log + PostHog
                   |               |      (full error)
                   v               v
              exact sentence   "Something went wrong.
              ("Missing role")  Try again."
                   \               /
                    \             /
                     v           v
                    { error: string }
                              |
                              v
                    +-------------------+
                    |   ErrorNotice     |
                    |   message + retry |
                    +-------------------+

        agent tools stay on their own path:

            tool throw --> { ok: false, error } --> model
```

## Client

Panels read failures through one helper, `readJson<T>(response)`:

- `response.ok` and JSON body: return `T`.
- `response.ok` is false and the body is `{ error: string }`: throw that string.
- Body is not JSON: throw `Something went wrong. Try again.`
- `fetch` throws: throw `Could not reach the server.`

Call sites: `components/persona-picker.tsx`, `components/database-tab.tsx`, `components/vfs-tree.tsx` (mirror poll and file peek). Chat keeps using `useChat`; its `error` is the public stream or `500` sentence above.

Render those strings with one `ErrorNotice` (message, optional Retry). Retry re-runs the load that failed. `app/error.tsx` uses the same notice and Next's `reset` for a render crash.

## Routes

Apply the contract in:

- `app/api/chat/route.ts`
- `app/api/personas/route.ts`
- `app/api/tickets/route.ts`
- `app/api/vfs/list/route.ts`
- `app/api/vfs/read/route.ts`
- `app/api/vfs/mirror/route.ts`
- `app/api/db/tables/route.ts`
- `app/api/db/rows/route.ts`

Return errors with one helper, `jsonError(status, message)`, so the body shape stays `{ error: string }`.

Leave `lib/agent/tools/*` as `{ ok: false, error }` for the model. Those messages are instructions back to the agent, not UI copy.
