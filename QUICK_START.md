# Quick Start Guide

This guide will help you get the e-commerce API up and running quickly.

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- Git

## Setup Steps

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ecommerce-api
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your settings:

```env
MONGODB_URI=mongodb://localhost:27017/ecommerce_api
JWT_SECRET=your_super_secret_key_here
PORT=3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 4. Run the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

The server will start at `http://localhost:3000`

## Quick Test

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Register an Admin User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "password": "adminpass123",
    "role": "admin"
  }'
```

Save the returned token for next steps.

### 3. Create a Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "productName": "Test Product",
    "cost": 99.99,
    "description": "This is a test product for the API",
    "stockStatus": "In Stock"
  }'
```

### 4. Get All Products

```bash
curl http://localhost:3000/products
```

## Using Postman

1. Import the `postman_collection.json` file into Postman
2. Set the `baseUrl` variable to `http://localhost:3000`
3. Run the "Register Admin" request first
4. The token will be automatically saved for subsequent requests
5. Try creating and managing products

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Common Issues

### MongoDB Connection Error

- Ensure MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Verify MongoDB is accessible on the specified port

### JWT Token Issues

- Make sure `JWT_SECRET` is set in `.env`
- Check that the token is included in the Authorization header
- Verify the token format: `Bearer <token>`

### Port Already in Use

- Change the `PORT` in `.env` to a different value
- Or stop the process using the port: `lsof -ti:3000 | xargs kill`

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Explore the test files in `/tests` for usage examples
- Check the source code structure in `/src`
- Customize the API for your specific needs

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Review the test files for correct usage patterns
