#!/bin/bash
# Start the Google Ads Dashboard

echo "Starting Google Ads Dashboard..."

# Start Python API backend
python3 api/main.py &
API_PID=$!
echo "API server started (PID $API_PID)"

# Start React frontend
npm run dev &
UI_PID=$!
echo "UI server started (PID $UI_PID)"

echo ""
echo "Dashboard running at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $API_PID $UI_PID 2>/dev/null; exit" INT TERM
wait
