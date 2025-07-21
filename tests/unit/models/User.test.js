const User = require('../../../src/models/User');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../setup/testDb');

describe('User Model', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.fullName).toBe(userData.fullName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'plainpassword',
        role: 'admin'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // Hashed password is longer
    });

    it('should default role to customer', async () => {
      const userData = {
        fullName: 'Default User',
        email: 'default@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('customer');
    });
  });

  describe('User Validation', () => {
    it('should require fullName', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Full name is required');
    });

    it('should require email', async () => {
      const userData = {
        fullName: 'Test User',
        password: 'password123',
        role: 'customer'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require password', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should validate email format', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'customer'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Please enter a valid email address');
    });

    it('should validate role enum', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Role must be either admin or customer');
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        fullName: 'User One',
        email: 'same@example.com',
        password: 'password123',
        role: 'customer'
      };

      const userData2 = {
        fullName: 'User Two',
        email: 'same@example.com',
        password: 'password456',
        role: 'admin'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    it('should compare password correctly', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'customer'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('testpassword');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should exclude password from JSON output', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'customer'
      };

      const user = new User(userData);
      await user.save();

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.fullName).toBe(userData.fullName);
      expect(userJSON.email).toBe(userData.email);
      expect(userJSON.role).toBe(userData.role);
    });
  });
});