#!/bin/bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  --data '{"email":"pharmacist@test.metapharm.ch","password":"TestPass123!"}'
