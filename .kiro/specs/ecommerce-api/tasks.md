# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Initialize Node.js project with package.json
  - Install required dependencies (express, mongoose, jsonwebtoken, bcrypt, dotenv, express-validator)
  - Install development dependencies (jest, supertest, nodemon)
  - Create directory structure for organized code
  - _Requirements: 6.3_

- [x] 2. Configure database connection and environment setup

  - Create MongoDB connection configuration with Mongoose
  - Set up environment variable management with dotenv
  - Create database connection utility with error handling
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 3. Implement User model and schema

  - Create User schema with validation for fullName, email, password, and role
  - Add unique constraint for email field
  - Implement password hashing middleware using bcrypt
  - Add timestamps for createdAt and updatedAt
  - _Requirements: 1.1, 1.2, 1.5, 6.1, 6.5, 7.4_

- [x] 4. Implement Product model and schema

  - Create Product schema with all required fields
  - Set up reference to User model for ownerId
  - Add validation for required fields and data types
  - Add timestamps for createdAt and updatedAt
  - _Requirements: 4.2, 6.2_

- [x] 5. Create JWT utility functions

  - Implement JWT token generation function with userId, email, and role
  - Create JWT token verification function
  - Add proper error handling for invalid tokens
  - Set appropriate token expiration time
  - _Requirements: 2.2, 7.1, 7.2_

- [x] 6. Implement authentication middleware

  - Create middleware to verify JWT tokens from request headers
  - Extract user information from valid tokens
  - Handle authentication errors appropriately
  - _Requirements: 2.1, 7.2, 7.5_

- [x] 7. Implement role-based authorization middleware

  - Create middleware to check user roles from JWT claims
  - Implement admin-only access control
  - Handle authorization errors appropriately
  - _Requirements: 4.4, 5.3, 7.3_

- [x] 8. Implement user registration endpoint

  - Create POST /auth/register route handler
  - Validate required fields (fullName, email, password, role)
  - Check for existing email addresses
  - Hash password before saving to database
  - Return appropriate success/error responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9. Implement user login endpoint

  - Create POST /auth/login route handler
  - Validate email and password fields
  - Verify user credentials against database
  - Generate JWT token with user information
  - Return token and user data on success
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Implement products GET endpoint

  - Create GET /products route handler
  - Retrieve all products from database
  - Return product list with all required fields
  - Handle empty database case
  - Make endpoint publicly accessible
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 11. Implement products POST endpoint

  - Create POST /products route handler with admin authentication
  - Validate all required product fields
  - Set ownerId to authenticated admin user ID
  - Save product to database
  - Return created product data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 12. Implement products DELETE endpoint

  - Create DELETE /products/:id route handler with admin authentication
  - Validate product ID parameter
  - Check if product exists in database
  - Delete product from database
  - Return success confirmation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Implement global error handling middleware

  - Create centralized error handling middleware
  - Format error responses consistently
  - Handle different error types appropriately
  - Log errors for debugging
  - _Requirements: 6.4, 7.5_

- [x] 14. Create Express application setup

  - Initialize Express app with middleware
  - Configure CORS and security headers
  - Set up JSON parsing and URL encoding
  - Register route handlers
  - Add global error handling
  - _Requirements: 6.3_

- [x] 15. Create server entry point

  - Set up server startup with database connection
  - Configure port and environment settings
  - Add graceful shutdown handling
  - Start HTTP server
  - _Requirements: 6.3_

- [x] 16. Write unit tests for models

  - Test User model validation and password hashing
  - Test Product model validation and relationships
  - Test schema constraints and error cases
  - _Requirements: 1.2, 1.5, 4.2, 6.5_

- [x] 17. Write unit tests for JWT utilities

  - Test JWT token generation with correct payload
  - Test JWT token verification and error handling
  - Test token expiration scenarios
  - _Requirements: 2.2, 7.1, 7.2_

