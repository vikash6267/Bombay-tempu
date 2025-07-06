# Transport & Fleet Management System API Documentation

## Overview

This API provides comprehensive fleet management capabilities including user management, vehicle tracking, trip management, payment processing, maintenance scheduling, and reporting.

## Base URL

\`\`\`
http://localhost:5000/api/v1
\`\`\`

## Authentication

All API endpoints (except registration and login) require authentication using JWT tokens.

### Headers Required

\`\`\`
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
\`\`\`

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/logout` | User logout | Protected |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| PATCH | `/auth/reset-password/:token` | Reset password with token | Public |
| GET | `/auth/verify-email/:token` | Verify email address | Public |
| GET | `/auth/me` | Get current user profile | Protected |
| PATCH | `/auth/update-password` | Update current password | Protected |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/users` | Get all users | Admin |
| POST | `/users` | Create new user | Admin |
| GET | `/users/:id` | Get user by ID | Admin |
| PATCH | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/profile` | Get current user profile | Protected |
| PATCH | `/users/profile` | Update current user profile | Protected |
| POST | `/users/profile/photo` | Upload profile photo | Protected |
| PATCH | `/users/:id/activate` | Activate user account | Admin |
| PATCH | `/users/:id/deactivate` | Deactivate user account | Admin |

### Vehicle Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/vehicles` | Get all vehicles | Protected |
| POST | `/vehicles` | Create new vehicle | Admin/Fleet Owner |
| GET | `/vehicles/:id` | Get vehicle by ID | Protected |
| PATCH | `/vehicles/:id` | Update vehicle | Admin/Fleet Owner |
| DELETE | `/vehicles/:id` | Delete vehicle | Admin |
| POST | `/vehicles/:id/documents` | Upload vehicle documents | Admin/Fleet Owner |
| GET | `/vehicles/:id/maintenance` | Get vehicle maintenance records | Protected |
| GET | `/vehicles/expiring-documents` | Get vehicles with expiring documents | Admin/Fleet Owner |
| GET | `/vehicles/emi-due` | Get vehicles with EMI due | Admin/Fleet Owner |

### Trip Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/trips` | Get all trips | Protected |
| POST | `/trips` | Create new trip | Admin/Client |
| GET | `/trips/:id` | Get trip by ID | Protected |
| PATCH | `/trips/:id` | Update trip | Protected |
| DELETE | `/trips/:id` | Delete trip | Admin |
| GET | `/trips/stats` | Get trip statistics | Admin |
| GET | `/trips/my-trips` | Get current user's trips | Protected |
| PATCH | `/trips/:id/status` | Update trip status | Protected |
| POST | `/trips/:id/advance` | Add advance payment | Admin |
| POST | `/trips/:id/expense` | Add expense | Protected |
| POST | `/trips/:id/documents` | Upload trip documents | Protected |

### Payment Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/payments` | Get all payments | Protected |
| POST | `/payments` | Create new payment | Admin |
| GET | `/payments/:id` | Get payment by ID | Protected |
| PATCH | `/payments/:id` | Update payment | Admin |
| DELETE | `/payments/:id` | Delete payment | Admin |
| GET | `/payments/stats` | Get payment statistics | Admin |
| GET | `/payments/outstanding` | Get outstanding payments | Admin |
| GET | `/payments/my-payments` | Get current user's payments | Protected |
| PATCH | `/payments/:id/approve` | Approve payment | Admin |
| PATCH | `/payments/:id/cancel` | Cancel payment | Admin |
| POST | `/payments/:id/documents` | Upload payment documents | Protected |

### Maintenance Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/maintenance` | Get all maintenance records | Protected |
| POST | `/maintenance` | Create new maintenance record | Admin/Fleet Owner |
| GET | `/maintenance/:id` | Get maintenance record by ID | Protected |
| PATCH | `/maintenance/:id` | Update maintenance record | Admin/Fleet Owner |
| DELETE | `/maintenance/:id` | Delete maintenance record | Admin |
| GET | `/maintenance/upcoming` | Get upcoming maintenance | Admin/Fleet Owner |
| GET | `/maintenance/stats` | Get maintenance statistics | Admin/Fleet Owner |
| PATCH | `/maintenance/:id/complete` | Mark maintenance as completed | Admin/Fleet Owner |
| POST | `/maintenance/:id/documents` | Upload maintenance documents | Protected |

### Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/reports/dashboard` | Get dashboard statistics | Protected |
| GET | `/reports/financial` | Get financial reports | Admin |
| GET | `/reports/operational` | Get operational reports | Admin/Fleet Owner |
| GET | `/reports/vehicle-performance` | Get vehicle performance reports | Admin/Fleet Owner |

## User Roles & Permissions

### Admin (Broker)
- Full system access
- Can manage all users, vehicles, trips, payments
- Access to all reports and analytics
- Can approve payments and manage finances

### Fleet Owner
- Can manage their own vehicles
- View trips assigned to their vehicles
- Access to maintenance records for their vehicles
- View payments related to their vehicles
- Limited reporting access

### Client
- Can create trip requests
- View their own trips and payments
- Update profile information
- Limited to their own data

### Driver
- View assigned trips
- Update trip status and add expenses
- Upload trip documents
- View assigned vehicle information
- Limited to assigned trips and vehicle

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

\`\`\`json
{
  "status": "error",
  "message": "Error description"
}
\`\`\`

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## File Uploads

The API supports file uploads for:
- Vehicle documents (registration, insurance, etc.)
- Trip documents (receipts, photos, etc.)
- Maintenance documents (invoices, receipts, etc.)
- User profile photos
- Payment receipts

Supported formats: JPG, PNG, PDF
Maximum file size: 5MB

## Pagination

List endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: -createdAt)
- `fields` - Select specific fields

Example:
\`\`\`
GET /api/v1/trips?page=2&limit=10&sort=-createdAt&fields=tripNumber,status,origin
\`\`\`

## Filtering

Most list endpoints support filtering with query parameters:

\`\`\`
GET /api/v1/trips?status=completed&client=60d5ecb74b24a1234567890a
GET /api/v1/vehicles?vehicleType=truck&status=available
\`\`\`

## Environment Variables Required

\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/transport_fleet_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
EMAIL_FROM=noreply@transportfleet.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CLIENT_URL=http://localhost:3000
\`\`\`

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the server: `npm run dev`
4. Access API documentation: `http://localhost:5000/api-docs`

## Support

For API support and questions, please contact the development team or create an issue in the project repository.
