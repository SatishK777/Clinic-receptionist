# Deployment

Recommended setup:

- Backend: deploy `backend` as a Node web service.
- Frontend: deploy `frontend` as a Next.js app.
- Database: keep MongoDB Atlas.
- Vapi webhook: point the Vapi assistant server URL to the deployed backend webhook.

## Backend

Root directory:

```txt
backend
```

Install command:

```txt
npm install
```

Start command:

```txt
npm start
```

Environment variables:

```txt
NODE_ENV=production
MONGODB_URI=your MongoDB Atlas connection string
JWT_SECRET=long random secret
JWT_REFRESH_SECRET=another long random secret
VAPI_API_KEY=your Vapi private API key
CLINIC_TIMEZONE=Asia/Kolkata
CORS_ORIGIN=https://your-frontend-domain.com
```

Health check path:

```txt
/health
```

After deployment, your backend webhook URL will be:

```txt
https://your-backend-domain.com/api/v1/calls/webhook
```

Put that URL in Vapi assistant server settings, then save Prompt Studio once so the assistant syncs.

## Frontend

Root directory:

```txt
frontend
```

Install command:

```txt
npm install
```

Build command:

```txt
npm run build
```

Start command:

```txt
npm start
```

Environment variable:

```txt
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

## MongoDB Atlas

In Atlas Network Access, allow the deployment platform to connect. If your host does not provide fixed outbound IPs, use `0.0.0.0/0` for testing, then tighten it later if your platform supports fixed egress IPs.

## Final Test

1. Open the deployed frontend and log in.
2. Save Prompt Studio.
3. Confirm Vapi sync succeeds.
4. Make a fresh Vapi call.
5. Check that the call log appears in the portal.
6. Book a future valid appointment and confirm it appears in appointments and MongoDB.

