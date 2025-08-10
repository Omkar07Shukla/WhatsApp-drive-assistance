# WhatsApp-Driven Google Drive Assistant (n8n workflow)

A complete, ready-to-import n8n workflow that listens to WhatsApp messages (via Twilio) and performs Google Drive actions:
- LIST files in a folder
- DELETE a file (with mass-deletion confirmation when multiple matches)
- MOVE a file to another folder
- SUMMARY of document contents in a folder (Google Docs, TXT, and PDF/DOCX via helper microservice)

It also:
- Replies to the user on WhatsApp with results or errors
- Logs every action to a Google Sheet (audit)

This repo includes:
- `ops/workflow/whatsapp-drive-assistant.json` — the n8n workflow
- `ops/docker-compose.yml` — run n8n locally via Docker
- A small Next.js microservice route `/api/extract` for PDF/DOCX/TXT text extraction
- Command parser and a small UI to test commands
- `scripts/send-test.mjs` — simulate a Twilio inbound webhook for local testing
- `.env.sample` — sample environment variables

## Architecture

\`\`\`
WhatsApp (User) -> Twilio Sandbox -> n8n Webhook -> Command Router
                                           |            |-- LIST -> Google Drive (list)
                                           |            |-- DELETE -> Google Drive (delete) + Safety confirm
                                           |            |-- MOVE -> Google Drive (update parents)
                                           |            |-- SUMMARY -> Drive (download/export) -> Extractor API (PDF/DOCX) -> OpenAI (summarize)
                                           |-> Twilio (send WhatsApp replies)
                                           |-> Google Sheets (append audit rows)
\`\`\`

- Google Drive: OAuth2 credentials scoped to the authenticated user drive.
- OpenAI: GPT-4o used for concise summarization.
- Google Sheets: stores audit trail (timestamp, user, command, args, status, details).
- Extractor microservice: receives file binary and `x-mime-type`, returns extracted text JSON.

## Prerequisites

- Docker and Docker Compose
- Twilio account with WhatsApp Sandbox enabled
- Google Cloud project with OAuth2 for Drive + Sheets (or two separate creds)
- OpenAI API key (for GPT-4o)
- Node.js 18+ (optional) if you want to run the Next.js microservice locally

## Setup

1) Clone and install (optional Next.js UI)
\`\`\`
pnpm i
pnpm dev
\`\`\`
The extractor API will be at `http://localhost:3000/api/extract`.

2) Start n8n via Docker
\`\`\`
cp .env.sample .env
docker compose -f ops/docker-compose.yml --env-file .env up -d
\`\`\`
Open `http://localhost:5678/` (default admin/admin).

3) Import the workflow
- In n8n, click Import and select `ops/workflow/whatsapp-drive-assistant.json`.

4) Credentials
- Twilio: Set Account SID, Auth Token; From number should be your WhatsApp sandbox number (e.g., `whatsapp:+14155238886`).
- Google Drive OAuth2: Scoped for Drive file listing, download, export, delete, update.
- Google Sheets OAuth2: Access to your audit spreadsheet.
- OpenAI: Use your API key; set model to GPT-4o.
- Environment vars in n8n:
  - `EXTRACTOR_URL` — for local dev, use `http://host.docker.internal:3000/api/extract`
  - `AUDIT_SHEET_ID` — the target Google Sheet ID for audit logging

5) Twilio Sandbox configuration
- In Twilio console -> Messaging -> WhatsApp -> Sandbox, set the "WHEN A MESSAGE COMES IN" webhook to your n8n webhook URL:
  - Example: `http://localhost:5678/webhook/whatsapp`
- Join your sandbox (send the join code to WhatsApp).
- Send a test message, e.g., `HELP`.

## Command Syntax

- `HELP` — show help text
- `LIST /ProjectX` — list files in `/ProjectX` (folder under root)
- `DELETE /ProjectX/report.pdf` — delete a single file
- `DELETE /ProjectX/*.pdf` — mass deletion guarded by confirmation
- `DELETE /ProjectX/*.pdf CONFIRM` — confirm mass deletion
- `MOVE /ProjectX/report.pdf /Archive` — move file to `/Archive` (folder under root)
- `SUMMARY /ProjectX` — summarize each file’s contents (Google Docs, TXT, PDF/DOCX)

Notes:
- Folder paths are simplified to first-level paths under My Drive (e.g., `/ProjectX`). You can extend the resolver for nested paths.
- Mass deletion is detected by wildcard pattern or multiple matches; confirmation keyword `CONFIRM` is required.

## Summarization Details

- Google Docs: exported to `text/plain` via Google Drive node.
- TXT: downloaded and converted to UTF-8 text.
- PDF/DOCX: n8n downloads binary and POSTs to the Extractor microservice:
  - URL: `EXTRACTOR_URL` (set in ENV or node config)
  - Request: binary body, header `x-mime-type`
  - Response: `{ text, length }`

OpenAI prompt style:
- System: “Summarize documents into 3–5 bullets, concise, include key facts and dates.”
- User: document name and text.
- Temperature 0.2, max tokens 400 (tune as needed).

## Audit Logging

- The workflow appends a row to Google Sheets for each command with:
  - timestamp, from, command, args, status, details
- Set `AUDIT_SHEET_ID` as environment variable (or directly in the node).

## Security and Safety

- Use the minimum OAuth scopes required.
- The mass-deletion guard requires the `CONFIRM` keyword when multiple files match.
- Twilio, Google, and OpenAI credentials live only in n8n’s credentials vault or environment variables.
- The microservice limits file size (20 MB), validates MIME types, and returns 415 on unsupported types.

## Local Testing Without WhatsApp

Use the helper script to post a Twilio-style payload to your webhook:

\`\`\`
node scripts/send-test.mjs "LIST /ProjectX" "whatsapp:+1234567890"
\`\`\`

Or POST x-www-form-urlencoded directly:

\`\`\`
curl -X POST http://localhost:5678/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=HELP"
\`\`\`

## Extensibility

- Add new verbs in the “Parse Command” function node and a new branch in the Switch.
- Add more MIME handlers in the Summary branch (e.g., images with OCR).
- Replace the microservice with n8n community nodes for DOCX/PDF parsing if preferred.

## Troubleshooting

- n8n container cannot reach your local Next.js? Use `http://host.docker.internal:3000` in `EXTRACTOR_URL`.
- Permissions errors on Drive/Sheets: Recreate the OAuth creds with proper scopes.
- Twilio not delivering to webhook: verify the webhook URL and that your n8n instance is reachable.

## License

MIT
\`\`\`

```txt project="whatsapp-drive-assistant" file=".env.sample" type="code"
# n8n basic auth
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin

# Public URL of your n8n (used by Twilio to call webhooks)
N8N_WEBHOOK_URL=http://localhost:5678

# Twilio (configure inside n8n credentials UI)
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google (configure inside n8n credentials UI)
# GOOGLE_DRIVE_OAUTH2=...
# GOOGLE_SHEETS_OAUTH2=...

# OpenAI (configure inside n8n credentials UI)
# OPENAI_API_KEY=sk-...

# Extractor microservice
EXTRACTOR_URL=http://host.docker.internal:3000/api/extract

# Audit sheet (spreadsheet ID)
AUDIT_SHEET_ID=your_google_sheet_id
