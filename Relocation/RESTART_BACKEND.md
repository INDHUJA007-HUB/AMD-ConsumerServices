d# How to Restart the Backend

The backend needs to be restarted to pick up the new GROQ_API_KEY environment variable.

## Steps:

1. **Stop the current backend server** (if running):
   - Press `Ctrl+C` in the terminal where the backend is running

2. **Start the backend again**:
   ```bash
   cd backend
   python run.py
   ```

3. **Verify the backend is running**:
   - Open http://localhost:8000 in your browser
   - You should see: `{"message":"NammaWay AI Backend (Postage-lite) is running!"}`

4. **Test the travel-advice endpoint**:
   - The Travel Optimizer page should now work without 500 errors
   - Try entering origin and destination to get travel directions

## What was fixed:
- Added `GROQ_API_KEY` to `backend/.env` file
- This key is required for the `/travel-advice` endpoint to work
- The endpoint uses Groq's LLM to generate travel directions for Coimbatore
