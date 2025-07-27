# 📮 Complete Postman API Guide

## E-commerce API Testing Documentation

**Production API URL**: `https://e-commerce-app-2jf2.onrender.com`

---

## 🚀 **Quick Setup (5 Minutes)**

### **Step 1: Import Collection & Environment**

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select these files:
   - `postman_collection_v2.json`
   - `postman_environment_production.json`
   - `postman_environment_local.json`
4. Click **Import**

### **Step 2: Select Environment**

1. In top-right corner, select **"Production (Render)"**
2. Verify the URL shows: `https://e-commerce-app-2jf2.onrender.com`

### **Step 3: Start Testing**

1. Run **Health Check** first
2. Then **Register Admin User**
3. You're ready to test all endpoints!

---

## 📋 **Complete API Reference**

### **🏥 Health & Status**

#### **Health Check**

- **Method**: `GET`
- **URL**: `{{baseUrl}}/health`
- **Authentication**: None required
- **Purpose**: Verify server is running

**Expected Response (200)**:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-07-26T15:12:43.643Z",
  "statusCode": 200
}
```

**Postman Test Scripts**:

- ✅ Verifies status code is 200
- ✅ Checks response has success field
- ✅ Validates timestamp exists

---

### **🔐 Authentication Endpoints**

#### **1. Register Admin User**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`
- **Authentication**: None required

**Request Body**:

```json
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "adminpass123",
  "role": "admin"
}
```

**Expected Response (201)**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6884f0aaaa5948670368d5b6",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2025-07-26T15:13:46.734Z",
      "updatedAt": "2025-07-26T15:13:46.734Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 201
}
```

**Auto-Actions**:

- 🔄 Saves `adminToken` automatically
- 🔄 Sets `authToken` for immediate use

#### **2. Register Customer User**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`

**Request Body**:

```json
{
  "fullName": "John Customer",
  "email": "customer@example.com",
  "password": "password123",
  "role": "customer"
}
```

**Auto-Actions**:

- 🔄 Saves `customerToken` automatically

#### **3. Login Admin**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`

**Request Body**:

```json
{
  "email": "admin@example.com",
  "password": "adminpass123"
}
```

**Expected Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6884f0aaaa5948670368d5b6",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "statusCode": 200
}
```

#### **4. Login Customer**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`

**Request Body**:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

---

### **🛍️ Product Management**

#### **1. Get All Products (Public)**

- **Method**: `GET`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: None required
- **Purpose**: Browse all products

**Expected Response (200)**:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "product_id_here",
        "productName": "Premium Laptop",
        "ownerId": {
          "_id": "owner_id",
          "fullName": "Admin User",
          "email": "admin@example.com"
        },
        "cost": 1299.99,
        "productImages": [
          "https://example.com/laptop1.jpg",
          "https://example.com/laptop2.jpg"
        ],
        "description": "High-performance laptop...",
        "stockStatus": "In Stock",
        "createdAt": "2025-07-26T15:20:00.000Z",
        "updatedAt": "2025-07-26T15:20:00.000Z"
      }
    ],
    "count": 1
  },
  "statusCode": 200
}
```

#### **2. Create Product (Admin Only)**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: `Bearer {{adminToken}}`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

**Request Body**:

```json
{
  "productName": "Premium Laptop",
  "cost": 1299.99,
  "productImages": [
    "https://example.com/laptop1.jpg",
    "https://example.com/laptop2.jpg"
  ],
  "description": "High-performance laptop with 16GB RAM, 512GB SSD, and Intel i7 processor. Perfect for professional work and gaming.",
  "stockStatus": "In Stock"
}
```

**Expected Response (201)**:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "_id": "6884f2a1aa5948670368d5b8",
      "productName": "Premium Laptop",
      "ownerId": {
        "_id": "6884f0aaaa5948670368d5b6",
        "fullName": "Admin User",
        "email": "admin@example.com"
      },
      "cost": 1299.99,
      "productImages": [
        "https://example.com/laptop1.jpg",
        "https://example.com/laptop2.jpg"
      ],
      "description": "High-performance laptop...",
      "stockStatus": "In Stock",
      "createdAt": "2025-07-26T15:20:00.000Z",
      "updatedAt": "2025-07-26T15:20:00.000Z"
    }
  },
  "statusCode": 201
}
```

**Auto-Actions**:

- 🔄 Saves `productId` for delete testing

#### **3. Create Product Without Images**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: `Bearer {{adminToken}}`

**Request Body**:

```json
{
  "productName": "Wireless Mouse",
  "cost": 29.99,
  "description": "Ergonomic wireless mouse with long battery life and precision tracking.",
  "stockStatus": "Available"
}
```

**Note**: `productImages` will default to empty array `[]`

#### **4. Delete Product (Admin Only)**

- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/products/{{productId}}`
- **Authentication**: `Bearer {{adminToken}}`

**Headers**:

```
Authorization: Bearer {{adminToken}}
```

**Expected Response (200)**:

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "deletedProduct": {
      "_id": "6884f2a1aa5948670368d5b8",
      "productName": "Premium Laptop",
      "ownerId": "6884f0aaaa5948670368d5b6",
      "cost": 1299.99,
      "productImages": ["https://example.com/laptop1.jpg"],
      "description": "High-performance laptop...",
      "stockStatus": "In Stock"
    }
  },
  "statusCode": 200
}
```

