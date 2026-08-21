# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Backend / authentication configuration

DevPulse's frontend talks to a separate Node.js + Express API that owns the
GitHub OAuth flow and the session (httpOnly cookie). Nothing is stored in
localStorage and there is no mock auth.

### Environment

```sh
# .env
VITE_API_BASE_URL=http://localhost:4000
```

All requests go through `src/lib/api/client.ts`, which prefixes this base URL and
sends `credentials: "include"`. Never hardcode a backend URL in a component.

### Hosted Lovable Preview

`http://localhost:4000` is not reachable from a hosted preview (it resolves in
the visitor's browser, not on your machine). To test real GitHub OAuth from the
preview, set `VITE_API_BASE_URL` to a **publicly reachable HTTPS URL** for the
Express API (a deployed instance or a tunnel such as ngrok/cloudflared). Without
it the app shows "Unable to connect to DevPulse API." with a Retry action — it
does not pretend the user is signed out.

### CORS (Express side)

Credentials are enabled, so wildcard origins are not allowed:

```js
app.use(cors({
  origin: [process.env.FRONTEND_ORIGIN], // exact origin, e.g. https://<preview>.lovable.app
  credentials: true,
}));
```

Session cookies used cross-site must be `SameSite=None; Secure`.

### GitHub OAuth callback

The frontend does not define a callback route. Sign-in navigates to the existing
backend endpoint `GET {VITE_API_BASE_URL}/auth/github?redirect=<path>`; the
Express app handles the callback URL already registered in the GitHub OAuth app
and redirects back to the frontend, where `GET /api/auth/me` establishes the
session.
