const crypto = require("crypto");

/**
 * Environment validation and configuration utility
 * Validates required environment variables and ensures secure configuration
 */
class EnvironmentValidator {
  constructor() {
    this.requiredVariables = ["JWT_SECRET", "MONGODB_URI"];

    this.optionalVariables = {
      NODE_ENV: "development",
      PORT: "3000",
      JWT_EXPIRES_IN: "24h",
    };
  }

  /**
   * Validate that all required environment variables are present
   * @param {Array} variables - Array of required variable names
   * @throws {Error} If any required variable is missing
   */
  validateRequired(variables = this.requiredVariables) {
    const missing = variables.filter((variable) => !process.env[variable]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    console.log("✓ All required environment variables are present");
    return true;
  }

  /**
   * Validate JWT_SECRET meets security requirements
   * @param {string} secret - JWT secret to validate
   * @throws {Error} If secret doesn't meet requirements
   */
  validateJWTSecret(secret = process.env.JWT_SECRET) {
    if (!secret) {
      throw new Error("JWT_SECRET is required");
    }

    if (typeof secret !== "string") {
      throw new Error("JWT_SECRET must be a string");
    }

    if (secret.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters long for security"
      );
    }

    // Check if it's the default example value
    if (
      secret.includes("your_super_secret_jwt_key_change_this_in_production")
    ) {
      throw new Error(
        "JWT_SECRET cannot be the default example value. Please set a unique secret."
      );
    }

    // Warn if secret appears to be weak
    if (secret.length < 64) {
      console.warn(
        "⚠️  JWT_SECRET is less than 64 characters. Consider using a longer secret for enhanced security."
      );
    }

    console.log("✓ JWT_SECRET validation passed");
    return true;
  }

  /**
   * Validate and set default values for optional environment variables
   */
  validateAndSetDefaults() {
    Object.entries(this.optionalVariables).forEach(([key, defaultValue]) => {
      if (!process.env[key]) {
        process.env[key] = defaultValue;
        console.log(`ℹ️  Set ${key} to default value: ${defaultValue}`);
      }
    });

    // Validate NODE_ENV is a known value
    const validEnvironments = ["development", "production", "test"];
    if (!validEnvironments.includes(process.env.NODE_ENV)) {
      console.warn(
        `⚠️  NODE_ENV '${
          process.env.NODE_ENV
        }' is not a standard value. Expected: ${validEnvironments.join(", ")}`
      );
    }

    console.log("✓ Environment defaults validated and set");
    return true;
  }

  /**
   * Log configuration status without exposing sensitive values
   */
  logConfiguration() {
    console.log("\n🔧 Environment Configuration:");
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN}`);
    console.log(
      `   MONGODB_URI: ${process.env.MONGODB_URI ? "[SET]" : "[NOT SET]"}`
    );
    console.log(
      `   JWT_SECRET: ${
        process.env.JWT_SECRET
          ? "[SET - " + process.env.JWT_SECRET.length + " chars]"
          : "[NOT SET]"
      }`
    );

    if (process.env.ALLOWED_ORIGINS) {
      console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);
    }
    console.log("");
  }

  /**
   * Perform complete environment validation
   * @throws {Error} If validation fails
   */
  validateAll() {
    try {
      console.log("🔍 Starting environment validation...\n");

      this.validateRequired();
      this.validateJWTSecret();
      this.validateAndSetDefaults();
      this.logConfiguration();

      console.log("✅ Environment validation completed successfully\n");
      return true;
    } catch (error) {
      console.error("❌ Environment validation failed:", error.message);
      throw error;
    }
  }
}

module.exports = {
  EnvironmentValidator,
  validateEnvironment: () => new EnvironmentValidator().validateAll(),
};
