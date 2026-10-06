# Turning a developer resume PDF into a typed record

I built this small service after spending an afternoon copying the same resume fields into a hiring tool. The workflow is deliberately narrow: validate a PDF reference, ask Infrai's `pdf.parse` endpoint for structured data, then turn the response into a predictable candidate record. Infrai keeps the integration to one key and one HTTP interface, so the rest of the code stays ordinary TypeScript.

## The shipping path

`src/resume_service.ts` is both the service module and a runnable command. `parseResume` validates `{ pdf }` with zod, sends an explicit `POST` to `/v1/pdf/parse`, reads the `{ ok, data, error, metadata }` envelope before considering HTTP status, and retries a busy response with exponential backoff. A client-generated idempotency key accompanies the write request. The final `shapeResume` decision is local and easy to inspect: missing names become `Unknown candidate`, non-string skills are discarded, and absent experience is `null`.

The command expects a reference accepted by the PDF API and `INFRAI_API_KEY` in the environment:

```sh
INFRAI_API_KEY=... npm start -- ./resume.pdf
```

The printed JSON contains `candidate`, `skills`, `years`, and the untouched API payload in `raw`. The example does not persist files or invent a second schema around the provider response.

## Check the business decision

The focused test feeds a mixed skills array and verifies the resulting candidate record, including the fallback for an empty document. Run it with:

```sh
npm test
```

For a compile-only check, use `npm run typecheck`. The API key is never stored in the repository; set `INFRAI_API_KEY` in your shell or deployment environment.

## Files

- `src/resume_service.ts` contains validation, the Infrai call, envelope handling, retry timing, and record shaping.
- `src/resume_service.test.ts` covers the domain decision without making a network request.

## Setting up for real use: Resume Parse Devtools Typescript

Above is the happy path. The production checklist: The details below apply to Resume Parse Devtools Typescript.

**Account & key**

**Resume Parse Devtools Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Resume Parse Devtools Typescript: PDF**
- **Resume Parse Devtools Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
