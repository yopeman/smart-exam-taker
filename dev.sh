(cd dependency && docker compose up) &
(cd backend && uv run run.py) &
# (ngrok http 8000) &
(npx localtunnel --port 8000 --subdomain smart-exam-taker-backend-by-yopeman-318) &
(cd frontend && npm run dev) &
# (cd mobile-app && npx expo start) &