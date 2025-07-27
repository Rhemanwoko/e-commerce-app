# 📮 Postman API Documentation v2.0

## 🚀 **What's New in v2.0**

- **Multiple Environments**: Local development and production (Render) environments
- **Enhanced Testing**: Comprehensive test scripts for all endpoints
- **Better Token Management**: Separate admin and customer tokens
- **Error Testing**: Dedicated error scenarios and validation testing
- **Workflow Testing**: Complete API workflow examples
- **Auto-saving Variables**: Product IDs and tokens saved automatically

## 📁 **Files Included**

1. **`postman_collection_v2.json`** - Main collection with all endpoints
2. **`postman_environment_local.json`** - Local development environment
3. **`postman_environment_production.json`** - Production (Render) environment

## 🛠️ **Setup Instructions**

### **Step 1: Import Collection**

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `postman_collection_v2.json`
4. Click **Import**

### **Step 2: Import Environments**

1. Click **Import** again
2. Select both environment files:
   - `postman_environment_local.json`
   - `postman_environment_production.json`
3. Click **Import**

### **Step 3: Configure Production Environment**

1. Select **Production (Render)** environment
2. Edit the `url` variable
3. Replace `your-app-name` with your actual Render app name
4. Save the environment

### **Step 4: Select Environment**

- For local testing: Select **Local Development**
- For production testing: Select **Production (Render)**

## 📋 **Collection Structure**

### **🏥 Health & Status**

- **Health Check** - Verify server is running

### **🔐 Authentication**

- **Register Admin User** - Create admin account (saves admin token)
- **Register Customer User** - Create customer account (saves customer token)
- **Login Admin** - Admin login (updates admin token)
- **Login Customer** - Customer login (updates customer token)

### **🛍️ Products**

- **Get All Products (Public)** - Retrieve all products (no auth required)
- **Create Product (Admin Only)** - Create new product (saves product ID)
- **Create Product Without Images** - Test product creation without images
- **Delete Product (Admin Only)** - Delete product using saved ID

### **🚫 Error Testing**

- **Invalid Registration Data** - Test validation errors
- **Unauthorized Product Creation** - Test missing authentication
- **Customer Tries to Create Product** - Test role-based access control
- **Invalid Product Data** - Test product validation
- **Delete Non-existent Product** - Test 404 error handling

### **🔄 Complete Workflow**

- **Full API Workflow Test** - Placeholder for complete testing sequence

## 🔧 **Variables Used**

### **Collection Variables** (Auto-managed)

- `authToken` - Current authentication token
- `adminToken` - Admin user JWT token
- `customerToken` - Customer user JWT token
- `productId` - Last created product ID

### **Environment Variables**

- `url` - Base API URL (changes per environment)
- `environment` - Current environment name

## 🧪 **Testing Features**

### **Automatic Tests**

Every request includes tests that verify:

- ✅ Correct HTTP status codes
- ✅ Response structure and required fields
- ✅ Authentication and authorization
- ✅ Data validation
- ✅ Response time (< 5 seconds)

### **Token Management**

- Tokens are automatically saved after registration/login
- Admin and customer tokens are managed separately
- Current token is used for authenticated requests

### **Error Validation**

- Tests verify proper error responses
- Validation errors are checked for correct format
- Authorization errors are properly handled

## 🚀 **Quick Start Guide**

### **For Local Development:**

1. Start your local server: `npm run dev`
2. Select **Local Development** environment
3. Run **Health Check** to verify connection
4. Run **Register Admin User** to create admin account
5. Run **Create Product** to test product creation
6. Run **Get All Products** to verify product was created

### **For Production Testing:**

1. Update production environment URL with your Render app name
2. Select **Production (Render)** environment
3. Run **Health Check** to verify deployment
4. Run **Register Admin User** to create admin account
5. Test all endpoints to verify production deployment

## 📊 **Test Scenarios**

### **Happy Path Testing**

1. Health Check → Register Admin → Create Product → Get Products → Delete Product

### **Authentication Testing**

1. Register Admin → Login Admin → Verify token works
2. Register Customer → Login Customer → Try admin actions (should fail)

### **Error Testing**

1. Invalid registration data → Verify validation errors
2. Unauthorized requests → Verify 401 responses
3. Forbidden actions → Verify 403 responses
4. Invalid product data → Verify validation errors

### **Role-Based Access Testing**

1. Customer tries to create product → Should get 403
2. Customer tries to delete product → Should get 403
3. Admin creates/deletes products → Should work

## 🔍 **Debugging Tips**

### **Console Logs**

- Check Postman console for detailed logs
- Success messages show ✅
- Error messages show ❌
- Environment info is logged for each request

### **Common Issues**

**❌ Connection Refused**

- Check if server is running locally
- Verify correct environment is selected
- Check URL in environment variables

**❌ 401 Unauthorized**

- Run login request to refresh token
- Check if token is saved in variables
- Verify Authorization header format

**❌ 403 Forbidden**

- Check user role (admin vs customer)
- Verify you're using admin token for admin endpoints
- Re-register admin user if needed

**❌ Validation Errors**

- Check request body format
- Verify all required fields are included
- Check data types and constraints

## 📈 **Advanced Usage**

### **Running Collection with Newman**

```bash
# Install Newman
npm install -g newman

# Run collection locally
newman run postman_collection_v2.json -e postman_environment_local.json

# Run collection against production
newman run postman_collection_v2.json -e postman_environment_production.json
```

### **Automated Testing**

```bash
# Run tests and generate report
newman run postman_collection_v2.json -e postman_environment_local.json --reporters cli,html --reporter-html-export report.html
```

### **CI/CD Integration**

Add Newman to your CI/CD pipeline to automatically test your API after deployment.

## 🎯 **Best Practices**

1. **Always start with Health Check** to verify connectivity
2. **Register admin user first** for testing admin endpoints
3. **Use appropriate environment** (local vs production)
4. **Check console logs** for detailed debugging info
5. **Run error tests** to verify proper error handling
6. **Test role-based access** to ensure security

## 🆘 **Support**

If you encounter issues:

1. Check the console logs in Postman
2. Verify environment variables are set correctly
3. Ensure server is running and accessible
4. Check authentication tokens are valid
5. Review the API documentation in README.md

---

## 🎉 **Happy Testing!**

This comprehensive Postman collection will help you thoroughly test your e-commerce API in both development and production environments. The automated tests and token management make it easy to verify all functionality works correctly.

For more detailed API documentation, see the main [README.md](README.md) file.
