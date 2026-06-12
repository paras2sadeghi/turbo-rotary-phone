# Flash Pharmacy Investor Handoff

Single-page investor demo for Flash Pharmacy.

## Preview locally

Open `index.html` in Chrome, Edge, or Safari.

## Deploy

This folder is ready to push to GitHub and deploy on Vercel.

For the live AI Pharmacist demo, add this environment variable in Vercel:

```text
OPENAI_API_KEY=your_key_here
```

Optional:

```text
OPENAI_MODEL=gpt-4.1-mini
```

If no key is configured, the page still runs with built-in demo responses.

## Included files

- `index.html`
- `assets/` with the required images, logo, and pitch video
- `api/chat.js` for the Vercel chatbot endpoint