---

### **🚫 Error Testing Scenarios**

#### **1. Invalid Registration Data**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`

**Request Body (Invalid)**:

```json
{
  "fullName": "A",
  "email": "invalid-email",
  "password": "123",
  "role": "invalid-role"
}
```

**Expected Response (400)**:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "Full name must be between 2 and 100 characters",
      "path": "fullName",
      "location": "body"
    },
    {
      "type": "field",
      "msg": "Please provide a valid email address",
      "path": "email",
      "location": "body"
    }
  ],
  "statusCode": 400
}
```

#### **2. Unauthorized Product Creation**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: None

**Expected Response (401)**:

```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "statusCode": 401
}
```

#### **3. Customer Tries to Create Product**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: `Bearer {{customerToken}}`

**Expected Response (403)**:

```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "statusCode": 403
}
```

#### **4. Invalid Product Data**

- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Authentication**: `Bearer {{adminToken}}`

**Request Body (Invalid)**:

```json
{
  "productName": "A",
  "cost": -10,
  "productImages": ["invalid-url"],
  "description": "Short",
  "stockStatus": ""
}
```

**Expected Response (400)**:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Product name must be between 2 and 200 characters",
      "path": "productName"
    },
    {
      "msg": "Cost must be a positive number",
      "path": "cost"
    }
  ],
  "statusCode": 400
}
```

#### **5. Delete Non-existent Product**

- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/products/507f1f77bcf86cd799439011`
- **Authentication**: `Bearer {{adminToken}}`

**Expected Response (404)**:

```json
{
  "success": false,
  "message": "Product not found",
  "statusCode": 404
}
```

---

## 🔄 **Complete Testing Workflow**

### **Recommended Testing Sequence**:

1. **🏥 Health Check**

   - Verify server is running
   - Check response time

2. **🔐 Register Admin**

   - Create admin account
   - Save admin token

3. **🔐 Register Customer**

   - Create customer account
   - Save customer token

4. **🛍️ Get Products (Empty)**

   - Verify endpoint works
   - Should return empty array initially

5. **📦 Create Product**

   - Use admin token
   - Save product ID

6. **🛍️ Get Products (With Data)**

   - Verify product appears in list
   - Check product details

7. **🗑️ Delete Product**

   - Use saved product ID
   - Verify deletion success

8. **🚫 Test Error Scenarios**
   - Invalid data validation
   - Unauthorized access
   - Role-based restrictions

---

## 🎯 **Variables Reference**

### **Collection Variables** (Auto-managed):

- `authToken` - Current active token
- `adminToken` - Admin user JWT token
- `customerToken` - Customer user JWT token
- `productId` - Last created product ID

### **Environment Variables**:

- `url` - Base API URL
- `environment` - Environment name

---

## 🧪 **Testing Tips**

### **✅ Success Indicators**:

- Status codes: 200, 201
- `"success": true` in response
- Required fields present
- Tokens saved automatically

### **❌ Error Indicators**:

- Status codes: 400, 401, 403, 404, 500
- `"success": false` in response
- Error messages explain the issue

### **🔍 Debugging**:

- Check Postman Console for logs
- Verify environment is selected
- Check token variables are set
- Review request headers and body

---

## 🚀 **Advanced Usage**

### **Newman CLI Testing**:

```bash
# Install Newman
npm install -g newman

# Run collection against production
newman run postman_collection_v2.json -e postman_environment_production.json

# Generate HTML report
newman run postman_collection_v2.json -e postman_environment_production.json --reporters cli,html --reporter-html-export report.html
```

### **Automated Testing Script**:

```bash
# Run all tests and save results
newman run postman_collection_v2.json -e postman_environment_production.json --reporters json --reporter-json-export results.json
```

---

## 📊 **Expected Test Results**

When running the complete collection, you should see:

```
✅ Health Check: PASSED
✅ Register Admin User: PASSED
✅ Register Customer User: PASSED
✅ Login Admin: PASSED
✅ Login Customer: PASSED
✅ Get All Products: PASSED
✅ Create Product: PASSED
✅ Create Product Without Images: PASSED
✅ Delete Product: PASSED
✅ Invalid Registration Data: PASSED (400 error expected)
✅ Unauthorized Product Creation: PASSED (401 error expected)
✅ Customer Tries to Create Product: PASSED (403 error expected)
✅ Invalid Product Data: PASSED (400 error expected)
✅ Delete Non-existent Product: PASSED (404 error expected)
```

**Total: 14/14 tests passing** 🎉

---

## 🆘 **Troubleshooting**

### **Common Issues**:

**❌ "Could not get response"**

- Check internet connection
- Verify API URL is correct
- Server might be sleeping (Render free tier)

**❌ "401 Unauthorized"**

- Run login request to refresh token
- Check Authorization header format
- Verify token is saved in variables

**❌ "403 Forbidden"**

- Check user role (admin vs customer)
- Use admin token for admin endpoints
- Re-register admin if needed

**❌ "Validation failed"**

- Check request body format
- Verify all required fields
- Check data types and constraints

---

## 🎉 **You're All Set!**

Your e-commerce API is fully functional and ready for production use. The Postman collection provides comprehensive testing coverage for all endpoints, error scenarios, and security features.

**API URL**: `https://e-commerce-app-2jf2.onrender.com`

Happy testing! 🚀
