#!/bin/bash

TIMESTAMP=$(date +%s)
EMAIL="admin${TIMESTAMP}@example.com"
PASSWORD="securepassword"

echo "1. Registering new Admin user: $EMAIL..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Admin User\",
    \"role\": \"ADMIN\"
  }")
echo "Response: $REGISTER_RESPONSE"

echo -e "\n\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "Response: $LOGIN_RESPONSE"

# Extract Token (Simple grep/cut for bash, ideally use jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

echo -e "\n\n3. Attempting to create movie WITHOUT token (Should fail)..."
curl -v -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Movie",
    "durationMin": 120,
    "releaseDate": "2026-01-01"
  }'

echo -e "\n\n4. Attempting to create movie WITH token (Should succeed)..."
curl -v -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Authorized Admin Movie",
    "description": "Created securely",
    "durationMin": 120,
    "releaseDate": "2026-01-01"
  }'
