(cd dependency && docker compose up) &
(cd backend && uv run run.py) &
(cd frontend && npm run dev) &
(cd mobile-app && npx expo start)