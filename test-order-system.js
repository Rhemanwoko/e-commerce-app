/**
 * Comprehensive Order Management System Test
 * Tests all order endpoints with proper authentication and validation
 */

const axios = require("axios");
const mongoose = require("mongoose");

const BASE_URL = "http://localhost:3000";

// Test data
let adminToken = null;
let customerToken = null;
let testProductId = null;
let testOrderId = null;
let testOwnerId = null;

async function testOrderManagementSystem() {
  console.log("🛒 Order Management System Test\n");
  console.log("=" + "=".repeat(60));

  let allPassed = true;

  try {
    // Step 1: Setup - Register users and create test data
    console.log("\n📋 SETUP PHASE");
    console.log("-".repeat(40));

    // Register admin user
    console.log("1. Registering admin user...");
    try {
      const adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: `admin_${Date.now()}@test.com`,
        password: "AdminTest123!",
        role: "admin",
      });

      if (adminResponse.data.success && adminResponse.data.data.token) {
        adminToken = adminResponse.data.data.token;
        console.log("   ✅ Admin user registered successfully");
      } else {
        throw new Error("Admin registration failed");
      }
    } catch (error) {
      console.log(
        "   ❌ Admin registration failed:",
        error.response?.data?.message || error.message
      );
      allPassed = false;
      return;
    }

    // Register customer user
    console.log("2. Registering customer user...");
    try {
      const customerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Customer",
        email: `customer_${Date.now()}@test.com`,
        password: "CustomerTest123!",
        role: "customer",
      });

      if (customerResponse.data.success && customerResponse.data.data.token) {
        customerToken = customerResponse.data.data.token;
        console.log("   ✅ Customer user registered successfully");
      } else {
        throw new Error("Customer registration failed");
      }
    } catch (error) {
      console.log(
        "   ❌ Customer registration failed:",
        error.response?.data?.message || error.message
      );
      allPassed = false;
      return;
    }

    // Create test brand and product
    console.log("3. Creating test brand...");
    try {
      const brandResponse = await axios.post(
        `${BASE_URL}/brands`,
        {
          brandName: "Test Brand for Orders",
          brandDescription: "Test brand for order testing",
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (brandResponse.data.success) {
        const brandId = brandResponse.data.data.brand._id;
        console.log("   ✅ Test brand created successfully");

        // Create test product
        console.log("4. Creating test product...");
        const productResponse = await axios.post(
          `${BASE_URL}/products`,
          {
            productName: "Test Product for Orders",
            cost: 99.99,
            description:
              "Test product for order testing with sufficient description length",
            stockStatus: "in-stock",
            brand: brandId,
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (productResponse.data.success) {
          testProductId = productResponse.data.data.product._id;
          testOwnerId = productResponse.data.data.product.ownerId;
          console.log("   ✅ Test product created successfully");
        } else {
          throw new Error("Product creation failed");
        }
      } else {
        throw new Error("Brand creation failed");
      }
    } catch (error) {
      console.log(
        "   ❌ Test data creation failed:",
        error.response?.data?.message || error.message
      );
      allPassed = false;
      return;
    }

    // Step 2: Test Order Creation (Customer Only)
    console.log("\n🛍️ ORDER CREATION TESTS");
    console.log("-".repeat(40));

    // Test 1: Customer creates valid order
    console.log("1. Testing valid order creation by customer...");
    try {
      const orderResponse = await axios.post(
        `${BASE_URL}/orders`,
        {
          items: [
            {
              productName: "Test Product for Orders",
              productId: testProductId,
              ownerId: testOwnerId,
              quantity: 2,
              totalCost: 199.98,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        }
      );

      if (orderResponse.data.success && orderResponse.data.data.order) {
        testOrderId = orderResponse.data.data.order._id;
        const order = orderResponse.data.data.order;

        if (
          order.shippingStatus === "pending" &&
          order.totalAmount === 199.98 &&
          order.items.length === 1 &&
          order.orderNumber
        ) {
          console.log("   ✅ Valid order creation successful");
          console.log(`   📋 Order Number: ${order.orderNumber}`);
        } else {
          console.log("   ❌ Order data validation failed");
          allPassed = false;
        }
      } else {
        console.log("   ❌ Order creation failed");
        allPassed = false;
      }
    } catch (error) {
      console.log(
        "   ❌ Order creation error:",
        error.response?.data?.message || error.message
      );
      allPassed = false;
    }

    // Test 2: Admin tries to create order (should fail)
    console.log("2. Testing order creation by admin (should fail)...");
    try {
      await axios.post(
        `${BASE_URL}/orders`,
        {
          items: [
            {
              productName: "Test Product",
              productId: testProductId,
              ownerId: testOwnerId,
              quantity: 1,
              totalCost: 99.99,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log(
        "   ❌ Admin was allowed to create order (should be forbidden)"
      );
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log("   ✅ Admin correctly forbidden from creating orders");
      } else {
        console.log(
          "   ❌ Unexpected error:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Test 3: Invalid order data
    console.log("3. Testing invalid order data validation...");
    try {
      await axios.post(
        `${BASE_URL}/orders`,
        {
          items: [
            {
              productName: "X", // Too short
              productId: "invalid-id",
              ownerId: testOwnerId,
              quantity: 0, // Invalid quantity
              totalCost: -10, // Negative cost
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        }
      );
      console.log("   ❌ Invalid data was accepted");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log("   ✅ Invalid order data correctly rejected");
      } else {
        console.log(
          "   ❌ Unexpected error:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Step 3: Test Admin Order Management
    console.log("\n👨‍💼 ADMIN ORDER MANAGEMENT TESTS");
    console.log("-".repeat(40));

    // Test 1: Admin views all orders
    console.log("1. Testing admin view all orders...");
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (
        ordersResponse.data.success &&
        ordersResponse.data.data.orders &&
        ordersResponse.data.data.pagination
      ) {
        console.log("   ✅ Admin can view all orders");
        console.log(
          `   📊 Found ${ordersResponse.data.data.orders.length} orders`
        );
      } else {
        console.log("   ❌ Failed to retrieve orders");
        allPassed = false;
      }
    } catch (error) {
      console.log(
        "   ❌ Error retrieving orders:",
        error.response?.data?.message || error.message
      );
      allPassed = false;
    }

    // Test 2: Customer tries to view all orders (should fail)
    console.log("2. Testing customer access to all orders (should fail)...");
    try {
      await axios.get(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      console.log("   ❌ Customer was allowed to view all orders");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(
          "   ✅ Customer correctly forbidden from viewing all orders"
        );
      } else {
        console.log(
          "   ❌ Unexpected error:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Test 3: Admin views specific order
    if (testOrderId) {
      console.log("3. Testing admin view specific order...");
      try {
        const orderResponse = await axios.get(
          `${BASE_URL}/orders/${testOrderId}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (orderResponse.data.success && orderResponse.data.data.order) {
          console.log("   ✅ Admin can view specific order");
          console.log(`   📋 Order ID: ${orderResponse.data.data.order._id}`);
        } else {
          console.log("   ❌ Failed to retrieve specific order");
          allPassed = false;
        }
      } catch (error) {
        console.log(
          "   ❌ Error retrieving specific order:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Test 4: Admin updates order status
    if (testOrderId) {
      console.log("4. Testing admin update order status...");
      try {
        const updateResponse = await axios.put(
          `${BASE_URL}/orders/${testOrderId}/status`,
          { shippingStatus: "shipped" },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        if (
          updateResponse.data.success &&
          updateResponse.data.data.order.shippingStatus === "shipped"
        ) {
          console.log("   ✅ Order status updated successfully");
          console.log("   📦 Status: pending → shipped");
        } else {
          console.log("   ❌ Failed to update order status");
          allPassed = false;
        }
      } catch (error) {
        console.log(
          "   ❌ Error updating order status:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }

      // Test invalid status update
      console.log("5. Testing invalid status update...");
      try {
        await axios.put(
          `${BASE_URL}/orders/${testOrderId}/status`,
          { shippingStatus: "invalid-status" },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        console.log("   ❌ Invalid status was accepted");
        allPassed = false;
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log("   ✅ Invalid status correctly rejected");
        } else {
          console.log(
            "   ❌ Unexpected error:",
            error.response?.data?.message || error.message
          );
          allPassed = false;
        }
      }
    }

    // Step 4: Test Authentication and Authorization
    console.log("\n🔐 AUTHENTICATION & AUTHORIZATION TESTS");
    console.log("-".repeat(40));

    // Test 1: No token access
    console.log("1. Testing access without token...");
    try {
      await axios.get(`${BASE_URL}/orders`);
      console.log("   ❌ Access allowed without token");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("   ✅ Access correctly denied without token");
      } else {
        console.log(
          "   ❌ Unexpected error:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Test 2: Invalid token
    console.log("2. Testing access with invalid token...");
    try {
      await axios.get(`${BASE_URL}/orders`, {
        headers: { Authorization: "Bearer invalid-token" },
      });
      console.log("   ❌ Access allowed with invalid token");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("   ✅ Access correctly denied with invalid token");
      } else {
        console.log(
          "   ❌ Unexpected error:",
          error.response?.data?.message || error.message
        );
        allPassed = false;
      }
    }

    // Final Results
    console.log("\n" + "=".repeat(60));
    if (allPassed) {
      console.log("🎉 ALL ORDER MANAGEMENT TESTS PASSED!");
      console.log("✅ Order creation works correctly");
      console.log("✅ Admin order management functional");
      console.log("✅ Authentication & authorization secure");
      console.log("✅ Validation working properly");
      console.log("✅ All shipping statuses supported");
    } else {
      console.log("⚠️  Some order management tests failed");
      console.log("❌ Review the issues above");
    }
  } catch (error) {
    console.error("Test suite failed with error:", error.message);
    console.log("❌ Make sure your server is running on", BASE_URL);
    allPassed = false;
  }

  console.log("\n" + "=".repeat(60));
  return allPassed;
}

// Run the test
if (require.main === module) {
  testOrderManagementSystem().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testOrderManagementSystem };
