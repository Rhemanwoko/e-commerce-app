const { getProfile } = require("../../../src/controllers/profileController");
const User = require("../../../src/models/User");
const { logger } = require("../../../src/utils/logger");

// Mock dependencies
jest.mock("../../../src/models/User");
jest.mock("../../../src/utils/logger");

describe("Profile Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        userId: "507f1f77bcf86cd799439011",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user profile successfully", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        email: "john@example.com",
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile retrieved successfully",
        data: mockUser,
        statusCode: 200,
      });
    });

    it("should return 404 when user not found", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
    });

    it("should exclude password from response", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        email: "john@example.com",
        role: "customer",
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ select: selectMock });

      await getProfile(req, res);

      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            password: expect.anything(),
          }),
        })
      );
    });

    it("should handle authentication errors gracefully", async () => {
      req.user = undefined;

      await getProfile(req, res);

      // Should handle missing user gracefully
      expect(User.findById).toHaveBeenCalledWith(undefined);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await getProfile(req, res);

      expect(logger.logSystemError).toHaveBeenCalledWith(
        "Profile retrieval error",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: undefined, // Should not expose error in production
        statusCode: 500,
      });
    });

    it("should expose error message in development environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Database connection failed");
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: "Database connection failed",
        statusCode: 500,
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should work for admin users", async () => {
      const mockAdmin = {
        _id: "507f1f77bcf86cd799439012",
        fullName: "Admin User",
        email: "admin@example.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      req.user.userId = "507f1f77bcf86cd799439012";
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin),
      });

      await getProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439012");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile retrieved successfully",
        data: mockAdmin,
        statusCode: 200,
      });
    });
  });
});
