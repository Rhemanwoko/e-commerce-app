const { generateToken, verifyToken } = require('../../../src/utils/jwt');
const jwt = require('jsonwebtoken');

// Mock environment variables
const originalEnv = process.env;

describe('JWT Utilities', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key',
      JWT_EXPIRES_IN: '1h'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'customer'
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: 'admin'
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iss).toBe('ecommerce-api');
    });

    it('should throw error for missing userId', () => {
      const payload = {
        email: 'test@example.com',
        role: 'customer'
      };

      expect(() => generateToken(payload)).toThrow('Missing required payload fields: userId, email, role');
    });

    it('should throw error for missing email', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        role: 'customer'
      };

      expect(() => generateToken(payload)).toThrow('Missing required payload fields: userId, email, role');
    });

    it('should throw error for missing role', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };

      expect(() => generateToken(payload)).toThrow('Missing required payload fields: userId, email, role');
    });

    it('should use default expiration if JWT_EXPIRES_IN not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'customer'
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Default is 24h, so expiration should be about 24 hours from now
      const expectedExp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      expect(decoded.exp).toBeCloseTo(expectedExp, -2); // Allow 100 second tolerance
    });
  });

  describe('verifyToken', () => {
    let validToken;
    let payload;

    beforeEach(() => {
      payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'customer'
      };
      validToken = generateToken(payload);
    });

    it('should verify and decode a valid token', () => {
      const decoded = verifyToken(validToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should handle Bearer token format', () => {
      const bearerToken = `Bearer ${validToken}`;
      const decoded = verifyToken(bearerToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for missing token', () => {
      expect(() => verifyToken()).toThrow('Token is required');
      expect(() => verifyToken('')).toThrow('Token is required');
      expect(() => verifyToken(null)).toThrow('Token is required');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret');
      
      expect(() => verifyToken(tokenWithWrongSecret)).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
        process.env.JWT_SECRET
      );
      
      expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
    });

    it('should throw error for token not active yet', () => {
      const futureToken = jwt.sign(
        { ...payload, nbf: Math.floor(Date.now() / 1000) + 3600 }, // Not before 1 hour from now
        process.env.JWT_SECRET
      );
      
      expect(() => verifyToken(futureToken)).toThrow('Token not active yet');
    });

    it('should handle malformed token gracefully', () => {
      const malformedToken = 'not.a.valid.jwt.token.format';
      
      expect(() => verifyToken(malformedToken)).toThrow('Invalid token');
    });
  });

  describe('Token Integration', () => {
    it('should generate and verify token successfully', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'integration@example.com',
        role: 'admin'
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should work with Bearer token format in integration', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'bearer@example.com',
        role: 'customer'
      };

      const token = generateToken(payload);
      const bearerToken = `Bearer ${token}`;
      const decoded = verifyToken(bearerToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });
});