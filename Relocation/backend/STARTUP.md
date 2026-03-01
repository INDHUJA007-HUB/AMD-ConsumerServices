# Backend Startup Guide

## Prerequisites
1. Docker Desktop must be running
2. Python with required packages installed

## Steps to Start

### 1. Start PostgreSQL Database
```bash
docker-compose up -d db
```

### 2. Verify Database Connection
```bash
cd backend
python test_postgres.py
```

### 3. Start Backend Server
```bash
cd backend
python run.py
```

## Verify Everything Works

### Check Database Users
```bash
cd backend
python test_postgres.py
```

### Test Registration
1. Open browser to http://localhost:5173 (or your frontend port)
2. Click Register
3. Fill all fields including email and password
4. Click Register button
5. Should redirect to dashboard

### Test Login
1. Use the email and password you registered with
2. Click Login
3. Should redirect to dashboard

## Troubleshooting

### If Docker fails:
- Make sure Docker Desktop is running
- Run: `docker-compose up -d db`

### If backend fails to connect:
- Check PostgreSQL is running: `docker ps`
- Verify credentials in .env match docker-compose.yml
- Current credentials: postgres/hi

### If login fails:
- Open browser console (F12) to see error messages
- Check backend logs for errors
- Verify user exists: `python test_postgres.py`
