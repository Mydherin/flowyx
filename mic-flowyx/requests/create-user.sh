#!/bin/bash

curl -s -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }' \
  | jq .
