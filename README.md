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