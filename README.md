# E-commerce API

A RESTful e-commerce backend API built with Node.js, Express.js, and MongoDB. This API provides user authentication, role-based access control, and product management capabilities.

## Features

- User registration and authentication with JWT
- Role-based access control (Admin/Customer)
- Product management (CRUD operations)
- Secure password hashing with bcrypt
- Input validation and error handling
- MongoDB integration with Mongoose
- Comprehensive test coverage

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Testing**: Jest & Supertest
- **Security**: helmet, cors

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ecommerce-api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce_api
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce_api_test

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

5. Start MongoDB service on your system

6. Run the application:

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Base URL

```
http://localhost:3000
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "statusCode": 201
}
```

#### Login User

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "statusCode": 200
}
```

### Product Endpoints

#### Get All Products (Public)

```http
GET /products
```

**Response (200):**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "productName": "Sample Product",
        "ownerId": {
          "_id": "owner_id",
          "fullName": "Admin User",
          "email": "admin@example.com"
        },
        "cost": 99.99,
        "productImages": ["https://example.com/image.jpg"],
        "description": "Product description here",
        "stockStatus": "In Stock",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1
  },
  "statusCode": 200
}
```

#### Create Product (Admin Only)

```http
POST /products
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "productName": "New Product",
  "cost": 149.99,
  "productImages": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "description": "Detailed product description here",
  "stockStatus": "In Stock"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "product_id",
      "productName": "New Product",
      "ownerId": {
        "_id": "admin_id",
        "fullName": "Admin User",
        "email": "admin@example.com"
      },
      "cost": 149.99,
      "productImages": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "description": "Detailed product description here",
      "stockStatus": "In Stock",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 201
}
```

#### Delete Product (Admin Only)

```http
DELETE /products/:id
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "deletedProduct": {
      "_id": "product_id",
      "productName": "Deleted Product",
      "ownerId": "admin_id",
      "cost": 99.99,
      "productImages": [],
      "description": "Product description",
      "stockStatus": "In Stock",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "statusCode": 400
}
```

### Common Error Status Codes

- **400 Bad Request**: Validation errors, invalid input
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions (role-based)
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### JWT Token Structure

The JWT token contains the following payload:

```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "admin|customer",
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "ecommerce-api"
}
```

## User Roles

- **Admin**: Can create, read, and delete products
- **Customer**: Can only read products

## Validation Rules

### User Registration

- `fullName`: 2-100 characters, required
- `email`: Valid email format, unique, required
- `password`: Minimum 6 characters, required
- `role`: Must be "admin" or "customer", required

### Product Creation

- `productName`: 2-200 characters, required
- `cost`: Positive number, required
- `productImages`: Array of valid URLs, optional
- `description`: 10-1000 characters, required
- `stockStatus`: Non-empty string, required

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication & validation
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── app.js          # Express app setup
├── config/
│   └── database.js     # Database configuration
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── setup/          # Test configuration
├── server.js           # Application entry point
└── package.json        # Dependencies & scripts
```

## Environment Variables

| Variable           | Description                | Default                                        |
| ------------------ | -------------------------- | ---------------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string  | `mongodb://localhost:27017/ecommerce_api`      |
| `MONGODB_TEST_URI` | Test database connection   | `mongodb://localhost:27017/ecommerce_api_test` |
| `JWT_SECRET`       | Secret key for JWT signing | Required                                       |
| `JWT_EXPIRES_IN`   | Token expiration time      | `24h`                                          |
| `PORT`             | Server port                | `3000`                                         |
| `NODE_ENV`         | Environment mode           | `development`                                  |

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication with expiration
- Input validation and sanitization
- CORS configuration
- Security headers with helmet
- Role-based access control
- Error message sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
