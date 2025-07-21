const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/testDb');

describe('Product Endpoints', () => {
  let adminUser, customerUser, adminToken, customerToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create admin user
    const adminData = {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'admin'
    };

    const adminResponse = await request(app)
      .post('/auth/register')
      .send(adminData);

    adminUser = adminResponse.body.data.user;
    adminToken = adminResponse.body.data.token;

    // Create customer user
    const customerData = {
      fullName: 'Customer User',
      email: 'customer@example.com',
      password: 'customerpass123',
      role: 'customer'
    };

    const customerResponse = await request(app)
      .post('/auth/register')
      .send(customerData);

    customerUser = customerResponse.body.data.user;
    customerToken = customerResponse.body.data.token;
  });

  describe('GET /products', () => {
    it('should get empty product list when no products exist', async () => {
      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Products retrieved successfully');
      expect(response.body.data.products).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should get all products without authentication', async () => {
      // Create a test product first
      const productData = {
        productName: 'Test Product',
        cost: 99.99,
        productImages: ['https://example.com/image.jpg'],
        description: 'This is a test product description',
        stockStatus: 'In Stock'
      };

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.count).toBe(1);
      expect(response.body.data.products[0].productName).toBe(productData.productName);
      expect(response.body.data.products[0].ownerId).toBeDefined();
    });

    it('should populate owner information in product list', async () => {
      const productData = {
        productName: 'Test Product',
        cost: 99.99,
        description: 'This is a test product description',
        stockStatus: 'In Stock'
      };

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.data.products[0].ownerId.fullName).toBe(adminUser.fullName);
      expect(response.body.data.products[0].ownerId.email).toBe(adminUser.email);
      expect(response.body.data.products[0].ownerId.password).toBeUndefined();
    });

    it('should return products sorted by creation date (newest first)', async () => {
      const product1Data = {
        productName: 'First Product',
        cost: 50.00,
        description: 'First product description',
        stockStatus: 'In Stock'
      };

      const product2Data = {
        productName: 'Second Product',
        cost: 75.00,
        description: 'Second product description',
        stockStatus: 'Available'
      };

      // Create products with slight delay
      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(product1Data);

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(product2Data);

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products[0].productName).toBe('Second Product'); // Newest first
      expect(response.body.data.products[1].productName).toBe('First Product');
    });
  });

  describe('POST /products', () => {
    const validProductData = {
      productName: 'New Product',
      cost: 149.99,
      productImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      description: 'This is a new product with detailed description',
      stockStatus: 'In Stock'
    };

    it('should create product with admin authentication', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.productName).toBe(validProductData.productName);
      expect(response.body.data.product.cost).toBe(validProductData.cost);
      expect(response.body.data.product.ownerId._id).toBe(adminUser._id);
      expect(response.body.data.product.ownerId.fullName).toBe(adminUser.fullName);
    });

    it('should create product without images array', async () => {
      const productWithoutImages = {
        ...validProductData,
        productImages: undefined
      };
      delete productWithoutImages.productImages;

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithoutImages)
        .expect(201);

      expect(response.body.data.product.productImages).toEqual([]);
    });

    it('should return error when customer tries to create product', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validProductData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });

    it('should return error when no authentication provided', async () => {
      const response = await request(app)
        .post('/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', 'Bearer invalid-token')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing productName', async () => {
      const invalidData = { ...validProductData };
      delete invalidData.productName;

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for missing cost', async () => {
      const invalidData = { ...validProductData };
      delete invalidData.cost;

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for negative cost', async () => {
      const invalidData = {
        ...validProductData,
        cost: -10.00
      };

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for missing description', async () => {
      const invalidData = { ...validProductData };
      delete invalidData.description;

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for short description', async () => {
      const invalidData = {
        ...validProductData,
        description: 'Short'
      };

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for invalid image URLs', async () => {
      const invalidData = {
        ...validProductData,
        productImages: ['invalid-url', 'https://valid.com/image.jpg']
      };

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      // Create a test product
      const productData = {
        productName: 'Product to Delete',
        cost: 99.99,
        description: 'This product will be deleted in tests',
        stockStatus: 'In Stock'
      };

      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      testProduct = response.body.data.product;
    });

    it('should delete product with admin authentication', async () => {
      const response = await request(app)
        .delete(`/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
      expect(response.body.data.deletedProduct._id).toBe(testProduct._id);

      // Verify product is actually deleted
      const getResponse = await request(app)
        .get('/products')
        .expect(200);

      expect(getResponse.body.data.products).toHaveLength(0);
    });

    it('should return error when customer tries to delete product', async () => {
      const response = await request(app)
        .delete(`/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });

    it('should return error when no authentication provided', async () => {
      const response = await request(app)
        .delete(`/products/${testProduct._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should return error for invalid product ID format', async () => {
      const response = await request(app)
        .delete('/products/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for non-existent product ID', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .delete(`/products/${testProduct._id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Product Endpoints Integration', () => {
    it('should complete full product lifecycle (create, read, delete)', async () => {
      const productData = {
        productName: 'Lifecycle Product',
        cost: 199.99,
        productImages: ['https://example.com/lifecycle.jpg'],
        description: 'Product for testing complete lifecycle',
        stockStatus: 'Available'
      };

      // Create product
      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      const createdProduct = createResponse.body.data.product;
      expect(createdProduct.productName).toBe(productData.productName);

      // Read products (should include our product)
      const readResponse = await request(app)
        .get('/products')
        .expect(200);

      expect(readResponse.body.data.products).toHaveLength(1);
      expect(readResponse.body.data.products[0]._id).toBe(createdProduct._id);

      // Delete product
      const deleteResponse = await request(app)
        .delete(`/products/${createdProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify product is deleted
      const finalReadResponse = await request(app)
        .get('/products')
        .expect(200);

      expect(finalReadResponse.body.data.products).toHaveLength(0);
    });

    it('should handle multiple products from different admins', async () => {
      // Create second admin
      const admin2Data = {
        fullName: 'Second Admin',
        email: 'admin2@example.com',
        password: 'admin2pass123',
        role: 'admin'
      };

      const admin2Response = await request(app)
        .post('/auth/register')
        .send(admin2Data);

      const admin2Token = admin2Response.body.data.token;

      // Create products from both admins
      const product1Data = {
        productName: 'Admin 1 Product',
        cost: 100.00,
        description: 'Product created by first admin',
        stockStatus: 'In Stock'
      };

      const product2Data = {
        productName: 'Admin 2 Product',
        cost: 200.00,
        description: 'Product created by second admin',
        stockStatus: 'Available'
      };

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(product1Data)
        .expect(201);

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${admin2Token}`)
        .send(product2Data)
        .expect(201);

      // Get all products
      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.productName);
      expect(productNames).toContain('Admin 1 Product');
      expect(productNames).toContain('Admin 2 Product');

      // Verify different owners
      const owners = response.body.data.products.map(p => p.ownerId.email);
      expect(owners).toContain(adminUser.email);
      expect(owners).toContain(admin2Data.email);
    });
  });
});