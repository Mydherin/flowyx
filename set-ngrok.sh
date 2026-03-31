#!/bin/bash
# Usage: ./set-ngrok.sh https://your-new-url.ngrok-free.app

set -e

NEW_URL="${1}"

if [ -z "$NEW_URL" ]; then
  echo "Usage: $0 <ngrok-url>"
  echo "Example: $0 https://abc123.ngrok-free.app"
  exit 1
fi

BACKEND_ENV="mic-flowyx/.env"
FRONTEND_ENV="spa-flowyx/.env.local"

# Update NGROK_URL and CORS_ALLOWED_ORIGINS in backend .env
sed -i '' "s|^NGROK_URL=.*|NGROK_URL=${NEW_URL}|" "$BACKEND_ENV"
sed -i '' "s|^CORS_ALLOWED_ORIGINS=\(.*\),https://[^ ]*|CORS_ALLOWED_ORIGINS=\1,${NEW_URL}|" "$BACKEND_ENV"

# Update VITE_API_BASE_URL in frontend .env.local if it points to an ngrok URL
if grep -q "^VITE_API_BASE_URL=https://.*ngrok" "$FRONTEND_ENV" 2>/dev/null; then
  sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${NEW_URL}|" "$FRONTEND_ENV"
fi

echo "✓ ngrok URL updated to: ${NEW_URL}"
echo ""
echo "Remember to update Google OAuth Console:"
echo "  Authorized JS origins      → ${NEW_URL}"
echo "  Authorized redirect URIs   → ${NEW_URL}"
