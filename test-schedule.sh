#!/bin/bash

echo "1. Creating Showtime for Movie 1 on Screen 1 at 10:00 AM..."
curl -X POST http://localhost:3000/api/showtimes \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": 1,
    "screenId": 1,
    "startTime": "2026-03-01T10:00:00Z",
    "price": 12.50
  '

echo -e "\n\n2. Attempting to create overlapping showtime (should fail)..."
# Movie 1 is 148 mins. 10:00 + 148m + 20m cleaning = ~12:48 PM end.
# Trying to schedule at 11:00 AM should fail.
curl -X POST http://localhost:3000/api/showtimes \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": 2,
    "screenId": 1,
    "startTime": "2026-03-01T11:00:00Z",
    "price": 15.00
  }'

echo -e "\n\n3. Creating valid showtime after the first one..."
# Trying to schedule at 14:00 PM (2:00 PM) should succeed.
curl -X POST http://localhost:3000/api/showtimes \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": 2,
    "screenId": 1,
    "startTime": "2026-03-01T14:00:00Z",
    "price": 15.00
  }'

echo -e "\n\n4. Listing Showtimes..."
curl -v "http://localhost:3000/api/showtimes?date=2026-03-01"
