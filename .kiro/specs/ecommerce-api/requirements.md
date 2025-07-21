# Requirements Document

## Introduction

This feature implements a RESTful e-commerce backend API with user authentication, role-based access control, and product management capabilities. The system supports two user roles (admin and customer) with different access levels, uses JWT for authentication, and MongoDB for data persistence. This is a backend-only implementation that provides API endpoints for client applications.

## Requirements

### Requirement 1

**User Story:** As a new user, I want to register an account with my personal information and role, so that I can access the e-commerce platform with appropriate permissions.

#### Acceptance Criteria

1. WHEN a POST request is made to "/auth/register" with fullName, email, password, and role THEN the system SHALL create a new user account
2. WHEN the role field is provided THEN the system SHALL validate that it is either "admin" or "customer"
3. WHEN the email is already registered THEN the system SHALL return an error response
4. WHEN required fields are missing THEN the system SHALL return a validation error
5. WHEN the password is provided THEN the system SHALL hash it before storing

### Requirement 2

**User Story:** As a registered user, I want to login with my credentials, so that I can receive a JWT token for authenticated requests.

#### Acceptance Criteria

1. WHEN a POST request is made to "/auth/login" with valid email and password THEN the system SHALL return a JWT token
2. WHEN the JWT token is generated THEN it SHALL contain userId, email, and role claims
3. WHEN invalid credentials are provided THEN the system SHALL return an authentication error
4. WHEN required login fields are missing THEN the system SHALL return a validation error

### Requirement 3

**User Story:** As any user (authenticated or not), I want to view a list of available products, so that I can browse the e-commerce catalog.

#### Acceptance Criteria

1. WHEN a GET request is made to "/products" THEN the system SHALL return a list of all products
2. WHEN products are returned THEN each product SHALL include productName, ownerId, cost, productImages, description, and stockStatus
3. WHEN no authentication is provided THEN the system SHALL still allow access to the product list
4. WHEN the database is empty THEN the system SHALL return an empty array

### Requirement 4

**User Story:** As an admin user, I want to add new products to the catalog, so that customers can purchase them.

#### Acceptance Criteria

1. WHEN a POST request is made to "/products" with valid product data and admin JWT THEN the system SHALL create a new product
2. WHEN the product is created THEN it SHALL include productName, ownerId, cost, productImages, description, and stockStatus
3. WHEN the ownerId is set THEN it SHALL be the ID of the authenticated admin user
4. WHEN a non-admin user attempts to create a product THEN the system SHALL return an authorization error
5. WHEN no JWT token is provided THEN the system SHALL return an authentication error
6. WHEN required product fields are missing THEN the system SHALL return a validation error

### Requirement 5

**User Story:** As an admin user, I want to delete products from the catalog, so that I can manage inventory and remove discontinued items.

#### Acceptance Criteria

1. WHEN a DELETE request is made to "/products/:id" with admin JWT THEN the system SHALL delete the specified product
2. WHEN the product ID does not exist THEN the system SHALL return a not found error
3. WHEN a non-admin user attempts to delete a product THEN the system SHALL return an authorization error
4. WHEN no JWT token is provided THEN the system SHALL return an authentication error
5. WHEN the product is successfully deleted THEN the system SHALL return a success confirmation

### Requirement 6

**User Story:** As a system administrator, I want all data to be stored in MongoDB, so that the application has reliable and scalable data persistence.

#### Acceptance Criteria

1. WHEN user data is created or updated THEN it SHALL be stored in a MongoDB users collection
2. WHEN product data is created, updated, or deleted THEN it SHALL be stored in a MongoDB products collection
3. WHEN the application starts THEN it SHALL establish a connection to MongoDB
4. WHEN database operations fail THEN the system SHALL return appropriate error responses
5. WHEN sensitive data like passwords are stored THEN they SHALL be properly hashed

### Requirement 7

**User Story:** As a security-conscious user, I want the system to implement proper authentication and authorization, so that my data is protected and access is controlled.

#### Acceptance Criteria

1. WHEN JWT tokens are generated THEN they SHALL include proper expiration times
2. WHEN protected endpoints are accessed THEN the system SHALL validate JWT tokens
3. WHEN role-based access is required THEN the system SHALL verify user roles from JWT claims
4. WHEN passwords are stored THEN they SHALL be hashed using a secure algorithm
5. WHEN authentication fails THEN the system SHALL not expose sensitive information in error messages
