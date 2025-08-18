# Design Document

## Overview

The e-commerce API is a Node.js backend application built with Express.js framework, implementing RESTful endpoints for user authentication and product management. The system uses MongoDB for data persistence, JWT for authentication, and bcrypt for password hashing. The architecture follows a layered approach with clear separation between routes, controllers, services, and data access layers.

## Architecture

The application follows a standard MVC-like architecture:

```
├── src/
│   ├── controllers/     # Request handling and response formatting
│   ├── middleware/      # Authentication and validation middleware
│   ├── models/         # MongoDB schemas and models
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic layer
│   ├── utils/          # Helper functions and utilities
│   └── app.js          # Express app configuration
├── config/
│   └── database.js     # MongoDB connection configuration
└── server.js           # Application entry point
```

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Pagination**: mongoose-paginate-v2
- **Environment Management**: dotenv

## Components and Interfaces

### Authentication System

- **JWT Service**: Handles token generation and verification
- **Password Service**: Manages password hashing and comparison
- **Auth Middleware**: Validates JWT tokens and extracts user information
- **Role Middleware**: Enforces role-based access control

### User Management

- **User Model**: MongoDB schema for user data
- **Auth Controller**: Handles registration and login requests
- **User Service**: Business logic for user operations

### Product Management

- **Product Model**: MongoDB schema for product data with brand reference
- **Product Controller**: Handles product CRUD operations and brand-based filtering
- **Product Service**: Business logic for product operations and pagination

### Brand Management

- **Brand Model**: MongoDB schema for brand data
- **Brand Controller**: Handles brand CRUD operations
- **Brand Service**: Business logic for brand operations

### API Endpoints

#### Authentication Routes (`/auth`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication

#### Product Routes (`/products`)

- `GET /products` - Retrieve all products (public)
- `POST /products` - Create new product (admin only)
- `DELETE /products/:id` - Delete product (admin only)
- `GET /products/:brand/:page/:limit` - Get paginated products by brand (public)

#### Brand Routes (`/brands`)

- `GET /brands` - Retrieve all brands (public)
- `POST /brands` - Create new brand (admin only)
- `PUT /brands/:id` - Update brand (admin only)
- `DELETE /brands/:id` - Delete brand (admin only)

## Data Models

### User Schema

```javascript
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'customer'], required),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

### Product Schema

```javascript
{
  productName: String (required),
  ownerId: ObjectId (required, ref: 'User'),
  brand: ObjectId (required, ref: 'Brand'),
  cost: Number (required),
  productImages: [String] (array of image URLs),
  description: String (required),
  stockStatus: String (required),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

### Brand Schema

```javascript
{
  brandName: String (required, unique),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

### JWT Payload Structure

```javascript
{
  userId: ObjectId,
  email: String,
  role: String,
  iat: Number,
  exp: Number
}
```

## Error Handling

### Error Response Format

```javascript
{
  success: false,
  message: String,
  error: String (optional, for development),
  statusCode: Number
}
```

### Error Categories

- **Validation Errors** (400): Invalid input data
- **Authentication Errors** (401): Invalid or missing JWT token
- **Authorization Errors** (403): Insufficient permissions
- **Not Found Errors** (404): Resource not found
- **Server Errors** (500): Internal server errors

### Global Error Handler

- Centralized error handling middleware
- Environment-specific error responses
- Logging for debugging and monitoring

## Testing Strategy

### Unit Testing

- **Models**: Test schema validation and methods
- **Services**: Test business logic functions
- **Utilities**: Test helper functions and JWT operations

### Integration Testing

- **API Endpoints**: Test complete request-response cycles
- **Database Operations**: Test CRUD operations with test database
- **Authentication Flow**: Test JWT generation and validation
- **Pagination**: Test brand-based product filtering with pagination
- **Brand Management**: Test brand CRUD operations and product associations

### Test Structure

```
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.js
│   │   └── products.test.js
│   └── setup/
│       └── testDb.js
```

### Testing Tools

- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: MongoDB Memory Server for isolated testing
- **Mocking**: Jest mocks for external dependencies

## Security Considerations

### Authentication Security

- JWT tokens with reasonable expiration times
- Secure password hashing with bcrypt (salt rounds: 12)
- Input validation and sanitization
- Rate limiting for authentication endpoints

### Data Protection

- Environment variables for sensitive configuration
- Password hashing before database storage
- Secure HTTP headers with helmet middleware
- CORS configuration for cross-origin requests

### Authorization

- Role-based access control middleware
- JWT token validation on protected routes
- User ownership verification for resource access
