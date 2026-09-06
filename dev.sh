(cd dependency && docker compose up) &
(cd backend && uv run run.py) &
(ngrok http 8000) &
(cd frontend && npm run dev) &
(cd mobile-app && npx expo start) &