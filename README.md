# Agentic Inbox (Customized for Cloudflare Free Tier)

*Forked from the original Cloudflare project: [cloudflare/agentic-inbox](https://github.com/cloudflare/agentic-inbox)*

<div style="display: flex; gap: 10px; margin-bottom: 20px;">
  <img src="./demo_app.png" width="400" alt="Agentic Inbox Light Mode" />
  <img src="./dark-mode.png" width="400" alt="Agentic Inbox Dark Mode" />
</div>

A self-hosted email client with an AI agent, running entirely on Cloudflare Workers, customized to run efficiently on the Cloudflare Free Tier.

## Key Features

*   **Unified Catch-All Architecture**: Routes all incoming traffic to a single `DEFAULT_MAILBOX`, eliminating the need for complex multi-mailbox management. You only configure one address, and it captures everything sent to your domain.
*   **SMTP2GO Integration**: Outbound emails are sent reliably via the SMTP2GO REST API instead of Cloudflare's native `send_email` binding, which has limitations on the free tier.
*   **Manual AI Drafting (✨)**: Instead of auto-drafting responses on receipt (which consumes excessive AI resources), you manually trigger AI drafts using the Sparkle button when viewing an email.
*   **Resource-Conscious Cleanup**: Automatically cleans up inbox emails and attachments older than 30 days during normal listing operations, incurring zero extra Cloudflare compute costs.
*   **Smart Compose**: Includes a fully editable "From" field in the compose modal that smart-fills the original recipient address when replying.
*   **Light/Dark Mode**: System-aware theme toggling without Flash of Unstyled Content (FOUC).

## Setup & Deployment

### 1. Configure your Domain
In `wrangler.jsonc`, update the `DEFAULT_MAILBOX` variable to your catch-all address (e.g., `inbox@kaniblog.fyi`). The domain is derived automatically from this address.

```jsonc
"vars": {
    "DEFAULT_MAILBOX": "inbox@kaniblog.fyi"
}
```

### 2. Set your SMTP2GO API Key
Set your API key securely as a Cloudflare Worker secret:
```bash
wrangler secret put SMTP2GO_API_KEY
```

### 3. Setup Cloudflare Access (Required for Production)
The inbox is protected by Cloudflare Access. You must set the following secrets to authorize access:
```bash
wrangler secret put POLICY_AUD
wrangler secret put TEAM_DOMAIN
```

### 4. Create the R2 Bucket
Create the bucket to store email attachments:
```bash
wrangler r2 bucket create agentic-inbox
```

### 5. Deploy
Deploy the worker to Cloudflare:
```bash
npm run build
wrangler deploy
```

### 6. Configure Email Routing
In your Cloudflare Dashboard, go to your domain's **Email Routing** section and set the **Catch-all address** to route to this Worker.
