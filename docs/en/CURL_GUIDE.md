# 🔧 cURL Testing Guide

This guide provides practical examples for testing all API endpoints using cURL commands.

## 🔐 Authentication

### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
# Save the token from the response
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Response example:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": { ... }
#   }
# }
```

### Get Profile (Protected)
```bash
# Use the token from login
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Refresh Token
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 👥 User Management

### Get All Users (Admin only)
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Specific User
```bash
curl -X GET http://localhost:4000/api/users/user-id-here \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Update User
```bash
curl -X PUT http://localhost:4000/api/users/user-id-here \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Delete User (Admin only)
```bash
curl -X DELETE http://localhost:4000/api/users/user-id-here \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔍 Search System

### Basic Content Search
```bash
curl -X GET "http://localhost:4000/api/search/content?query=javascript" \
  -H "Content-Type: application/json"
```

### Advanced Search with Filters
```bash
curl -X GET "http://localhost:4000/api/search/content?query=tutorial&filters=%7B%22category%22%3A%22programming%22%2C%22isPublished%22%3Atrue%7D" \
  -H "Content-Type: application/json"

# Decoded filters: {"category":"programming","isPublished":true}
```

### Search with Sorting
```bash
curl -X GET "http://localhost:4000/api/search/content?query=react&sort=createdAt&order=desc" \
  -H "Content-Type: application/json"
```

### Paginated Search
```bash
curl -X GET "http://localhost:4000/api/search/content?query=javascript&page=2&limit=10" \
  -H "Content-Type: application/json"
```

### User Search
```bash
curl -X GET "http://localhost:4000/api/search/users?query=john" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Search Suggestions (Autocomplete)
```bash
curl -X GET "http://localhost:4000/api/search/suggest?q=java&type=content" \
  -H "Content-Type: application/json"
```

### Get Facets for Filtering
```bash
curl -X GET "http://localhost:4000/api/search/facets?index=content" \
  -H "Content-Type: application/json"
```

## 📊 Advanced Examples

### Complete Search with All Parameters
```bash
curl -X GET "http://localhost:4000/api/search/content" \
  -H "Content-Type: application/json" \
  -G \
  --data-urlencode "query=advanced javascript tutorial" \
  --data-urlencode "filters={\"category\":\"programming\",\"level\":\"advanced\",\"isPublished\":true}" \
  --data-urlencode "sort=relevance" \
  --data-urlencode "order=desc" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=20"
```

### Search with Multiple Filters
```bash
curl -X GET "http://localhost:4000/api/search/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -G \
  --data-urlencode "query=developer" \
  --data-urlencode "filters={\"role\":\"User\",\"status\":\"ACTIVE\",\"department\":\"Engineering\"}"
```

## 🧪 Testing Input Sanitization

### Testing XSS Protection
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "<script>alert('xss')</script>John",
    "lastName": "Doe"
  }'

# The firstName should be sanitized
```

### Testing SQL Injection Protection
```bash
curl -X GET "http://localhost:4000/api/search/content?query=test'; DROP TABLE users; --" \
  -H "Content-Type: application/json"

# The query should be properly sanitized
```

### Testing Path Traversal Protection
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "../../../etc/passwd",
    "lastName": "Doe"
  }'

# The firstName should be sanitized
```

## 📈 Performance and Monitoring

### Health Check
```bash
curl -X GET http://localhost:4000/health \
  -H "Content-Type: application/json"
```

### API Metrics (if implemented)
```bash
curl -X GET http://localhost:4000/metrics \
  -H "Content-Type: application/json"
```

## 🔧 Utility Scripts

### Batch User Registration
```bash
#!/bin/bash
# register_users.sh
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"user$i@example.com\",
      \"password\": \"SecurePass123!\",
      \"firstName\": \"User\",
      \"lastName\": \"$i\"
    }"
  echo "User $i registered"
done
```

### Search Performance Test
```bash
#!/bin/bash
# search_test.sh
echo "Testing search performance..."
time curl -X GET "http://localhost:4000/api/search/content?query=javascript" \
  -H "Content-Type: application/json" \
  -w "\nTime: %{time_total}s\n"
```

### Login and Save Token
```bash
#!/bin/bash
# login.sh
response=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }')

token=$(echo $response | jq -r '.data.token')
echo "export TOKEN=\"$token\""
echo "Token saved. Run: source <(./login.sh)"
```

## 🐛 Error Testing

### Invalid Authentication
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json"

# Should return 401 Unauthorized
```

### Missing Required Fields
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Should return validation errors
```

### Rate Limiting Test (if implemented)
```bash
#!/bin/bash
# rate_limit_test.sh
for i in {1..100}; do
  curl -X GET http://localhost:4000/api/search/content?query=test \
    -H "Content-Type: application/json" &
done
wait
```

## 📋 Response Examples

### Successful Login Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "User",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Search Results Response
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "content-1",
        "title": "JavaScript Tutorial",
        "content": "Learn JavaScript...",
        "score": 0.95
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 🔗 Quick Links

- **Swagger Documentation**: http://localhost:4000/api-docs
- **Health Check**: http://localhost:4000/health
- **Base API URL**: http://localhost:4000/api

## 💡 Tips

1. **Use environment variables** for tokens and sensitive data
2. **Save tokens** in variables for reuse in scripts
3. **URL encode** complex filters and queries
4. **Test error cases** to verify proper handling
5. **Monitor response times** for performance testing

---

This guide covers practical cURL usage for testing the Template API. For more details, check the Swagger documentation at `/api-docs`.
