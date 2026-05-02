# Salesforce Validation Rules Manager (Frontend-only)

Angular SPA that authenticates to Salesforce via OAuth 2.0 (Authorization Code + PKCE) and lets you view / enable / disable Account validation rules using the Tooling API.

-----------------------------------------------------

# Prerequisites

- Node.js and npm

# Frontend setup (Angular)

1. Configure Salesforce settings:
   - Copy `frontend/src/assets/config.example.json` → `frontend/src/assets/config.json`
   - Fill `clientId` (Consumer Key)
   - Set `authBaseUrl`:
     - Production/Developer: `https://login.salesforce.com`
     - Sandbox: `https://test.salesforce.com`
     - My Domain: `https://<mydomain>.my.salesforce.com`

3. Install deps and run:

npm install
npm start

Frontend runs on `http://localhost:4200`.

# Docker (production build)

Build:
docker build -t sf-validation-rules-frontend .

Run:
docker run --rm -p 8080:80 sf-validation-rules-frontend

Then open `http://localhost:8080`.

## Docker env config (recommended)

The container generates `/assets/config.json` at startup from `/assets/config.template.json`.

Example (PowerShell):

```powershell
docker run --rm -p 8080:80 `
  -e SF_CLIENT_ID="..." `
  -e SF_CONSUMER_SECRET="..." `
  -e SF_AUTH_BASE_URL="https://YOUR_DOMAIN.my.salesforce.com" `
  -e SF_REDIRECT_URI="http://localhost:8080" `
  -e SF_API_VERSION="60.0" `
  sf-validation-rules-frontend
```