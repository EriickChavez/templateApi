# 🚀 Advanced Features Documentation

This document covers all the advanced features implemented in the template API.

## 📊 Performance Monitoring

### Description
A performance monitoring system that tracks real-time metrics of all requests.

### Available Endpoints

#### GET /metrics
Gets general performance statistics.

**Required Headers:**
```
Authorization: Bearer <admin_token>
Accept-Version: v1 (optional)
```

**Query Parameters:**
- `minutes` (number, optional): Time window in minutes (default: 5)

**Response Example:**
```json
{
  "success": true,
  "message": "Performance statistics retrieved",
  "data": {
    "totalRequests": 150,
    "averageResponseTime": 245,
    "errorRate": 2,
    "slowRequests": 3,
    "currentMemory": {
      "rss": 45678912,
      "heapUsed": 23456789,
      "heapTotal": 34567890,
      "external": 1234567
    },
    "timeWindow": "5 minutes"
  },
  "meta": {
    "correlationId": "uuid-here",
    "timestamp": "2024-01-20T10:30:00.000Z",
    "version": "v1"
  }
}
```

#### GET /metrics/slow
Lists the slowest requests.

**Query Parameters:**
- `threshold` (number, optional): Threshold in ms (default: 1000)
- `limit` (number, optional): Result limit (default: 10)

#### GET /metrics/recent
Gets detailed recent metrics.

**Query Parameters:**
- `limit` (number, optional): Number of metrics (default: 50)

#### GET /metrics/health
Advanced health check with system metrics.

### Configuration
Metrics are stored in memory (maximum 1000). For production, using Redis is recommended.

---

## 🔍 Request Tracing & Correlation IDs

### Description
A tracing system that allows tracking requests throughout the application.

### Automatic Headers
The API automatically adds these headers to all responses:
- `X-Correlation-ID`: Unique ID for the request
- `X-Request-ID`: Specific ID of the current request

### Usage
You can send your own correlation ID:
```bash
curl -H "X-Correlation-ID: my-custom-id" http://localhost:4000/users
```

### Structured Logs
All logs include tracing information:
```
[correlation-id] GET /users - 200 (245ms)
```

---

## 🔢 API Versioning

### Description
A flexible versioning system supporting multiple specification methods.

### Versioning Methods

#### 1. Header Accept-Version (Recommended)
```bash
curl -H "Accept-Version: v1" http://localhost:4000/users
```

#### 2. Header API-Version
```bash
curl -H "API-Version: v1" http://localhost:4000/users
```

#### 3. URL Path
```bash
curl http://localhost:4000/v1/users
```

#### 4. Query Parameter
```bash
curl http://localhost:4000/users?version=v1
```

### Supported Versions
- **v1**: Current version (default)
- **v2**: Next version (in development)

### Information Endpoint
#### GET /version
Gets detailed version information.

**Response Example:**
```json
{
  "success": true,
  "message": "API version information",
  "data": {
    "currentVersion": "v1",
    "defaultVersion": "v1",
    "supportedVersions": {
      "v1": {
        "version": "v1",
        "deprecated": false
      },
      "v2": {
        "version": "v2",
        "deprecated": false
      }
    },
    "requestInfo": {
      "detectedVersion": "v1",
      "versionSource": "Default version"
    }
  }
}
```

### Deprecation
When a version is deprecated, the API returns special headers:
- `Deprecation: true`
- `Deprecation-Date: 2024-06-01`
- `Sunset: 2024-12-01`

---
