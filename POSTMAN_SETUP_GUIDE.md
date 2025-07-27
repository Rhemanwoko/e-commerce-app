# 🎯 Postman Setup Guide

## Step-by-Step Visual Instructions

---

## 📥 **Step 1: Import Collection**

### **What to do:**

1. Open Postman application
2. Click the **"Import"** button (top-left area)
3. Click **"Upload Files"** or drag and drop
4. Select `postman_collection_v2.json`
5. Click **"Import"**

### **What you'll see:**

- New collection appears: **"E-commerce API v2.0"**
- Contains 5 folders with 14+ requests
- Collection variables are automatically set

---

## 🌍 **Step 2: Import Environments**

### **What to do:**

1. Click **"Import"** again
2. Select both environment files:
   - `postman_environment_local.json`
   - `postman_environment_production.json`
3. Click **"Import"**

### **What you'll see:**

- Two new environments in the dropdown (top-right):
  - **"Local Development"**
  - **"Production (Render)"**

---

## ⚙️ **Step 3: Select Environment**

### **For Production Testing:**

1. Click environment dropdown (top-right)
2. Select **"Production (Render)"**
3. Verify URL shows: `https://e-commerce-app-2jf2.onrender.com`

### **Environment Variables:**

- `url`: `https://e-commerce-app-2jf2.onrender.com`
- `environment`: `production`

---

## 🧪 **Step 4: First Test**

### **Run Health Check:**

1. Expand **"🏥 Health & Status"** folder
2. Click **"Health Check"** request
3. Click **"Send"** button
4. Check response:
   - Status: `200 OK`
   - Body: `{"success": true, "message": "Server is running"}`

### **Expected Result:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-07-26T15:12:43.643Z",
  "statusCode": 200
}
```

---

## 👤 **Step 5: Register Admin User**

### **What to do:**

1. Expand **"🔐 Authentication"** folder
2. Click **"Register Admin User"**
3. Review the request body (already filled)
4. Click **"Send"**

### **Request Body (Pre-filled):**

```json
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "adminpass123",
  "role": "admin"
}
```

### **Expected Response:**

- Status: `201 Created`
- Response includes user data and JWT token
- Token is automatically saved to `adminToken` variable

### **Auto-Magic:**

- ✨ `adminToken` variable is set automatically
- ✨ `authToken` variable is set for immediate use
- ✨ Console shows: "✅ Admin user registered and token saved"

---

## 📦 **Step 6: Create Your First Product**

### **What to do:**

1. Expand **"🛍️ Products"** folder
2. Click **"Create Product (Admin Only)"**
3. Notice the Authorization header uses `{{adminToken}}`
4. Review the product data (already filled)
5. Click **"Send"**

### **Request Body (Pre-filled):**

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

### **Expected Response:**

- Status: `201 Created`
- Product created with owner information
- Product ID automatically saved to `productId` variable

---

## 🛍️ **Step 7: View All Products**

### **What to do:**

1. Click **"Get All Products (Public)"**
2. Click **"Send"**
3. See your created product in the list

### **Expected Response:**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "your_product_id",
        "productName": "Premium Laptop",
        "ownerId": {
          "_id": "your_admin_id",
          "fullName": "Admin User",
          "email": "admin@example.com"
        },
        "cost": 1299.99,
        "productImages": ["https://example.com/laptop1.jpg"],
        "description": "High-performance laptop...",
        "stockStatus": "In Stock"
      }
    ],
    "count": 1
  }
}
```

---

## 🗑️ **Step 8: Delete Product**

### **What to do:**

1. Click **"Delete Product (Admin Only)"**
2. Notice URL uses `{{productId}}` (auto-filled from Step 6)
3. Click **"Send"**

### **Expected Response:**

- Status: `200 OK`
- Confirmation message: "Product deleted successfully"

---

## 🚫 **Step 9: Test Error Scenarios**

### **Test Invalid Registration:**

1. Expand **"🚫 Error Testing"** folder
2. Click **"Invalid Registration Data"**
3. Click **"Send"**
4. Expect: `400 Bad Request` with validation errors

### **Test Unauthorized Access:**

1. Click **"Unauthorized Product Creation"**
2. Click **"Send"**
3. Expect: `401 Unauthorized` - "No token provided"

### **Test Role-Based Access:**

1. First, register a customer (if not done)
2. Click **"Customer Tries to Create Product"**
3. Click **"Send"**
4. Expect: `403 Forbidden` - "Insufficient permissions"

---

## 📊 **Step 10: Check Test Results**

### **In Postman Console:**

Look for these success messages:

- ✅ "Health Check: PASSED"
- ✅ "Admin user registered and token saved"
- ✅ "Product created and ID saved"
- ✅ "Products retrieved successfully"
- ✅ "Product deleted successfully"

### **In Test Results Tab:**

Each request shows:

- ✅ Status code tests
- ✅ Response structure tests
- ✅ Data validation tests
- ✅ Performance tests (< 5s response time)

---

## 🎛️ **Understanding the Interface**

### **Collection Structure:**

```
📁 E-commerce API v2.0
├── 🏥 Health & Status
│   └── Health Check
├── 🔐 Authentication
│   ├── Register Admin User
│   ├── Register Customer User
│   ├── Login Admin
│   └── Login Customer
├── 🛍️ Products
│   ├── Get All Products (Public)
│   ├── Create Product (Admin Only)
│   ├── Create Product Without Images
│   └── Delete Product (Admin Only)
├── 🚫 Error Testing
│   ├── Invalid Registration Data
│   ├── Unauthorized Product Creation
│   ├── Customer Tries to Create Product
│   ├── Invalid Product Data
│   └── Delete Non-existent Product
└── 🔄 Complete Workflow
    └── Full API Workflow Test
```

### **Variables Panel:**

- **Collection Variables**: `authToken`, `adminToken`, `customerToken`, `productId`
- **Environment Variables**: `url`, `environment`

### **Headers (Auto-managed):**

- `Content-Type: application/json` (for POST requests)
- `Authorization: Bearer {{adminToken}}` (for admin endpoints)

---

## 🔧 **Customization Options**

### **Change User Data:**

Edit the request bodies to use your own:

- Email addresses
- Names
- Passwords
- Product information

### **Add More Products:**

1. Duplicate "Create Product" request
2. Modify the product data
3. Run multiple times with different data

### **Test Different Scenarios:**

1. Create products with different stock statuses
2. Test with very long descriptions
3. Try different cost values
4. Test with empty image arrays

---

## 🎯 **Pro Tips**

### **Keyboard Shortcuts:**

- `Ctrl/Cmd + Enter`: Send request
- `Ctrl/Cmd + S`: Save request
- `Ctrl/Cmd + D`: Duplicate request

### **Viewing Responses:**

- **Pretty**: Formatted JSON view
- **Raw**: Plain text response
- **Preview**: HTML rendering (if applicable)

### **Console Debugging:**

- `View → Show Postman Console`
- See all request/response details
- View custom log messages from tests

### **Environment Switching:**

- Quickly switch between Local and Production
- All requests automatically use the correct URL
- No need to manually change endpoints

---

## 🎉 **You're Ready!**

Your Postman workspace is now fully configured with:

- ✅ Complete API collection
- ✅ Production environment
- ✅ Automated token management
- ✅ Comprehensive test coverage
- ✅ Error scenario testing

**Start testing your live API at**: `https://e-commerce-app-2jf2.onrender.com`

Happy API testing! 🚀
