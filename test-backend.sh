#!/bin/bash

echo "=== Testing Backend Endpoints ==="
echo ""

echo "1. Testing root endpoint:"
curl -s http://localhost:3001/
echo ""

echo "2. Testing health endpoint:"
curl -s http://localhost:3001/api/health
echo ""

echo "3. Testing /api (should return 404):"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:3001/api
echo ""

echo "=== Tests Complete ==="
