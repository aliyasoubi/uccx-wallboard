# UCCX IVR Monitoring Wallboard Backend

A robust **NestJS-based backend service** for the UCCX IVR Monitoring Dashboard, providing real-time and historical data for Cisco Unified Contact Center Express (UCCX) metrics, including operators, queues, and calls. Designed with scalability, security, and multi-tenancy in mind, this backend leverages **Redis** for caching, **WebSocket** for real-time updates, and **JWT-based authentication** for secure access.

---

## Features

- **Real-Time Monitoring**: Tracks UCCX operators, queues, and active calls with configurable polling intervals.
- **Historical Analytics**: Stores and retrieves historical UCCX data for performance insights (supports ODBC/SQL integration).
- **Multi-Tenant Support**: Isolates data and access per tenant with role-based access control (RBAC) using JWT.
- **WebSocket Integration**: Enables instant dashboard updates via scalable Redis Pub/Sub.
- **Redis Caching**: Optimizes API performance with configurable TTL for cached UCCX data.
- **Swagger/OpenAPI Documentation**: Comprehensive API documentation for all endpoints.
- **Resilient UCCX Integration**: Retry mechanism for UCCX API calls with configurable backoff and max attempts.
- **Data Validation**: Enforces strict input/output validation using `class-validator` and DTOs.
- **Environment-Specific Configuration**: Supports `.env.development`, `.env.production`, and custom configurations.
- **Graceful Error Handling**: Global exception filters and user-friendly error responses.
- **Monitoring & Logging**: Structured logging and health endpoints for operational insights.
- **Testing**: Unit and end-to-end (e2e) tests with coverage reporting.

---

## Prerequisites

- **Node.js**: v16 or higher
- **npm** or **yarn**: Package manager for dependencies
- **Redis**: Server for caching and WebSocket Pub/Sub
- **UCCX Server**: Access to UCCX HTTP API (required) and ODBC/SQL for historical data (optional)
- **Environment Variables**: Configured via `.env` files (see [Configuration](#configuration))

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/uccx-ivr-monitoring-backend.git
cd uccx-ivr-monitoring-backend
npm install
```
---

## Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env.development` or `.env.production` and update with your settings.

### Example `.env.example`
```bash
env
# Application Settings
PORT=3001
NODE_ENV=development

# UCCX API Configuration
UCCX_QUEUE_STATS_URL=http://uccx.example.com:9080/realtime/VoiceIAQStats
UCCX_AGENT_STATS_URL=http://uccx.example.com:9080/realtime/ResourceIAQStats
UCCX_API_USER=your-uccx-username
UCCX_API_PASS=your-uccx-password
UCCX_POLLING_INTERVAL=30000  # Polling interval in milliseconds
UCCX_RETRY_ATTEMPTS=3        # Max retry attempts for API calls
UCCX_RETRY_DELAY=1000        # Delay between retries in milliseconds

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TTL=60                 # Cache TTL in seconds

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# Logging (optional)
LOG_LEVEL=info
```
> **Security Note**: Never commit `.env` files with sensitive data to version control. Use `.env.example` to share configuration templates with team members.

---

## Project Structure
```bash
graphql
uccx-ivr-monitoring-backend/
├── src/
│   ├── uccx/
│   │   ├── queues/         # Queue stats API integration and logic
│   │   ├── agents/         # Agent stats API integration and logic
│   │   ├── calls/          # Call stats API integration and logic
│   │   └── uccx.service.ts # Core UCCX API interaction service
│   ├── auth/               # JWT authentication and RBAC logic
│   ├── tenants/            # Multi-tenant data isolation and utilities
│   ├── redis/              # Redis connection and caching utilities
│   ├── websocket/          # WebSocket gateway for real-time updates
│   ├── config/             # Environment and configuration management
│   ├── common/             # Shared DTOs, interfaces, and utilities
│   └── main.ts             # Application entry point
├── test/                   # Unit and e2e test files
├── .env.example            # Example environment configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```
---

## Running the Application

### Development Mode
```bash
bash
npm run start:dev
```
Runs the application with hot-reloading for development.

### Production Mode
```bash
bash
npm run build
npm run start:prod
```
Builds and runs the optimized production bundle.

---

## API Documentation

Interactive **Swagger/OpenAPI** documentation is available at:


http://localhost:3001/api

Features of the API documentation:
- Full endpoint descriptions with request/response schemas
- Authentication requirements (JWT bearer tokens)
- Example requests and responses
- Error codes and handling details

---

## Security & Best Practices

- **Sensitive Data**: All secrets (e.g., UCCX credentials, JWT secret) are stored in environment variables.
- **Authentication**: JWT-based with role-based access control (RBAC) enforced on all endpoints.
- **Secure Communication**: Use HTTPS in production for all external API and WebSocket communication.
- **Data Validation**: Input/output validated using `class-validator` and DTOs to prevent invalid data.
- **Error Handling**: Global exception filters ensure consistent, user-friendly error responses.
- **Git Security**: `.env` files are excluded from version control via `.gitignore`.

---

## Caching & Performance

- **Redis Caching**: Frequently accessed UCCX API data is cached with a configurable TTL (default: 60 seconds).
- **Redis Pub/Sub**: Enables scalable WebSocket broadcasts for real-time updates across multiple backend instances.
- **Retry Logic**: UCCX API calls include retry mechanisms with configurable attempts and backoff delays.
- **Polling Optimization**: Configurable intervals for real-time data fetching to balance performance and freshness.

---

## Error Handling

- **Global Exception Filters**: Handle all errors consistently with structured responses.
- **Validation Errors**: Clearly separated from service errors with detailed messages.
- **HTTP Status Codes**: Appropriate status codes (e.g., `400` for validation, `503` for service failures).
- **Logging**: All errors are logged with context for debugging (configurable log levels).

---

## Monitoring & Logging

- **Structured Logging**: Uses NestJS built-in logging with configurable log levels (`error`, `warn`, `info`, `debug`).
- **Health Endpoints**: `/health` endpoint for basic service status (extendable for advanced monitoring).
- **Metrics**: Ready for integration with Prometheus or other monitoring tools (coming soon).

---

## Testing

Run tests to ensure code quality:

- **Unit Tests**:
  ```bash
  npm run test
  
## Contributing

1. Fork the repository
2. Create a new feature branch: git checkout -b feature/my-feature
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 