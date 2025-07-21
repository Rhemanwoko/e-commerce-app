const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup/testDb');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.fullName).toBe(validUserData.fullName);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.role).toBe(validUserData.role);
      expect(response.body.data.user.password).toBeUndefined(); // Should not return password
    });

    it('should register an admin user successfully', async () => {
      const adminData = {
        ...validUserData,
        email: 'admin@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should return error for missing fullName', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.fullName;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for missing email', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.email;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for missing password', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.password;

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for invalid email format', async () => {
      const invalidData = {
        ...validUserData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for invalid role', async () => {
      const invalidData = {
        ...validUserData,
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for short password', async () => {
      const invalidData = {
        ...validUserData,
        password: '123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for duplicate email', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      const duplicateData = {
        ...validUserData,
        fullName: 'Jane Doe'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /auth/login', () => {
    let registeredUser;

    beforeEach(async () => {
      // Register a user for login tests
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      registeredUser = userData;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: registeredUser.email,
        password: registeredUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(registeredUser.email);
      expect(response.body.data.user.password).toBeUndefined(); // Should not return password
    });

    it('should return error for missing email', async () => {
      const loginData = {
        password: registeredUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for missing password', async () => {
      const loginData = {
        email: registeredUser.email
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: registeredUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for wrong password', async () => {
      const loginData = {
        email: registeredUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should generate valid JWT token on successful login', async () => {
      const loginData = {
        email: registeredUser.email,
        password: registeredUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token contains correct user information
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(registeredUser.email);
      expect(decoded.role).toBe(registeredUser.role);
      expect(decoded.userId).toBeDefined();
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        fullName: 'Integration User',
        email: 'integration@example.com',
        password: 'integrationpass123',
        role: 'admin'
      };

      // Register
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const registerToken = registerResponse.body.data.token;

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const loginToken = loginResponse.body.data.token;

      // Both tokens should be valid but different (different timestamps)
      expect(registerToken).toBeDefined();
      expect(loginToken).toBeDefined();
      expect(typeof registerToken).toBe('string');
      expect(typeof loginToken).toBe('string');

      // Verify both tokens contain same user info
      const jwt = require('jsonwebtoken');
      const decodedRegister = jwt.verify(registerToken, process.env.JWT_SECRET);
      const decodedLogin = jwt.verify(loginToken, process.env.JWT_SECRET);

      expect(decodedRegister.email).toBe(decodedLogin.email);
      expect(decodedRegister.role).toBe(decodedLogin.role);
      expect(decodedRegister.userId).toBe(decodedLogin.userId);
    });
  });
});