- [x] 18. Write integration tests for authentication endpoints

  - Test user registration with valid and invalid data
  - Test user login with correct and incorrect credentials
  - Test JWT token generation and validation
  - Test error responses for authentication failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 19. Write integration tests for product endpoints

  - Test GET /products endpoint accessibility
  - Test POST /products with admin and non-admin users
  - Test DELETE /products/:id with admin and non-admin users
  - Test error cases for invalid data and missing resources
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [x] 20. Create comprehensive API documentation

  - Document all endpoints with request/response examples
  - Create Postman collection with test requests
  - Include authentication setup instructions
  - Add error response documentation
  - _Requirements: All requirements for API usage_

- [x] 21. Install mongoose-paginate-v2 package

  - Add mongoose-paginate-v2 dependency to package.json
  - Update package-lock.json with new dependency
  - _Requirements: 9.4_

- [x] 22. Implement Brand model and schema

  - Create Brand schema with brandName field and unique constraint
  - Add timestamps for createdAt and updatedAt
  - Set up proper validation for required fields
  - _Requirements: 8.1, 8.2_

- [x] 23. Update Product model to include brand reference

  - Add brand field as ObjectId reference to Brand collection
  - Make brand field required in product schema
  - Update existing product validation to include brand
  - _Requirements: 10.1, 10.2_

- [x] 24. Implement brand controller with CRUD operations

  - Create POST /brands endpoint for creating brands (admin only)
  - Create PUT /brands/:id endpoint for updating brands (admin only)
  - Create GET /brands endpoint for listing all brands (public)
  - Create DELETE /brands/:id endpoint for deleting brands (admin only)
  - Add proper validation and error handling for all operations
  - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 25. Implement paginated products by brand endpoint

  - Create GET /products/:brand/:page/:limit endpoint
  - Integrate mongoose-paginate-v2 for pagination functionality
  - Add brand filtering using ObjectId parameter
  - Populate brand information in product results
  - Handle invalid brand IDs and empty results appropriately
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 26. Update existing product endpoints to handle brand references

  - Modify POST /products to require brand field
  - Update GET /products to populate brand information
  - Ensure proper validation for brand references in product creation
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 27. Create brand routes and integrate with Express app

  - Set up brand routes with proper middleware
  - Apply authentication and authorization middleware to protected routes
  - Register brand routes in main Express application
  - _Requirements: 8.6, 8.7_

- [x] 28. Write unit tests for Brand model

  - Test Brand schema validation and constraints
  - Test brandName uniqueness constraint
  - Test required field validation
  - _Requirements: 8.2_

- [x] 29. Write integration tests for brand endpoints

  - Test POST /brands with admin and non-admin users
  - Test PUT /brands/:id with valid and invalid data
  - Test GET /brands endpoint functionality
  - Test DELETE /brands/:id with proper authorization
  - Test error cases for invalid brand IDs and duplicate names
  - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 30. Write integration tests for paginated brand products

  - Test GET /products/:brand/:page/:limit with valid brand IDs
  - Test pagination functionality with different page sizes
  - Test brand population in product results
  - Test error cases for invalid brand IDs
  - Test empty results for brands with no products
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 31. Update existing product tests for brand integration

  - Modify product creation tests to include brand references
  - Update product retrieval tests to verify brand population
  - Test product validation with missing or invalid brand references
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 32. Update Postman collection with brand endpoints

  - Add brand CRUD operations to Postman collection
  - Include paginated products by brand endpoint
  - Update product creation requests to include brand references
  - Add proper authentication headers for admin operations
  - _Requirements: 8.1, 8.3, 8.4, 8.5, 9.1_

- [-] 33. Deploy updated API to Render.com

  - Push all brand management changes to repository
  - Verify deployment on Render.com platform
  - Test all new endpoints in production environment
  - Update environment variables if needed
  - _Requirements: All brand-related requirements_
