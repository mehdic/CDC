#!/bin/bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pharmacist@test.metapharm.ch","password":"TestPass123!"}' \
  -v
